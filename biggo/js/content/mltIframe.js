import * as FrontendSender from "../prototype/Sender/frontend.js"

export async function build(nindex, id) {
  FrontendSender.send("open_mlt", {nindex, id})
}

function styleDom() {
  const style = document.createElement("link")
  style.href = `https://biggo.com.tw/extension/biggo.css`
  style.type = "text/css"
  style.rel = "stylesheet"
  return style
}

function getIframe(url) {
  const iframe = document.createElement("iframe")
  iframe.width = document.body.offsetWidth
  iframe.height = "170"
  iframe.style.display = "flex"
  iframe.style.backgroundColor = "unset"
  iframe.style.boxShadow = "unset"
  iframe.frameBorder = "0"
  iframe.scrolling = "no"
  iframe.id = "biggo_banner"
  iframe.style.height = "170px"
  iframe.style.display = "none"
  iframe.style.left = "0"
  iframe.style.minWidth = "55px"
  iframe.style.position = "fixed"
  iframe.style.bottom = "0"
  iframe.style.zIndex = "99999999999999999"

  // some store has CORS block
  iframe.addEventListener('load', event => {
    if(event.target.contentWindow.window.length) {
      iframe.style.display = ""
    }
  })

  iframe.src = url

  return iframe
}

export function remove() {
  const dom = document.querySelector("biggo-mlt")
  if(dom) {
    dom.remove()
  }
}

export default {
  build,
  remove
}
