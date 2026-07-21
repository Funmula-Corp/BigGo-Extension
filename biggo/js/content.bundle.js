import * as util from "./content/util"
import { getScriptDom } from "@/util.shared"
import constant from "./content/constant"
import couponIframe from "./content/couponIframe"
import storeIframe from "./content/storeIframe"
import * as googleSearchPage from "./content/searchIframe"
import mltIframe from "./content/mltIframe"
import dragIframe, { DRAG_MAX_HEIGHT } from "./content/dragIframe"
import idleCashback from "./content/idleCashback"
import imageMarker from "./content/imageMarker"
import * as SPA from "./content/historySPA"
import * as FrontendSender from "./prototype/Sender/frontend"
import ContentReceiver from "./prototype/Receiver/content"
import Receiver from "./prototype/Receiver/index"
import * as CouponIframeAlert from "./content/couponIframeAlert"
import EventBus from "./content/EventBus"
import { isSupportSearchRegion, isSupportImageSearch, getRegion } from "@shared/region"
import { getConfig } from "@shared/config"
import { getSiteList } from "@shared/sites"
import { isPopped, setPopped } from "@shared/status"
import { isLogin } from "@shared/user"
import { getQuery as getSearchEngineQuery } from "@shared/searchEngine"
import { isCashbackNindex as _isCashbackNindex, isActivity as isCashbackActivity } from "@shared/cashback"

function isGooglePage() {
  try {
    const url = new URL(window.location.href)
    return url.hostname.includes("google")
  } catch (e) { }

  return false
}

function isGoogleFirstPage() {
  try {
    const url = new URL(window.location.href)
    const start = url.searchParams.get("start")
    return !start || start == "0"
  } catch(e) {}

  return false
}

function isGoogleTextSearchPage() {
  try {
    const url = new URL(window.location.href)
    const udm = url.searchParams.get("udm")
    if (udm) {
      // udm 14 = web search
      return udm == "14"
    }
    const tabs = url.searchParams.get("tbm")
    return !tabs
  } catch(e) {}

  return false
}

/**
 * 處理奇特的nindex用的 有些可能是同一個站 但是不同nindex
 * @param {string} nindex
 * @returns {Promise<string>}
 */
async function checkNindex(nindex) {
  const result = await util.resolveTrueNindex(nindex)
  return result.nindex
}

/**
 * 處理一般的電商用的方法
 * @param {string} nindex
 * @returns {Promise<any>}
 */
async function handleNormalEC(nindex) {
  // 取得功能設定config
  const config = await getConfig()
  const featureConfig = config.pageFeature

  const site = (await getSiteList())[nindex] || {}
  // popup已經開過?
  const isStoreIframePopped = await isPopped(nindex)
  // 這頁是結帳頁面?
  const isCheckoutPage = site.item && site.item.checkout_url
    && util.isCheckoutPage(site.item.checkout_url, window.location.href)
  // 這頁是結帳完成頁面?
  const isCheckoutDonePage = site.item && site.item.checkout_done_url
    && util.isCheckoutPage(site.item.checkout_done_url, window.location.href)
  // 取得這電商coupon列表
  const couponList = await util.getCoupon(nindex)
  // 這電商有返現?
  const isCashbackNindex = await _isCashbackNindex(nindex)

  // 結帳完成後將返現給清掉
  if(isCheckoutDonePage && isCashbackNindex) {
    await util.cancelCashbackAndClearPopup(nindex)
    util.updateIcon(nindex, "biggo")
    util.ga("popup-checkoutpage", "popup", nindex)
  }

  // 結帳頁面的話 可以顯示coupon
  if(isCheckoutPage && couponList.length > 0 && featureConfig.couponPopup) {
    util.ga("popup-checkpage", "popup", nindex)
    return couponIframe.init(nindex)
  }

  // 非商品頁 而且有返現要出電商資訊iframe
  if(isCashbackNindex && ((!isStoreIframePopped && !isCheckoutDonePage) || isCheckoutDonePage) && featureConfig.blockSetting) {
    const cashback = site.detail
    const isCashbackActive = await isCashbackActivity(nindex)
    const isUserLogin = await isLogin()
    // 調整price history drag iframe高度
    EventBus.dispatch("drag_ph_set_max_height", 165)
    // 叫出返現popup
    setPopped(nindex)

    util.ga("popup-cashback-tip", "popup", nindex)

    return FrontendSender.send("open_store_desc", {
      nindex, isCashbackActive, cashback, isCheckoutDonePage, site, isLogin: isUserLogin
    })
  }
}

