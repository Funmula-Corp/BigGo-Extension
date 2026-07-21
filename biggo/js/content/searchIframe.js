import * as util from "./util"
import { i18n, sleep } from "@/util.shared"
import ga from "@shared/ga"

function getBindEvent(query) {
  return async () => {
    const domain = await util.getDomain()
    window.open(`https://${domain}/s/${query}/`)
  }
}

function isDarkMode() {
  const color = window.getComputedStyle(document.body).backgroundColor || ""
  return !color.includes("255")
}

export function remove() {
  document.getElementById("BigGo_Service").remove()
  document.querySelectorAll("[data-biggo]").forEach(dom => dom.remove())
}

function buildBottomDom() {
  const img = document.createElement("img")
  img.src = chrome.runtime.getURL("images/ic-b-color-google-suggection@2x.png")
  img.height = 16

  const arrow = document.createElement("img")
  arrow.src = chrome.runtime.getURL("images/lists-ic-go-store@2x.png")
  arrow.height = 18

  const content = document.createElement("span")
  content.textContent = "BigGo"
  content.style.margin = "0 2px 0 5px"

  const fragment = document.createDocumentFragment()
  fragment.appendChild(img)
  fragment.appendChild(content)
  fragment.appendChild(arrow)
  return fragment
}

function bindTooltip(dom, query) {
  const isDark = isDarkMode()

  const wrap = document.createElement("div")
  wrap.id = "biggo_tooltip"
  wrap.style.display = "none"
  wrap.style.position = "absolute"
  wrap.style.justifyContent = "center"
  wrap.style.zIndex = 100

  const tooltip = document.createElement("div")
  tooltip.setAttribute("style", `background: rgb(45,45,45); border: 1px solid #${isDark?"3c4043":"fff"}; display: block; font-size: 11px; font-weight: bold;line-height: 29px; padding: 0 10px;text-align: center;white-space:nowrap;z-index: 2000;box-shadow:rgba(0,0,0,0.2) 0px 1px 4px;box-sizing: border-box; transition: opacity 0.13s ease 0s; color: #fff; position: relative; width: fit-content;`)
  // 不用 chrome.i18n 的 placeholder：Safari 在 $word$ 緊鄰「」“” 等非 ASCII 字元時會把變數
  // 連同前一個字元一起吃掉，所以訊息裡用 {0} token，在這裡自己代入
  tooltip.textContent = i18n("search_on_biggo").replace("{0}", query)

  const tri = document.createElement("div")
  tri.setAttribute("style", "width: 0;height: 0;border-style: solid;border-width: 0 6px 7px 6px;border-color: transparent transparent #2d2d2d transparent;top: -7px; position: absolute; left: 50%;transform: translate(-50%, 0)")

  const borderTri = document.createElement("div")
  borderTri.setAttribute("style", `width: 0;height: 0;border-style: solid;border-width: 0 8px 8px 8px;border-color: transparent transparent #${isDark?"3c4043":"fff"} transparent;top: -8px; position: absolute; left: 50%;transform: translate(-50%, 0)`)

  tooltip.appendChild(borderTri)
  tooltip.appendChild(tri)
  wrap.appendChild(tooltip)

  document.body.appendChild(wrap)
  dom.addEventListener("mouseenter", () => {
    const rect = dom.getBoundingClientRect()
    wrap.style.display = "flex"
    wrap.style.top = `${rect.top + 25}px`
    wrap.style.left = `${rect.left + rect.width / 2}px`
    wrap.style.transform = "translateX(-50%)"
  })
  dom.addEventListener("mouseleave", () => {
    wrap.style.display = "none"
  })
}

