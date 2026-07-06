import share, { isSafari } from "../util.shared"
import { getIdWithRegexp } from "../core/shared/eclist"
import localStorage from "../core/shared/storage"
import wrapQueue from "./queue"

const HTTP_TIME_OUT = 1000 * 60 * 10
export function request(url, method="GET", body="", param={}) {
  const HTTP_TIME_OUT = 1000 * 60 * 10

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject("timeout")
    }, HTTP_TIME_OUT)

    if(body) {
      param.body = body
    }

    fetch(url, {
      method,
      mode: "cors",
      credentials: 'include',
      ...param
    }).then(resolve)
  })
}

export function get(url) {
  return request(url)
}

export function post(url, data={}) {
  return request(
    url, "POST",
    JSON.stringify(data),
    {
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }
  )
}

export function getJson(url) {
  return get(url).then(res => res.json())
}

export function getText(url) {
  return get(url).then(res => res.text())
}

export function postJson(url, data={}) {
  return post(url, data).then(res => res.json())
}

export function postText(url, data={}) {
  return post(url, data).then(res => res.text())
}

export const http = {
  getJson, getText, postJson, postText
}

export async function isProduct(nindex, pid) {
  return getProduct(nindex, pid).then(res => res.result)
}

const PRODUCT_CACHE_TTL = 1000 * 60 * 5
const productCache = new Map()

function getProductCacheKey(nindex, pid) {
  const key = Array.isArray(nindex) ? [...nindex].sort().join(",") : nindex
  return `${key}:${pid}`
}

export async function getProduct(nindex, pid) {
  const cacheKey = getProductCacheKey(nindex, pid)

  return wrapQueue(`getProduct:${cacheKey}`, async () => {
    const cached = productCache.get(cacheKey)
    if(cached && Date.now() - cached.cachedAt < PRODUCT_CACHE_TTL) {
      return cached.data
    }

    const url = `https://biggo.com.tw/api/get_product.php?oid=${pid}`

    let params = `&nindex=${nindex}`
    if(Array.isArray(nindex)) {
      params = nindex.reduce((acc, index) => {
        acc += `&nindex[]=${index}`
        return acc
      }, "")
    }

    const data = await getJson(`${url}${params}`)
    productCache.set(cacheKey, { data, cachedAt: Date.now() })
    return data
  })
}

export async function detectShopeeBid(pid) {
  return isProduct("tw_bid_shopee", pid)
}

export async function detectShopeeMall(pid) {
  return isProduct("tw_mall_shopeemall", pid)
}

export function getProductInfo(pid, nindex) {
  return getJson(`https://biggo.com.tw/api/get_product.php?nindex=${nindex}&oid=${pid}`)
}

export async function getShopeePid(url) {
  const list = await localStorage.getItem("ec_list", {})
  if(!list.tw_mall_shopeemall) {
    return false
  }

  if(!list.tw_mall_shopeemall.match) {
    return false
  }

  let regexList = list.tw_mall_shopeemall.match
  let tempList = list.tw_mall_shopeemall.template
  // 統一處理成陣列
  if(!Array.isArray(list.tw_mall_shopeemall.match)) {
    regexList = [list.tw_mall_shopeemall.match]
  }
  if(!Array.isArray(list.tw_mall_shopeemall.match)) {
    tempList = [list.tw_mall_shopeemall.template]
  }

  const filtered = regexList.map((reg, index) => {
    const tmp = tempList[index]
    return getIdWithRegexp(url, reg, tmp)
  }).filter(result => result.pid)

  if(filtered.length) {
    return filtered[0].pid
  }
  return false
}

export async function getCurrentTab() {
  return new Promise(resolve => {
    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, tabs => {
      if(Array.isArray(tabs) && tabs[0]) {
        return resolve(tabs[0])
      }

      resolve(false)
    })
  })
}

/**
 * 取得目前蝦皮的正確nindex bg版本
 * @param {string} pid
 * @param {string} url
 */
async function getTrueShopeeNindex(pid, url) {
  // 非商品頁
  if(!pid || (pid && pid === "biggo")) {
    // 沒有/mall就是購物
    if(url.indexOf("shopee.tw/mall") === -1 && url.indexOf("shopee.tw/cart") === -1  && url.indexOf("mall.shopee.tw") === -1) {
      return "tw_bid_shopee"
    }
  }else{
    const result = await detectShopeeMall(pid)
    if(!result) {
      return "tw_bid_shopee"
    }
  }
  return "tw_mall_shopeemall"
}

export async function resolveTrueNindex(nindex, url) {
  if(["tw_mall_shopeemall", "tw_bid_shopee"].includes(nindex)) {
    const pid = await getShopeePid(url)
    return { nindex: await getTrueShopeeNindex(pid, url), pid: pid || "" }
  }

  if(nindex === "tw_bid_momostoreplus" && !url.includes("/TP/")) {
    return { nindex: "tw_pec_momoshop", pid: "" }
  }
  return { nindex, pid: "" }
}

export function sendMsgToCurrentPage(type, data) {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {type, data})
  })
}

/**
 * @param {chrome.webNavigation.WebNavigationParentedCallbackDetails} webDetails
 * @returns {boolean}
 */
export function isNotMainFrame(webDetails) {
  if(!isSafari()) {
    return webDetails.parentFrameId !== -1
  }

  if("type" in webDetails) {
    return webDetails.type !== "main_frame"
  }

  return webDetails.parentFrameId !== 0 && webDetails.parentFrameId !== -1
}

export async function getCurrentTabId(tabid) {
  if(tabid && tabid > 0) {
    return tabid
  }

  return new Promise(resolve => {
    // timeout handle
    setTimeout(() => resolve(tabid), 500)

    // query
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      if(!tabs || !tabs.length) {
        return resolve(tabid)
      }

      resolve(tabs[0].id)
    })
  }).catch(() => tabid)
}
