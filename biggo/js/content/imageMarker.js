import { send } from "./messenger"
import { ga } from "./util"

const MARKER_ATTR = "data-biggo-img-marker"
const HOVER_BTN_ID = "_biggo_img_hover_btn"
const MIN_SIZE = 320
const MIN_LAYOUT_SIZE = 260

let hoverBtn = null
let observer = null
let currentImg = null
let hoverTarget = null
let _nindex = null

function markImage(img, nindex) {
  if (img.hasAttribute(MARKER_ATTR)) {
    return
  }

  const overMinSize = limit => img.naturalWidth >= limit && img.naturalHeight >= limit
  const overLayoutSize = limit => img.height >= limit && img.width >= limit

  let mark = false
  switch (nindex) {
    case "tw_pec_momoshop":
    case "tw_ec_carrefour":
      mark = overMinSize(MIN_SIZE) && overLayoutSize(MIN_LAYOUT_SIZE) && img.role != "presentation"
      break
    // case "tw_pec_ybuy":
    //   mark = overMinSize(220) && overLayoutSize(190)
    //   break
    // case "tw_pec_ybuy":
    //   mark = overMinSize(250) && overLayoutSize(MIN_LAYOUT_SIZE)
    //   break
    case "tw_mall_shopeemall":
    case "tw_bid_shopee":
      mark = overMinSize(MIN_SIZE) && overLayoutSize(MIN_LAYOUT_SIZE)

      // 搜尋結果item 沒有任何免運或者優惠的商品圖片
      if (mark) {
        const parentClass = img.parentElement?.classList
        if (parentClass?.contains("relative") && parentClass?.contains("z-0") && parentClass?.contains("w-full")) {
          img.parentElement.style.pointerEvents = "none"
          img.style.pointerEvents = "auto"
        }
      }
      break
    default:
      mark = overMinSize(MIN_SIZE) && overLayoutSize(MIN_LAYOUT_SIZE)
      break
  }

  if (mark) {
    img.setAttribute(MARKER_ATTR, "")
  }
}

function markAllImages() {
  for (const img of document.images) {
    markImage(img, _nindex)
  }
}

function createHoverBtn() {
  const btn = document.createElement("div")
  btn.id = HOVER_BTN_ID
  const s = (prop, val) => btn.style.setProperty(prop, val, "important")
  s("position", "absolute")
  s("display", "none")
  s("align-items", "center")
  s("gap", "4px")
  s("padding", "5px 8px")
  s("background-color", "#00BDC2")
  s("border-radius", "14px")
  s("cursor", "pointer")
  s("z-index", "99999999")
  btn.title = chrome.i18n.getMessage("image_search_btn_title")

  const icon = document.createElement("img")
  icon.src = chrome.runtime.getURL("images/BigGo_B_icon_w.png")
  const si = (prop, val) => icon.style.setProperty(prop, val, "important")
  si("width", "12px")
  si("height", "12px")
  btn.appendChild(icon)

  const label = document.createElement("span")
  label.textContent = chrome.i18n.getMessage("image_search_btn_label")
  const sl = (prop, val) => label.style.setProperty(prop, val, "important")
  sl("color", "#FEFEFF")
  sl("font-size", "12px")
  sl("line-height", "16px")
  sl("font-weight", "normal")
  sl("line-height", "1")
  sl("white-space", "nowrap")
  btn.appendChild(label)

  btn.addEventListener("click", () => {
    if (!currentImg) return
    send("pop", "upload_image", getSrcFromImg(currentImg))
    ga("image_search", "page_click")
  })

  btn.addEventListener("mouseleave", (e) => {
    const related = e.relatedTarget
    if (related?.tagName === "IMG" && related.hasAttribute(MARKER_ATTR)) {
      return
    }
    hideBtn()
  })

  document.body.appendChild(btn)
  return btn
}

function getSrcFromImg(img) {
  if (img.src) {
    return img.src
  }

  if (img.srcset) {
    return img.srcset.split(" ")[0]
  }

  return
}

