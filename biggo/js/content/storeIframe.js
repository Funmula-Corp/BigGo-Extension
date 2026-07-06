import * as util from "./util"
import constant from "./constant"
import { addExtensionInfo2Url } from "@/util.shared"

async function build(nindex, purl, isBuied=false) {
  const iframe = document.createElement("iframe")
  iframe.src = await addExtensionInfo2Url(
    chrome.runtime.getURL(`pages/popmenu/storeIframe.html#nindex=${nindex||""}&purl=${encodeURIComponent(purl)}&itemId=biggo&buied=${isBuied?"1":""}`)
  )
  iframe.height = `500`
  iframe.width = `280`
  iframe.id = constant.STORE_IFRAME_ID
  iframe.style.maxWidth = `280px`
  iframe.style.backgroundColor = `#fff`
  iframe.style.position = `absolute`
  iframe.style.zIndex = 99999999999
  iframe.style.top = `10px`
  iframe.style.right = `10px`
  iframe.style.border = "none"
  iframe.style.boxShadow = "0 3px 6px 0 rgba(0, 0, 0, 0.16)"

  return iframe
}

export async function init(nindex, purl, isBuied=false) {
  const iframe = await build(nindex, purl, isBuied)
  document.body.appendChild(iframe)
}

export function remove() {
  const dom = document.getElementById(constant.STORE_IFRAME_ID)
  if(dom) {
    dom.remove()
  }
}

export default {
  init,
  remove
}
