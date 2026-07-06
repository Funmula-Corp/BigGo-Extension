import ListenInternal from "@/iframe/biggo.internal.bundle"
import { getParameter } from "./util/util"
import { isSafari, getSitesLang } from "@/util.shared"
import clientHandle from "@/client/handle"
import msg from "@/content/messenger"
import Receiver from "@/prototype/Receiver/index"
import PopupReceiver from "@/prototype/Receiver/popup"
import { isLogin as isUserLogin } from "@shared/user"
import { isActivity } from "@shared/cashback"

class Tab {
  constructor(lang) {
    this.dom = document.getElementById("content")
    this.lang = lang || ""
  }

  init() {
    const {nindex} = getParameter()
    this.dom.src = nindex && `${nindex}`.includes("_")
      ? `https://${process.env.API_DOMAIN}/popmenu/store.php?nindex=${nindex}&src=extension_router&lang=${this.lang}&browser=${process.env.BROWSER}`
      : `https://${process.env.API_DOMAIN}/popmenu/home.php?lang=${this.lang}&browser=${process.env.BROWSER}`
    this.callback()
  }

  navigation(path) {
    this.dom.contentWindow.postMessage({
      type: "navigation", path
    }, "*")
  }

  index() {
    this.navigation(`https://${process.env.API_DOMAIN}/popmenu/home.php?lang=${this.lang}&browser=${process.env.BROWSER}`)
    this.callback()
  }

  search() {
    this.navigation(`https://${process.env.API_DOMAIN}/popmenu/search.php?lang=${this.lang}&browser=${process.env.BROWSER}`)
    this.callback()
  }

  async account() {
    const isLogin = await isUserLogin()
    this.navigation(isLogin
      ? `https://${process.env.API_DOMAIN}/popmenu/account.php?lang=${this.lang}&browser=${process.env.BROWSER}`
      : `https://${process.env.API_DOMAIN}/popmenu/login.php?lang=${this.lang}&browser=${process.env.BROWSER}`)
    this.callback()
  }

  callback() {}
}

class Navbar {
  constructor() {
    this.list = document.querySelectorAll("[data-nav]")
    this.nav = {}
  }

  set(key, cb) {
    this.nav[key] = cb
  }

  clear() {
    this.list.forEach(dom => dom.removeAttribute("active"))
  }

  active(dom) {
    dom.setAttribute("active", "")
  }

  bind() {
    this.list.forEach(dom => {
      dom.addEventListener("click", e => {
        const name = dom.dataset.nav
        const callback = this.nav[name]

        this.clear()
        this.active(dom)

        if(callback && typeof callback === "function") {
          callback()
        }
      })
    })
  }

  to(key) {
    const dom = document.querySelector(`[data-nav="${key}"]`)
    if(dom) {
      this.active(dom)
      if(this.nav[key] && typeof this.nav[key] === "function") {
        this.nav[key]()
      }
    }
  }
}

function listenBackground() {
  const rev = Receiver.getReceiver(PopupReceiver)
  rev.listen()

  if(isSafari()) {
    rev.onMessage("tab_changed", () => {
      document.removeEventListener("visibilitychange", checkPage)
      document.addEventListener("visibilitychange", checkPage)
    })

    rev.onMessage("cashback_changed", async (info) => {
      const {tabId} = getParameter()
      if(+tabId !== +info.tabId) {
        return
      }

      window.location.reload()
    })
  }

  rev.onMessage("login", () => {
    window.location.reload()
  })

  rev.onMessage("logout", () => {
    window.location.reload()
  })
}

const {tabId, purl, nindex, itemId, cbi} = getParameter()
async function checkPage() {
  const tab = await msg.post("util", "get_current_tab")
  const pageNindex = await msg.post("util", "get_nindex_from_url", tab.url)
  const url = new URL(location.href)

  const reload = (href) => {
    window.location.replace(href)
    window.location.reload()
  }

  if(!tabId && !purl && !pageNindex) {
    if(purl && decodeURIComponent(purl) !== tab.url) {
      url.hash = `#nindex=&tabId=&purl=${encodeURIComponent(tab.url)}&cbi=0&itemId=`
      reload(url.href)
    }

    return
  }

  const isAct = await isActivity(nindex, tabId) ? 1 : 0
  const needReload = +tabId !== +tab.id
    || decodeURIComponent(purl) !== tab.url
    || isAct != cbi

  url.hash = `#nindex=${pageNindex||""}&tabId=${tab.id}&purl=${encodeURIComponent(tab.url)}&cbi=${isAct}&itemId=${itemId||""}`
  needReload && reload(url.href)
}

window.addEventListener("load", async (e) => {
  listenBackground()

  if(isSafari()) {
    // 監聽cashback變化
    // safari需要檢查頁面跟現在的頁面是否match
    await checkPage()
    // 隱藏X按鈕
    document.getElementById("close").style.display = "none"
  }

  const lang = getSitesLang()
  const tab = new Tab(lang)
  const navbar = new Navbar
  navbar.bind()

  navbar.set("home", tab.index.bind(tab))
  navbar.set("search", tab.search.bind(tab))
  navbar.set("account", tab.account.bind(tab))

  tab.init()

  const iframeWindow = document.getElementById("content").contentWindow
  const handleList = clientHandle()
  for (const method in handleList) {
    ListenInternal(method, handleList[method], iframeWindow)
  }

  ListenInternal("swtich-tab", tab => {
    navbar.clear()
    navbar.to(tab)
  })

  const close = () => {
    window.open('', '_parent', '')
    window.close()
    msg.send("pop", "close")
  }
  ListenInternal("close", close)
  document.getElementById("close").addEventListener("click", close)
})