/**
 * 依照頁面開始建構頁面上的功能
 * @param {boolean} isUpdateIcon 是否要更新extension icon 通常用在返現的網站上
 * @returns {Promise<any>}
 */
async function buildPageFeature(isUpdateIconAnimation=true) {
  const currentUrl = window.location.href
  const searchEngineQuery = await getSearchEngineQuery("google", currentUrl)
  const config = await getConfig()
  const featureConfig = config.pageFeature

  // search engine query page
  if(searchEngineQuery && isGooglePage()) {
    // TODO need get google region and rollback geoip process
    const region = await getRegion()
    const isSupportRegion = isSupportSearchRegion(region)

    if(isSupportRegion && featureConfig.searchEngineSuggest && isGoogleTextSearchPage()) {
      googleSearchPage.build(searchEngineQuery)
    }

    return
  }

  // ec page
  let nindex = await util.getNindex(currentUrl)
  if(nindex) {
    const isSyntheticNindex = nindex.length > 30
    const productId = await util.getProductId(currentUrl, nindex)
    nindex = await checkNindex(nindex)

    // set router watcher if store need to be watch
    if(SPA.list.includes(nindex)) {
      // 設定spa的路由觀察者
      SPA.set()
    }

    // 電商共同的處理
    await handleNormalEC(nindex)

    if(featureConfig.imageSearchPage && !isSyntheticNindex) {
      const region = await getRegion()
      if (isSupportImageSearch(region)) {
        imageMarker.init(nindex)
      }
    }

    if(productId) {
      const union = await util.getUnionMap()
      const product = await util.getProduct(union?.[nindex] || nindex, productId)
      const isRealProduct = product.result
      // product page
      if(isRealProduct) {
        nindex = product.nindex || nindex
        util.ga("product_page", nindex, "")

        if(featureConfig.moreLikeThis) {
          mltIframe.build(nindex, productId)
          util.ga("more_like_this_query", nindex, "")
        }

        if(featureConfig.priceHistory) {
          dragIframe.build(nindex, productId)
          util.ga("price_history_query", nindex, "")
        }
      }
    }

    // 是支援返現的網站?
    const isCashbackNindex = await _isCashbackNindex(nindex)
    // 已經開啟返現?
    const isActCashback = await isCashbackActivity(nindex)

    // 已經開啟返現 要偵測返現session過期
    if(isActCashback && isCashbackNindex) {
      // set idle listener
      idleCashback.init(nindex)
      idleCashback.listen()
      idleCashback.tick()
      idleCashback.onPop(async () => {
        await util.cancelCashbackAndClearPopup(nindex)
        util.updateIcon(nindex, productId)
      })
    }

    // 固定更新icon
    setTimeout(() => {
      util.updateIcon(nindex, productId, {
        animation: isUpdateIconAnimation
      })
    }, 500)

    // 不支援的網站一律清掉返現狀態
    if(!isCashbackNindex) {
      await util.cancelCashbackAndClearPopup(nindex)
    }
  }
}

/**
 * 清除頁面上的功能
 */
async function rollbackPageFeature() {
  [couponIframe, dragIframe, mltIframe, storeIframe].forEach(obj => obj.remove())
  imageMarker.remove()
  // 重置 price history drag iframe高度
  EventBus.dispatch("drag_ph_set_max_height", DRAG_MAX_HEIGHT)
}

