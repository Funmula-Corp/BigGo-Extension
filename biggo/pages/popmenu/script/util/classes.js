import constant from "@/content/constant.js"
import { hideDom, showDom, send } from "./util.js"

export class SimpleIframe {
  constructor(name, {content, head, close}) {
    const tmpElement = document.createElement("div")

    this.name = name
    this.content = content || tmpElement
    this.head = head || tmpElement
    this.closeBtn = close || document.getElementById("close") || tmpElement
  }

  destroy() {
    send(constant.IFRAME_DESTROY, {
      id: this.name
    })
  }

  iframeFitContent() {
    send(constant.IFRAME_FIT_CONTENT, {
      height: document.body.scrollHeight,
      width: document.body.scrollWidth,
      id: this.name
    })
  }

  openContent() {
    showDom(this.content)
    this.iframeFitContent()
  }

  closeContent() {
    hideDom(this.content)
    this.iframeFitContent()
  }

  toggleContent() {
    if(this.content.style.display === "none") {
      this.openContent()
    }else{
      this.closeContent()
    }
  }

  // TODO 應該做成一個庫 只帶進callback
  destroyCountdown(sec=0) {
    let countDownEnties = null
    const DESTROY_TIME_OUT = sec || 1000 * 15

    // auto destroy self
    const countDown = () => {
      countDownEnties = setTimeout(() => {
        this.destroy()
      }, DESTROY_TIME_OUT)
    }

    window.addEventListener("click", e => {
      clearTimeout(countDownEnties)
      countDown()
    })

    countDown()
  }

  async init() {
    if(this.closeBtn.length && this.closeBtn.forEach) {
      this.closeBtn.forEach(dom => dom.addEventListener("click", this.destroy.bind(this)))
      return
    }
    this.closeBtn.addEventListener("click", this.destroy.bind(this))
  }
}
