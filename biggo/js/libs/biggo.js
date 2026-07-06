import * as Region from "@shared/region"
import { getNindexFromURL } from "@shared/sites"
import { isNotMainFrame } from "./util"
import Sync from "./sync"
import User from "./user"
import { sleep } from "../util.shared"
import Cashback from "./cashback"
import { updateAllPopMenu } from "./popup"
import { send as sendPopup } from "../prototype/Sender/popup.js"
import BigGoDomains from "../../manifest.biggo.json"
import { installContextMenu } from "./contextMenu"

const BIGGO_SESSIONID_COOKIE_NAME = "PHPSESSID"
const TARGET_BIGGO_DOMAIN = process.env.API_DOMAIN || "extension.biggo.com"

function getDomainsFilter(opt={}) {
  return BigGoDomains.map(dn => ({
    hostEquals: dn,
    ...opt
  }))
}

export function getDomainList() {
  return Region.list.map(region => `https://${Region.getRegionDomain(region)}`)
}

// 組 https://{API_DOMAIN}/r/?... BigGo 自家導購連結；purl 只做編碼、逐字保留，不竄改既有參數
export function getRUrl({nindex, url, domain, lb="", pid="biggo", loginRequired=false}={}) {
  let purl = encodeURIComponent(url)

  if(nindex === "tw_ec_carrefour") {
    purl = encodeURIComponent(purl)
  }

  return `https://${domain}/r/?f=extension&id=${pid}&i=${nindex}&purl=${purl}${loginRequired?"&rasklogin=1":""}${lb?`&lb=${lb}`:""}`
}

export async function r(url, nindex, loginRequired=false, lb="") {
  if(!url) {
    return
  }

  nindex = nindex || await getNindexFromURL(url)
  if(!nindex) {
    return
  }
  const domain = process.env.API_DOMAIN
  const rurl = getRUrl({nindex, domain, url, loginRequired, lb})

  let query = {url}
  if(loginRequired) {
    query = {active: true, currentWindow: true}
  }

  chrome.tabs.query(query, tabs => {
    tabs.forEach(item => {
      // rasklogin 的登入型導購會一路 302 串到商家頁，login.php?token= 只是中繼跳、
      // onCommitted 看不到；改在該分頁導航完成時補抓 token，讓登入狀態能更新
      if(loginRequired) {
        watchLoginRedirect(item.id, url)
      }
      chrome.tabs.update(item.id, {url: rurl})
    })
  })
}

// 監看 loginRequired 導購的那個分頁。這條路徑有兩種狀態：
//  - 已登入：一路 302 直接回到原本導購的網域（商家頁）
//  - 未登入：中途會卡在第三方登入頁（google/fb），登入完才 302 回來
// 所以完成條件是「導航回到原本 url 的網域」才 syncAccountToken(true) 補同步、然後自我移除。
// 另設 10 分鐘 fallback TTL，時間到還沒完成就直接砍掉監聽器，避免洩漏。
function watchLoginRedirect(tabId, targetUrl) {
  let targetHost = ""
  try { targetHost = new URL(targetUrl).host } catch(e) {}

  let timer = null

  const onDone = async (info) => {
    if(info.tabId !== tabId || isNotMainFrame(info)) {
      return
    }

    let host = ""
    try { host = new URL(info.url).host } catch(e) {}
    // 還沒回到原本導購的網域（可能卡在 google/fb 登入頁）就繼續等
    if(!targetHost || host !== targetHost) {
      return
    }

    chrome.webNavigation.onCompleted.removeListener(onDone)
    if(timer) {
      clearTimeout(timer)
    }
    const token = await Sync.syncAccountToken(true)
    if(token && token !== "[]") {
      loginHandle()
    }
  }

  chrome.webNavigation.onCompleted.addListener(onDone)

  // fallback：10 分鐘還沒回到原網域就砍掉監聽器
  timer = setTimeout(() => {
    chrome.webNavigation.onCompleted.removeListener(onDone)
  }, 10 * 60 * 1000)
}

export async function redirectActiveTab(nindex, lb="") {
  const bigGoDomain = process.env.API_DOMAIN

  // 只導目前作用中的分頁（使用者正在看的那個商家頁），不碰背景分頁
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    tabs.forEach(tab => {
      if(!tab.url) {
        return
      }

      const rurl = getRUrl({
        nindex, lb,
        domain: bigGoDomain,
        url: tab.url,
      })
      chrome.tabs.update(tab.id, {url: rurl})
    })
  })
}

export async function logoutHandle() {
  User.setLogin(false)
  Sync.clearAccountToken()
  Cashback.clear()
  updateAllPopMenu()
  sendPopup("logout")
  installContextMenu()
}

export async function loginHandle() {
  User.setLogin(true)
  Sync.syncLogin(true)
  updateAllPopMenu()
  sendPopup("login")
  installContextMenu()
}

