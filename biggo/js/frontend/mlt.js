import { getFilePath } from "./util"
import { inject } from "./shadowDom"
import { mount } from "svelte"
import MoreLikeThis from "./svelte/mlt/MoreLikeThis.svelte"

const MLT_APP_ID = "biggo-mlt-app"

function mountSvelte(el, nindex, id) {
  mount(MoreLikeThis, { target: el, props: { nindex, id } })
}

let tryCount = 0
function tryBindSvelte(shadow, nindex, id, srcDom) {
  setTimeout(async () => {
    const dom = shadow.shadowRoot.getElementById(MLT_APP_ID)
    const root = shadow.shadowRoot.getElementById("root")

    if(tryCount >= 10 || !shadow || !shadow.shadowRoot) {
      return
    }

    // 這邊可能是spa切頁
    if(!dom && root) {
      const root = shadow.shadowRoot.getElementById("root")
      root.appendChild(srcDom)
      tryCount = 0
    } if(!dom) {
      tryCount++
      tryBindSvelte(shadow, nindex, id)
      return
    }

    await injectStyle(shadow.shadowRoot)
    mountSvelte(dom, nindex, id)
  }, 1000)
}

export async function injectStyle(root) {
  const style = document.createElement("style")
  style.textContent = `
    .close-btn {
      cursor: pointer;
      position: absolute;
      z-index: 20;
      right: 0;
      top: 0;
      height: 36px;
      width: 36px;
      background-image: url(${await getFilePath("images/btn-close@2x.png")});
      background-size: 36px 36px;
    }

    .close-btn:hover {
      background-image: url(${await getFilePath("images/btn-close-hover@2x.png")});
    }
  `

  root.appendChild(style)
}

export async function build(nindex, id) {
  const dom = document.createElement("div")
  dom.id = MLT_APP_ID

  const shadow = inject("biggo-mlt", dom, {
    left: 0,
    bottom: 0,
    position: "fixed",
    zIndex: "999999999",
  }, ["style/mlt.css"])

  // 先隱藏這個dom 等下他會發事件過去
  shadow.style.display = "none"

  tryBindSvelte(shadow, nindex, id, dom)
}