function listenSimpleIframeEvent() {
  window.addEventListener("message", e => {
    if(e.data && (!e.data.type || !e.data.data)) {
      return
    }

    if(!e.data.data || (e.data.data && !e.data.data.id)) {
      return
    }

    const {type} = e.data
    const {id} = e.data.data
    const target = document.getElementById(id)
    switch (type) {
      case constant.IFRAME_FIT_CONTENT:
        const {height} = e.data.data
        target.height = height
        return

      case constant.IFRAME_DESTROY:
        target.remove()
        return
    }
  })
}

async function bindRuntimeListener() {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(!request ||!request.type) {
      sendResponse(null)
      return false
    }

    if(request.type === "coupon_code") {
      const {code, title, content} = request.data
      util.setupCoupon(code, title, content)
    }

    if(request.type === "store_detail") {
      const {name, image, descHTML} = request.data
      FrontendSender.send("open_store_detail", {name, image, descHTML})
    }

    if(request.type === "coupon_iframe_alert") {
      CouponIframeAlert.build({
        onSubmit() {
          const ifm = document.getElementById(constant.COUPON_IFRAME_ID)
          if(ifm) {
            ifm.remove()
          }
          util.closePageFeature("couponPopup")
        }
      })
    }

    if(request.type === "share_coupon_popup") {
      const {nindex} = request.data
      FrontendSender.send("open_report_popup", {nindex})
    }

    if(request.type === "login_success") {
      onLoginSuccess(location.host.includes("biggo"))
    }

    sendResponse(null)
    return true
  })

  const isSupportRegion = isSupportSearchRegion(await getRegion())
  if(isSupportRegion) {
    // update select text
    document.addEventListener("selectionchange", function () {
      let selectionText = document.getSelection().toString()
      selectionText = selectionText ? selectionText.trim() : null
      util.updateSelectText(selectionText)
    }, false)
  }
}

function onLoginSuccess(inBigGo) {
  const dom = document.createElement("div")
  dom.style.padding = "16px 24px"
  dom.style.borderRadius = "5px"
  dom.style.backgroundColor = "rgba(36, 52, 63, 0.95)"
  dom.style.position = "fixed"
  dom.style.top = inBigGo ? "100px" : "16px"
  dom.style.left = "50%"
  dom.style.transform = "translate(-50%, 0)"
  dom.style.fontSize = "16px"
  dom.style.color = "white"
  dom.style.fontWeight = "bold"
  dom.style.minWidth = "350px"
  dom.style.zIndex = "99999999999999999999999"
  dom.textContent = chrome.i18n.getMessage("login_hint")

  document.body.append(dom)

  const close = () => dom.remove()
  setTimeout(close, 3000)
  dom.addEventListener("click", close)
}

async function onceTrigger(fn) {
  const triggerEntries = function() {
    if(!document.hidden) {
      fn()
      document.removeEventListener("visibilitychange", triggerEntries)
    }
  }

  !document.hidden ? fn() : document.addEventListener("visibilitychange", triggerEntries)
}

// 注入擴充自帶的 signed bundle（chrome.runtime URL），非遠端下載的程式碼
function injectFrontendScript() {
  return new Promise(resolve => {
    // set listener
    const rec = Receiver.getReceiver(ContentReceiver)

    rec.onMessage("ready", resolve)
    rec.listen()

    const script = getScriptDom("js/frontend.bundle.rollup.js")
    script.async = true
    document.body.appendChild(script)
    script.remove()

    // timeout
    setTimeout(resolve, 3000)
  })
}

function setInstalledCookie() {
  if (window.location.hostname && window.location.hostname.includes("biggo")) {
    document.cookie = `extension_installed=${Date.now()}`
  }
}

;(async () => {
  await injectFrontendScript()
  bindRuntimeListener()
  listenSimpleIframeEvent()
  // 避免開一堆分頁 狂request
  onceTrigger(async () => {
    buildPageFeature()
  })

  SPA.listen(() => {
    rollbackPageFeature()
    setTimeout(() => {
      buildPageFeature(false)
    }, 100)
  })

  setInstalledCookie()
})()
