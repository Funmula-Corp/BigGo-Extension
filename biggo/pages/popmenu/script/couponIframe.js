import * as util from "@/content/util"
import { localizeHtmlPage, getParameter, sendTabMsg } from "./util/util"
import { SimpleIframe } from "./util/classes"
import constant from "@/content/constant"
import couponFactory from "./util/coupon"
import { getSiteList } from "@shared/sites"
import { isLogin } from "@core/shared/user"
import { getConfig, setConfig, setPageFeature } from "@core/shared/config"
import ga from "@shared/ga"
import { i18n } from "@/util.shared"

/**
 * 綁定popup事件
 * @param {Element} dom
 */
function bindPopup(dom) {
  const domPopup = dom.querySelector(".popup")
  if(!domPopup) {
    return
  }

  if(!dom.getAttribute("tabIndex")) {
    dom.setAttribute("tabIndex", "0")
  }
  if(!domPopup.getAttribute("tabIndex")) {
    domPopup.setAttribute("tabIndex", "0")
  }
  dom.style.outline = "none"
  domPopup.style.outline = "none"

  dom.addEventListener("click", e => {
    if(dom.dataset.open) {
      dom.removeAttribute("data-open")
    }else{
      dom.dataset.open = "1"
    }
  })

  dom.addEventListener("blur", e => {
    if(e.relatedTarget === domPopup) {
      return
    }
    dom.removeAttribute("data-open")
  })

  dom.querySelectorAll("[data-href]").forEach(item => {
    const url = item.dataset.href
    item.addEventListener("click", e => window.location.href = url)
  })

  domPopup.addEventListener("blur", e => {
    dom.removeAttribute("data-open")
  })
}

function bindOption(config, onClose=()=>{}) {
  const configDom = document.querySelector(`[data-option="${config}"]`)
  if(configDom) {
    configDom.dataset.open = "1"
  }

  const domOptions = document.querySelectorAll("[data-option]")

  const clearOptionSet = () => {
    domOptions.forEach(dom => dom.removeAttribute("data-open"))
  }

  domOptions.forEach(dom => {
    dom.addEventListener("click", async () => {
      clearOptionSet()
      setTimeout(() => dom.dataset.open = 1, 0)

      const closeFeature = () => {
        setPageFeature({couponPopup: false})
        onClose()
      }

      const option = dom.dataset.option
      if(option === "close") {
        const _isLogin = await isLogin()
        if(!_isLogin) {
          sendTabMsg("coupon_iframe_alert")
          return
        }

        return closeFeature()
      }

      setConfig({
        popCouponSetting: {
          default: option
        }
      })
    })
  })
}

class CouponIframe extends SimpleIframe {
  constructor() {
    super(constant.COUPON_IFRAME_ID, {
      content: document.getElementById("content"),
      head: document.getElementById("head"),
      close: document.querySelectorAll("[data-close]")
    })
  }

  async init() {
    super.init()

    // option i18n
    document.querySelector("[data-option='10s'] span").textContent = i18n("coupon_popup_autoclose", [10])
    document.querySelector("[data-option='20s'] span").textContent = i18n("coupon_popup_autoclose", [20])

    const {nindex} = getParameter()
    const sites = await getSiteList()
    const site = sites[nindex]

    if(!site) {
      return this.destroy()
    }

    const config = (await getConfig()).popCouponSetting.default
    bindOption(config, this.destroy.bind(this))

    if(config === "10s" || config === "20s") {
      setTimeout(this.destroy.bind(this), config === "10s" ? 10 * 1000 : 20 * 1000)
    }

    const storeImge = site && site.detail && site.detail.image || "./img-cp-no-logo-default@2x.png"
    document.querySelector("[data-store-img]").src = storeImge

    const couponList = await util.getCoupon(nindex)
    // bind coupon content
    const couponHtml = couponFactory.buildHTML(couponList, site.item.name)
    this.content.innerHTML = couponHtml
    setTimeout(() => {
      couponFactory.listen()
      this.iframeFitContent()
    }, 0)

    bindPopup(document.getElementById("setting-wrap"))
  }
}

window.addEventListener("load", async (e) => {
  localizeHtmlPage()
  ;(new CouponIframe).init()
})
