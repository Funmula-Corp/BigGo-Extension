import { getQueryVariable } from "../util.shared"
import { getNindexFromURL } from "@shared/sites"
import Cashback from "./cashback"
import { isNotMainFrame } from "./util"

export class Session {
  constructor(host, nindex) {
    this.host = host
    this.nindex = nindex
    this.isLanded = false
  }

  land() {
    this.isLanded = true
  }

  isSameHost(host) {
    return this.host === host
  }
}

const STORAGE_KEY = "cashback_sessions"

/**
 * MV3: chrome.storage.session（SW 重啟後保留，瀏覽器關閉時清除）
 * MV2: 記憶體 Map（background page 持久存在）
 */
const SessionMap = process.env.MANIFEST_VERSION === "3" ? {
  async _load() {
    const data = await chrome.storage.session.get(STORAGE_KEY)
    return data[STORAGE_KEY] || {}
  },
  async _save(map) {
    await chrome.storage.session.set({ [STORAGE_KEY]: map })
  },
  async has(id) {
    const map = await this._load()
    return id in map
  },
  async get(id) {
    const map = await this._load()
    const data = map[id]
    if (!data) return null
    const session = new Session(data.host, data.nindex)
    session.isLanded = data.isLanded
    return session
  },
  async set(id, session) {
    const map = await this._load()
    map[id] = { host: session.host, nindex: session.nindex, isLanded: session.isLanded }
    await this._save(map)
  },
  async delete(id) {
    const map = await this._load()
    delete map[id]
    await this._save(map)
  },
  async update(id, fn) {
    const map = await this._load()
    if (!(id in map)) return
    fn(map[id])
    await this._save(map)
  }
} : (() => {
  const map = new Map
  return {
    async has(id) { return map.has(id) },
    async get(id) { return map.get(id) || null },
    async set(id, session) { map.set(id, session) },
    async delete(id) { map.delete(id) },
    async update(id, fn) {
      const s = map.get(id)
      if (s) fn(s)
    }
  }
})()

export async function isInSession(id) {
  return SessionMap.has(id)
}

export async function isLanded(id) {
  if(await isInSession(id)) {
    const session = await SessionMap.get(id)
    return session.isLanded
  }
  return false
}

export async function start(id, sitename) {
  if(await isInSession(id)) {
    return
  }
  const session = new Session(sitename)
  await SessionMap.set(id, session)
}

export async function stop(id) {
  const session = await SessionMap.get(id)
  if(session && session.isLanded) {
    await SessionMap.delete(id)
  }
}

function getHost(url) {
  try {
    const temp = new URL(url)
    return temp.hostname
  } catch(e) {}

  return ""
}

export async function listenBigGoR(info) {
  const {url, tabId} = info

  // onBeforeNavigate 不帶宣告式 URL filter（Safari 18.4 帶 filter 時 listener 不會觸發），
  // 改在此手動只挑 BigGo /r/ 導購連結
  if(!`${url}`.includes("/r/?")) {
    return
  }

  if(isNotMainFrame(info)) {
    return
  }

  const sourceUrl = getQueryVariable(url, "purl")
  if(!sourceUrl) {
    return
  }

  const originUrl = decodeURIComponent(sourceUrl)
  const host = getHost(originUrl)
  const nindex = await getNindexFromURL(originUrl)

  if(!host || !nindex) {
    return
  }

  await SessionMap.set(tabId, new Session(host, nindex))
  Cashback.updateCashbackActivity(nindex, tabId)
}

// onBeforeRequest <all_urls> 只比對 host 來「過期」返現 session（離站放棄歸屬），不記錄/不外傳 URL
export async function listenOtherSite(info) {
  if(isNotMainFrame(info)) {
    return
  }

  const {url, tabId} = info

  if(!await isLanded(tabId)) {
    return
  }

  const host = getHost(url)

  if(host === process.env.API_DOMAIN) {
    return
  }

  for (const pattern of [/acs\.nccc\.com\.tw/]) {
    if(pattern.test(url) || pattern.test(host)) {
      return
    }
  }

  const session = await SessionMap.get(tabId)
  const nindex = await getNindexFromURL(url)
  const isShopeeMall = session.nindex === "tw_mall_shopeemall" && `${url}`.indexOf("https://shopee.tw/mall") === 0
  if(nindex === session.nindex || isShopeeMall) {
    return
  }

  await SessionMap.delete(tabId)
  Cashback.cancelCashback(session.nindex, tabId)
}

export async function landingSite({url, tabId}) {
  if(!await isInSession(tabId)) {
    return
  }

  const host = getHost(url)
  const session = await SessionMap.get(tabId)
  if(session.isSameHost(host)) {
    await SessionMap.update(tabId, s => { s.isLanded = true })
  }
}

export async function onTabClosed(tabId) {
  if(await isInSession(tabId)) {
    const session = await SessionMap.get(tabId)
    await stop(tabId)
    Cashback.cancelCashback(session.nindex, tabId)
  }
}

export default {
  Session,
  start, stop, isInSession,
  listenBigGoR, listenOtherSite, landingSite, onTabClosed
}
