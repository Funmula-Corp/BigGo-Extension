import { getNindexFromSitelist, getSiteList } from "@core/shared/sites"
import * as util from "./util"

/**
 * 對符合的dom注入minibar
 * @param {string} path
 */
export async function inject(path) {
  const domList = getAllDom(path) || []
  domList.forEach(process)

  // style
  const style = document.createElement("style")
  style.innerHTML = `
    .__biggo_cb_hint__ {
      background: #ffef72;
      position: relative;
    }

    .__biggo_cb_hint__:hover {
      background: #ffd900;
    }

    .__biggo_cb_hover_show {
      display: none;
    }

    .__biggo_cb_hint__:hover .__biggo_cb_hover_show {
      display: flex;
      position: absolute;
      right: -120px;
      padding: 8px;
      box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.2);
      border: solid 1px #fff;
      background-color: #2d2d2d;
      color: #fff;
      font-size: 11px;
    }

    .__biggo_cb_hover_show .__biggo_tri {
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 6px 7px 6px 0px;
      border-color: transparent #2d2d2d transparent transparent;
      position: absolute;
      left: -3px;
      transform: translate(-50%, 0);
    }
  `
  document.head.append(style)
}

/**
 * 主要處理程序 針對個別dom
 * @returns {(dom: Element)=>void}
 */
async function process() {
  const sites = await getSiteList()
  return async dom => {
    if(!dom.href) {
      return
    }

    const url = dom.href

    // 粉絲頁跳過
    if(url.startsWith("https://www.facebook.com")) {
      return
    }

    const nindex = await getNindexFromSitelist(url)

    // 不是電商的網站就跳過
    if(!nindex) {
      return
    }

    const site = sites[nindex]

    // 不是ec跟沒返現都跳過
    if(!site || (site && !site.detail.desc)) {
      return
    }

    const pid = await util.getProductId(url, nindex)

    // insert minibar
    const isChild = dom.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentElement.classList.contains("FxLDp")
    const buildBar = build({url, nindex, pid, desc: site.detail.up_rate, name: site.detail.name}, !isChild)
    const root = dom.parentNode
    const googleCiteDom = root.querySelector("cite")

    if(googleCiteDom && googleCiteDom.parentNode) {
      dom.parentNode.insertBefore(buildBar, dom)
    }

    // replace href
    if(site.is_replace_google) {
      replaceHref(dom, nindex, pid, url)
    }
  }
}

/**
 * 將連結替換成biggo r連結
 * @param {HTMLElement} dom
 * @param {string} nindex
 * @param {string} pid
 * @param {string} url
 */
// 只在 Google 搜尋頁、對 server flag is_replace_google=true 的電商，把搜尋結果連結改寫成 BigGo 返現導購連結；使用者仍須主動點擊，非自動跳轉
async function replaceHref(dom, nindex, pid, url) {
  const affurl = await util.getBigGoRUrl(nindex, pid, url)
  dom.href = affurl
}

/**
 * 取得所有符合條件的dom
 * @param {string} path
 * @returns {Array<HTMLElement>}
 */
function getAllDom(path) {
  return Array.from(document.querySelectorAll(path)) || []
}

/**
 * 建立要注入的dom
 * @param {{desc: string, nindex: string, url: string, pid: string}} param
 * @returns {Element}
 */
async function build({desc, nindex, url, pid, name}, padding=true) {
  const div = document.createElement("div")
  const uid = (!pid) ? 'biggo' : pid
  const affurl = await util.getBigGoRUrl(nindex, pid, url, "extension_googlesearchpage")
  const isNewSearch = !!document.querySelector("img.XNo5Ab")

  div.innerHTML = `
    <div class="__biggo_cb_hint__" style='color: #00808a; font-size: 16px; display: flex; align-items: center; padding: 5px; line-height:1; border-radius: 4px; top: ${padding && isNewSearch ? 21 : 0}px'>
      <img src="${chrome.runtime.getURL("/icons/ic_b_badge@3x.png")}" height='16'><span>&nbsp;</span>
      <a target="_blank" href="${affurl}">
        <span style='margin-right: 4px;color: #00808a;'>${name} 賺最高</span>
        <span style='font-weight: bold;'>&nbsp;${desc}&nbsp;</span>
        <span>回饋👈</span>
      </a>

      <div class="__biggo_cb_hover_show">點擊啟用現金回饋<div class="__biggo_tri"></div></div>
    </div>
  `

  div.style.display = "flex"
  div.style.alignItems = "center"
  div.style.marginBottom = "-20px"
  div.style.paddingTop = "20px"

  return div
}

export default {
  inject
}