function showBtn(img) {
  const def = () => {
    if (img.tagName != "IMG") {
      currentImg = img.querySelector("img")
    } else {
      currentImg = img
    }
  }

  switch (_nindex) {
    case "tw_pmall_rakuten":
      if (img?.parentElement?.parentElement?.parentElement?.querySelectorAll("img.magnifier-image")?.length == 2) {
        currentImg = img.parentElement.parentElement.parentElement.querySelectorAll("img.magnifier-image")[1]
        break
      }

      def()
      break
    case "tw_pec_apple":
      setTimeout(() => {
        if (hoverBtn.hasAttribute("inert")) {
          hoverBtn.removeAttribute("inert")
        }
      }, 200)
      def()
      break
    case "tw_mall_shopeemall":
    case "tw_bid_shopee":
      if (img.alt == "custom-overlay") {
        currentImg = img.parentElement.parentElement.querySelector("img")
        break
      } else if (!img.alt) {
        currentImg = img.parentElement.parentElement.querySelector("picture img")
        break
      }

      def()
      break
    default:
      def()
  }

  hoverTarget = img
  positionBtn()
}

function positionBtn() {
  if (!hoverTarget) return
  const rect = hoverTarget.getBoundingClientRect()
  hoverBtn.style.setProperty("display", "flex", "important")
  hoverBtn.style.setProperty("top", `${window.scrollY + rect.top + 10}px`, "important")
  hoverBtn.style.setProperty("left", `${rect.right - hoverBtn.offsetWidth - 10 + window.scrollX}px`, "important")
}

function handleScroll() {
  if (hoverTarget && hoverBtn.style.getPropertyValue("display") !== "none") {
    positionBtn()
  }
}

function hideBtn() {
  currentImg = null
  hoverTarget = null
  hoverBtn.style.setProperty("display", "none", "important")
}

function handleMouseOver(e) {
  const img = e.target
  if (img.tagName === "IMG" && img.hasAttribute(MARKER_ATTR)) {
    showBtn(img)
  }
}

function handleMouseOut(e) {
  const related = e.relatedTarget
  if (related === hoverBtn || hoverBtn?.contains(related)) {
    return
  }

  const img = e.target
  if (img.tagName === "IMG" && img.hasAttribute(MARKER_ATTR)) {
    hideBtn()
  }
}

function handleNewImg(img) {
  if (img.naturalWidth > 0) {
    markImage(img, _nindex)
  } else {
    img.addEventListener("load", () => markImage(img, _nindex), { once: true })
  }
}

function startObserver() {
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue
        if (node.tagName === "IMG") {
          handleNewImg(node)
        } else if (node.querySelectorAll) {
          for (const img of node.querySelectorAll("img")) {
            handleNewImg(img)
          }
        }
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

// 全站 MutationObserver + mouseover 只用來標記大圖、提供「以圖搜尋」hover 按鈕，不讀取頁面內容/表單
export function init(nindex) {
  _nindex = nindex
  const start = () => {
    setTimeout(() => {
      markAllImages()
      hoverBtn = createHoverBtn()
      document.body.addEventListener("mouseover", handleMouseOver)
      document.body.addEventListener("mouseout", handleMouseOut)
      window.addEventListener("scroll", handleScroll, true)
      startObserver()
    }, 1000)
  }

  if (document.readyState === "complete") {
    start()
  } else {
    window.addEventListener("load", start)
  }
}

export function remove() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (hoverBtn) {
    hoverBtn.remove()
    hoverBtn = null
  }
  document.body.removeEventListener("mouseover", handleMouseOver)
  document.body.removeEventListener("mouseout", handleMouseOut)
  window.removeEventListener("scroll", handleScroll, true)

  document.querySelectorAll(`[${MARKER_ATTR}]`).forEach(el => {
    el.removeAttribute(MARKER_ATTR)
  })
}

export default { init, remove }