export const SOCIAL_METHOD_GOOGLE = "google",
  SOCIAL_METHOD_FB = "facebook"

export async function loginSocialAccount(method) {
  return new Promise(resolve => {
    const url = `https://${process.env.API_DOMAIN}/api/login.php?method=${method}`
    chrome.tabs.create({url}, resolve)
  })
}

const INSTALL_COOKIE_NAME = "extension_installed"

// 只在 biggo 各區域自家網域寫「擴充已安裝」旗標 cookie，非商家 affiliate cookie
export function updateInstallCookie() {
  Region.list.forEach(region => {
    const domain = `https://${Region.getRegionDomain(region)}/`
    const nowTimestamp = Date.now() / 1000

    chrome.cookies.set({
      expirationDate: nowTimestamp + 60 * 60 * 24 * 90,
      path: "/",
      name: INSTALL_COOKIE_NAME,
      value: nowTimestamp+"",
      url: domain
    })
  })
}

export function removeInstallCookie() {
  Region.list.forEach(region => {
    const domain = `https://${Region.getRegionDomain(region)}/`

    chrome.cookies.remove({
      url: domain,
      name: INSTALL_COOKIE_NAME
    })
  })
}

export function bindAccountStatusListener() {
  bindAccountLoginListener()
  bindAccountLogoutListener()
  bindInstallCookieUpdater()
}

export function bindAccountLoginListener() {
  if(globalThis.isBindedLoginLtr) {
    return
  }
  globalThis.isBindedLoginLtr = true

  const rule = {
    url: [
      ...getDomainsFilter({
        queryContains: "token",
        pathContains: "/login.php"
      }),
      // 登入完成會落到 <biggo網域>/auth.php（例如 extension.biggo.com/auth.php）
      ...getDomainsFilter({
        pathContains: "/auth.php"
      }),
      {urlPrefix: "https://account.biggo.com/setting"}
    ]
  }

  console.log("[BigGo login] register login listener, rule:", JSON.stringify(rule))

  // 節流flag
  let loginFlag = false
  chrome.webNavigation.onCommitted.addListener(async (info) => {
    console.log("[BigGo login] onCommitted fired:", info.url)
    // 跳過iframe
    if(isNotMainFrame(info)) {
      console.log("[BigGo login] skip: not main frame")
      return
    }

    const {url} = info
    // 代表這個請求是下面程式碼發出的
    if(`${url}`.startsWith(`https://${process.env.API_DOMAIN}/api/login.php?src=extension`)) {
      console.log("[BigGo login] skip: self-issued login.php?src=extension")
      await Sync.syncAccountToken(false)
      return
    }

    if(loginFlag) {
      console.log("[BigGo login] skip: throttled (loginFlag)")
      return
    }
    loginFlag = true

    await sleep(1000)
    const token = await Sync.syncAccountToken(true)
    console.log("[BigGo login] syncAccountToken =>", token)
    if(token && token !== "[]") {
      console.log("[BigGo login] token valid -> loginHandle() + send login_success")
      loginHandle()

      // send to content
      chrome.tabs.query({currentWindow: true, active: true}, tabs => {
        if(tabs.length) {
          setTimeout(() => {
            chrome.tabs.sendMessage(tabs[0].id, {type: "login_success"})
          }, 3000)
        }
      })
    } else {
      console.log("[BigGo login] token empty/invalid -> stay logged out")
    }
    loginFlag = false
  }, rule)
}

export function bindAccountLogoutListener() {
  if(globalThis.isBindedLogoutLtr) {
    return
  }
  globalThis.isBindedLogoutLtr = true

  chrome.webNavigation.onBeforeNavigate.addListener(details => {
    if(isNotMainFrame(details)) {
      return
    }

    if(details && details.url && details.url.indexOf("?src=extension") > -1) {
      return
    }

    logoutHandle()
  }, {
    url: [{
      hostEquals: "account.biggo.com",
      pathContains: "/logout.php"
    }]
  })

  // 刪除帳號
  if(process.env.MANIFEST_VERSION === "2") {
    chrome.webRequest.onBeforeRequest.addListener((obj) => {
      logoutHandle()
    }, {
      urls: [`https://${process.env.ACCOUNT_DOMAIN}/api/delete_member.php*`],
      types: ["xmlhttprequest"]
    })
  }
}

export function bindInstallCookieUpdater() {
  chrome.webNavigation.onBeforeNavigate.addListener(details => {
    if(isNotMainFrame(details)) {
      return
    }

    if(details.url.includes("/api/")) {
      return
    }

    updateInstallCookie()
  }, {url: getDomainsFilter()})
}

export default {
  r, redirectActiveTab,
  loginSocialAccount,
  SOCIAL_METHOD_GOOGLE,
  SOCIAL_METHOD_FB,
  updateInstallCookie,
  removeInstallCookie,
  bindAccountStatusListener,
  getDomainList,
  getRUrl,
  logoutHandle
}
