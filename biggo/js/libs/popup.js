import * as util from "./util"
import Icon from "./icon"
import Sync from "./sync"
import Cashback from "./cashback"
import { getId } from "./domain"
import { getProductId } from "../core/shared/eclist"
import { resolveTrueNindex } from "../libs/util"
import { send as sendPopup } from "../prototype/Sender/popup"
import * as env from "@shared/env"
import { getRegion } from "@shared/region"
import { getSiteList } from "@core/shared/sites"
import { isCashbackRegion } from "@shared/cashback"

function getStarCouponCount(obj) {
  let count = 0
  for(let nindex in obj) {
    if (obj[nindex]['isStart']) {
      count++
    }
  }

  return count
}

function getCurrentTab() {
  return new Promise(resolve => {
    chrome.tabs.query({ currentWindow: true, active: true }, async tabs => {
      resolve(tabs && tabs.length && tabs[0] || tabs)
    })
  })
}

export function updateAllPopMenu() {
  chrome.tabs.query({}, async (tabs) => {
    for (const tab of tabs) {
      const {id, url} = tab
      let nindex = await getId(url)
      if(!nindex) {
        continue
      }

      const resolved = await resolveTrueNindex(nindex, url)
      nindex = resolved.nindex
      const pid = resolved.pid || await getProductId(await Sync.syncECList(), nindex, url)

      await setPopupMenu(id, url, nindex, pid)
    }
  })
}

export async function setPopupMenu(tabId, tabUrl, nindex, itemId, {animation=true}={}) {
  const {ICON_GREEN, ICON_YELLOW, ICON_GRAY, ICON_MURASAKI} = Icon

  const sites = await getSiteList()
  const site = nindex && sites[nindex]
  const isEC = site && site.item
  const isCashback = isEC && site.detail.desc

  const isLogin = await Sync.syncLogin()
  const isAct = isLogin && isCashback && await Cashback.isActivity(nindex, tabId)

  const region = await getRegion()
  const isCbRegion = isCashbackRegion(region)

  // 確認付款的頁面要做的處理
  try {
    if(site && site[nindex] && site[nindex].item && site[nindex].item.checkout_done_url) {
      const checkoutUrls = site[nindex].item.checkout_done_url
      for (const url of checkoutUrls) {
        if(tabUrl.toLowerCase().indexOf(url.toLowerCase()) > -1) {
          let matchKey = /https:\/\//i
          if(tabUrl.toUpperCase().indexOf('%3A%2F%2F') > -1) {
            matchKey = /(http\S+%3A%2F%2F)/i
          }
          if(tabUrl.indexOf('://') > -1) {
            matchKey = /(http\S+\:\/\/)/i
          }

          if(tabUrl.toUpperCase().indexOf('%3A%2F%2F') > -1 || tabUrl.indexOf('://') > -1 && site[nindex].domain && site[nindex].domain[0]) {
            tabUrl = tabUrl.match(matchKey)[1] + site[nindex].domain[0]
          }
        }
      }
    }
  } catch (error) {
    console.error("decoded urls error: ", error)
  }

  // 處理蝦皮的狀態
  try {
    const tab = await getCurrentTab()
    const resolved = await util.resolveTrueNindex(nindex, tab.url)
    nindex = resolved.nindex
  } catch (error) {}

  // 都先清除flash
  await Icon.stopAnimation(tabId)
  // 不是電商就預設灰色
  if(!isEC) {
    await Icon.setIcon(ICON_GRAY, tabId)
  }

  // 不支援反現的電商就綠色
  if(isEC && !isCashback){
    await Icon.setIcon(ICON_GREEN, tabId)
  }

  // 是返現的網站且沒有登入或沒有啟動才閃icon
  if(isCashback && isCbRegion && (!isLogin || !isAct)) {
    if(animation) {
      Icon.startAnimation(tabId)
    }else{
      Icon.setIcon(ICON_YELLOW, tabId)
    }
  }else if(isAct){
    // 啟動用紫色
    await Icon.setIcon(ICON_MURASAKI, tabId)
  }

  // 設定popup點擊後要顯示的頁面
  env.browserAction.setPopup({
    tabId,
    popup: chrome.runtime.getURL(
      `pages/popmenu/popmenu.html#nindex=${nindex||""}&tabId=${tabId}&purl=${encodeURIComponent(tabUrl)}&cbi=0&itemId=${itemId}`
    ),
  })

  // 傳給popup最新的返現狀態
  sendPopup("cashback_changed", {tabId, nindex})
}

export default {
  setPopupMenu,
  updateAllPopMenu
}
