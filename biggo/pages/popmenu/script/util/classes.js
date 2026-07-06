import constant from "@/content/constant.js"
import { hideDom, showDom, send } from "./util.js"
import { i18n } from "@/util.shared.js"

export class LoginButton {
  constructor(dom) {
    this.dom = dom
    this.dom.classList.remove("d-none")

    this.YELLOW = "rgba(237 ,171 , 0, 0.8)"
    this.GREEN = "rgba(0, 181, 183, 0.8)"
    this.GRAY = "rgba(140, 154, 163, 0.8)"
  }

  clearBtn() {
    this.dom.classList.remove("btn-main")
    this.dom.classList.remove("btn-normal")
    this.dom.classList.remove("btn-cashback")
  }

  enableCashback() {
    this.dom.innerText = "已啟用現金回饋"
    this.dom.style.width = "190px"

    this.clearBtn()
    this.dom.classList.add("btn-main")
  }

  reEnableCashback() {
    this.dom.innerText = "重新啟動 領現金回饋"
    this.dom.style.width = "204px"

    this.clearBtn()
    this.dom.classList.add("btn-cashback")
  }

  unLoginEnableCashback() {
    this.dom.innerText = "重新啟動 領現金回饋"
    this.dom.style.width = "204px"

    this.clearBtn()
    this.dom.classList.add("btn-cashback")
  }

  notLogin() {
    this.dom.innerText = i18n("NOT_LOGIN")
    this.dom.style.width = "220px"

    this.clearBtn()
    this.dom.classList.add("btn-normal")
  }

  isLogin() {
    this.dom.innerText = i18n("GO_TO_BIGGO")
    this.dom.style.width = "134px"

    this.clearBtn()
    this.dom.classList.add("btn-normal")
  }

  bgYellow() {
    this.dom.style.backgroundColor = this.YELLOW
  }

  bgGreen() {
    this.dom.style.backgroundColor = this.GREEN
  }

  bind(callback, event="click") {
    this.dom.addEventListener(event, callback)
  }

  getClickUrl({domain, url, nindex, site, region}, isLogin) {
    const isCashback = !!(site && site.detail)
    const defaultUrl = `https://${domain}/r/askforlogin.php?f=extension&id=biggo`
    let redirectUrl = defaultUrl

    if(site && isCashback) {
      if(site.detail.desc) {
        redirectUrl += `&i=${nindex}`
      }
      if(url) {
        redirectUrl += `&purl=${url}`
      }
      return region === "tw" ? redirectUrl : defaultUrl
    }

    return `https://${domain}/${isLogin ? "" : "member/login.php"}`
  }
}

export class Tab {
  constructor(name, domTab, domDesc) {
    this.name = name
    this.tab = domTab
    this.desc = domDesc

    this.hasRemoved = false
  }

  show() {
    this.tab.classList.add("active")
    this.desc.style.setProperty('display', '')
  }

  hide() {
    this.tab.classList.remove("active")
    this.desc.style.setProperty('display', 'none')
  }

  destroyed() {
    this.tab.style.setProperty('display', 'none')
    this.desc.style.setProperty('display', 'none')
  }

  addEventListener(event, cb) {
    this.tab.addEventListener(event, cb)
  }
}

export class TabList {
  constructor() {
    this.list = []
  }

  get length() {
    return this.list.length
  }

  hasInList(tab) {
    return this.list.indexOf(tab) > -1
  }

  add(tab) {
    if(this.hasInList(tab)) {
      return this
    }

    this.list.push(tab)
    tab.addEventListener("click", e => {
      this.hideAll()
      tab.show()
    })
    return this
  }

  hideAll() {
    this.list.forEach(obj => obj.hide())
  }

  remove(tab) {
    tab.destroyed()
    tab.hasRemoved = true
    return this
  }

  showFirst() {
    const isLiveTab = this.list.filter(i => !i.hasRemoved)
    if(isLiveTab.length > 0) {
      isLiveTab[0].show()
    }
  }
}

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
