import constant from "./constant"

export function remove() {
  const dom = document.getElementById(constant.STORE_IFRAME_ID)
  if(dom) {
    dom.remove()
  }
}

export default {
  remove
}
