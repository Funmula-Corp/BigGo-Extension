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
  const isCashback = isEC && site.detail && site.detail.desc

  const isLogin = await Sync.syncLogin()
  const isAct = isLogin && isCashback && await Cashback.isActivity(nindex, tabId)

  const region = await getRegion()
  const isCbRegion = isCashbackRegion(region)

  // 處理蝦皮的狀態
  try {
    const resolved = await util.resolveTrueNindex(nindex, tabUrl)
    nindex = resolved.nindex
  } catch (error) {}

  // 都先清除flash
  await Icon.stopAnimation(tabId)
  // 不是電商就預設灰色
  if(!isEC) {
    await Icon.setIcon(ICON_GRAY, tabId)
  }

  // 不支援返現的電商，或返現電商但所在地區不支援返現（且未啟動），都用綠色
  if(isEC && (!isCashback || (!isCbRegion && !isAct))){
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
