import constant from "./constant"

function build(nindex) {
  const iframe = document.createElement("iframe")
  iframe.src = chrome.runtime.getURL(`pages/popmenu/couponIframe.html#nindex=${nindex||""}`)
  iframe.id = constant.COUPON_IFRAME_ID
  iframe.height = `600`
  iframe.width = `320`
  iframe.style.maxWidth = `320px`
  iframe.style.backgroundColor = `#fff`
  iframe.style.position = `absolute`
  iframe.style.zIndex = 99999999999
  iframe.style.top = `10px`
  iframe.style.right = `10px`
  iframe.style.border = "none"
  iframe.style.boxShadow = "0 3px 6px 0 rgba(0, 0, 0, 0.16)"
  iframe.style.borderRadius = "10px"

  return iframe
}

export function init(nindex) {
  const iframe = build(nindex)
  document.body.appendChild(iframe)
}

export function remove() {
  const dom = document.getElementById(constant.COUPON_IFRAME_ID)
  if(dom) {
    dom.remove()
  }
}

export default {
  init,
  remove
}
