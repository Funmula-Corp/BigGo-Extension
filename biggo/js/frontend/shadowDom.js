import {getFilePath} from "./util"

class BigGoCustomEl extends HTMLElement {
  constructor(cssFileList=[], styleList={}) {
    super()

    this.WRAP_ID = "root"

    this.cssFileList = cssFileList || []
    this.styleList = styleList || {}
  }

  async getStyleElement(path) {
    const fsPath = await getFilePath(path)
    const linkElem = document.createElement("link")
    linkElem.setAttribute("rel", "stylesheet")
    linkElem.setAttribute("href", fsPath)
    return linkElem
  }

  getWrapper() {
    const wrap = document.createElement("div")
    wrap.id = this.WRAP_ID
    wrap.classList.add("wrap")
    return wrap
  }

  async build() {
    const shadowRoot = this.attachShadow({mode: "open"})
    const wrapper = this.getWrapper()
    if(typeof this.styleList === "object") {
      for (const styleCol in this.styleList) {
        wrapper.style[styleCol] = this.styleList[styleCol]
      }
    }

    if(Array.isArray(this.cssFileList)) {
      for (const filepath of this.cssFileList) {
        shadowRoot.appendChild(await this.getStyleElement(filepath))
      }
    }

    shadowRoot.appendChild(wrapper)
    this.wrapper = shadowRoot.getElementById(this.WRAP_ID)
  }
}

function buildCustomElement(dom, style={}, cssFileList=[]) {
  return class CustomElement extends BigGoCustomEl {
    constructor() {
      super(cssFileList, style)
      this.build()
    }

    async build() {
      await super.build()
      this.wrapper.appendChild(dom)
    }
  }
}

/**
 * 註冊customElements
 * @param {string} name
 * @param {HTMLElement} dom
 */
export function build(name="biggo-custom", dom=null, style={}, cssFileList) {
  let ElPopup = BigGoCustomEl
  if(dom) {
    ElPopup = buildCustomElement(dom, style, cssFileList)
  }
  window.customElements.get(name) || window.customElements.define(name, ElPopup)
}

/**
 * 將自定義dom append到body
 * @param {string} name id
 * @param {Element} dom
 * @param {Record<string, string>} style
 * @param {Array<string>} css
 * @returns {Element}
 */
export function inject(name, dom, style, css) {
  if(!window.customElements.get(name)) {
    build(name, dom, style, css)
  }

  const custom = document.createElement(name)
  custom.id = name
  document.body.appendChild(custom)
  return custom
}

/**
 * 將自定義dom append到body
 * @param {string} name id
 * @param {Element} dom
 * @param {Record<string, string>} style
 * @returns {Element}
 */
export function injectPop(name, dom, style, css) {
  return inject(name, dom, style, [
    "style/popup.css",
    ...(css||[])
  ])
}