function getTopOption(mode=1) {
  const isDark = isDarkMode()
  const icon = isDark
    ? chrome.runtime.getURL("./images/ic_B_enabled_google_suggestion_dark.svg")
    : chrome.runtime.getURL("./images/ic_B_enabled_google_suggestion.svg")
  const hoverIcon = isDark
    ? chrome.runtime.getURL("./images/ic_B_enabled_google_suggestion_dark_hover.svg")
    : chrome.runtime.getURL("./images/ic_B_enabled_google_suggestion_hover.svg")

  const img = document.createElement("img")

  img.height = 14
  img.style.marginRight = "5px"
  img.src = icon
  img.style.position = "relative"
  img.style.top = "2px"

  const span = document.createElement("span")
  span.textContent = "BigGo"

  const el = document.createElement("div")

  if(mode == 1) {
    el.classList.add("nfSF8e")
    el.style.marginRight = "1px"
    el.style.marginLeft = "12px"
    el.style.position = "relative"
    el.style.transform = "translateX(9px)"

    if(!document.querySelector(".nfSF8e")) {
      el.style.marginTop = "6px"
      el.style.marginBottom = "1px"
    }
  } else {
    el.classList.add("mOKdDc")

    if(document.querySelector(".sohiBf")) {
      el.classList.add("sohiBf")
      el.classList.add("GKS7s")
    }
  }

  el.style.alignItems = "center"
  el.style.zIndex = "100"
  el.style.top = "3px"
  el.dataset.biggo = "top"

  el.appendChild(img)
  el.appendChild(span)

  el.addEventListener("mouseenter", () => {
    img.src = hoverIcon
  })

  el.addEventListener("mouseleave", () => {
    img.src = icon
  })

  return el
}

export function setTopOptions() {
  let root = document.getElementById("uddia_1")
  let mode = 1

  if(!root) {
    root = document.getElementById("hdtb-tls")?.parentElement
    if(!root) {
      return
    }

    root.style.display = "flex"
    root.style.alignItems  = "center"
    mode = 2
  }

  if(!root) {
    return
  }

  if(mode == 1) {
    const line = document.createElement("div")
    line.classList.add("IDFSOe")
    line.style.transform = "translateX(9px)"
    root.insertBefore(line, root.firstChild)
  }

  root.appendChild(getTopOption(mode))
}

function isAllGoogleTab() {
  try {
    const _url = new URL(window.location.href)
    const udm = _url.searchParams.get("udm")
    if (udm) {
      return udm == "14"
    }
    const tbm = _url.searchParams.get("tbm")
    return !tbm
  }catch(e) {}
  return false
}

export function setBottomPage() {
  const root = document.querySelector(`.oIk2Cb > .kfsfbe.adDDi`)
  if(!root) {
    return
  }

  if(!root.clientHeight) {
    return
  }

  if(!isAllGoogleTab()) {
    return
  }

  root.style.position = "relative"

  const dom = document.createElement("div")
  dom.style.position = "absolute"
  dom.style.top = "4px"
  dom.style.right = "0"
  dom.style.zIndex = "200"
  dom.style.cursor = "pointer"
  dom.style.fontSize = "14px"
  dom.style.display = "flex"
  dom.style.alignItems = "center"
  dom.dataset.biggo = "bottom_page"

  dom.appendChild(buildBottomDom())
  root.appendChild(dom)
}

export function setBottomSearchResult() {
  const root = document.querySelector("#w3bYAd .O3JH7")
  if(!root) {
    setBottomPage()
    return
  }

  root.style.display = "flex"
  root.style.justifyContent = "space-between"
  root.style.alignItems = "center"

  const el = document.createElement("div")
  el.style.cursor = "pointer"
  el.style.fontSize = "14px"
  el.style.display = "flex"
  el.style.alignItems = "center"
  el.style.position = "relative"
  el.style.zIndex = "200"
  el.dataset.biggo = "bottom_relate"

  el.appendChild(buildBottomDom())
  root.appendChild(el)
}

export async function build(query) {
  await sleep(1000)
  setTopOptions()
  setBottomSearchResult()

  const handle = getBindEvent(query)
  document.querySelectorAll("[data-biggo]").forEach(dom => {
    dom.addEventListener("click", e => {
      handle(e)
      ga(`google_query_${dom.dataset.biggo}`, "click", "")
    })

    if(!dom.style.position) {
      dom.style.position = "relative"
    }

    bindTooltip(dom, query)
  })
}

export default {
  build,
  remove
}
