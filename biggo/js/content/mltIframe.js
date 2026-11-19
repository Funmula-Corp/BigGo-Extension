import * as FrontendSender from "../prototype/Sender/frontend.js"

export async function build(nindex, id) {
  FrontendSender.send("open_mlt", {nindex, id})
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
