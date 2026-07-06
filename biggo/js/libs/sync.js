import { getJson, getText, postJson } from "./util"
import User from "./user"
import { setConfigFromServer } from "@shared/config"
import wrapQueue from "./queue"
import storage, { STORAGE_KEY_ACCOUNT_TOKEN, STORAGE_KEY_SITES, STORAGE_KEY_EC_LIST, STORAGE_KEY_LOGIN, STORAGE_KEY_LOGIN_LAST_TIME, STORAGE_KEY_REGION, STORAGE_UNION_LIST, STORAGE_KEY_DOMAIN_MAP, STORAGE_KEY_DOMAIN_REGION_MAP } from "@shared/storage"
import { getNindexRegion } from "@/util.shared"
import fallbackSites from "@/sites.json"
import { isLogin as getIsLogin } from "@/core/shared/user"

// TODO 或許可以把API隔開來當一個庫
// geoip 只用來選使用者地區/語言，非位置追蹤
export function syncRegion() {
  return wrapQueue("sync:region", async (_region) => {
    if(_region) {
      return _region
    }

    const lastUpdate = await storage.getItem("region_update_at", 0)
    const isOverTime = Date.now() - +lastUpdate > (1000 * 60 * 60 * 3)
    if(!isOverTime) {
      return await storage.getItem(STORAGE_KEY_REGION)
    }

    const url = `https://${process.env.API_DOMAIN}/api/geoip_country.php`
    const data = await getText(url).catch(e => {
      console.error('getRegion err: ', e)
      return ""
    })

    storage.setItem("region_update_at", Date.now())
    storage.setItem(STORAGE_KEY_REGION, data)
    const baseConfig = {
      domain: process.env.API_DOMAIN,
      name: "region",
      value: data,
      path: "/",
      url: `https://${process.env.API_DOMAIN}`
    }
    chrome.cookies.set(baseConfig)
    chrome.cookies.set({...baseConfig, path: "/api"})
    return data
  })
}

export function getSiteData(region="") {
  region = region === 'th' ? 'thai' : region
  const param = region && `region=${region}` || ""
  const url = `https://${process.env.API_DOMAIN}/api/sites_v2.php?${param}`
  return getJson(url)
}

export function buildDomainMap(sites) {
  const map = {}
  const regionMap = {}
  for (const nindex in sites) {
    if (nindex.startsWith("biggo")) {
      continue
    }

    const site = sites[nindex]
    // sites_v2 API 回傳的 domain 是字串，內建 sites.json 是陣列，兩種都要支援
    const domains = Array.isArray(site?.domain) ? site.domain : (typeof site?.domain === "string" && site.domain ? [site.domain] : [])
    if (domains.length > 0) {
      for (const domain of domains) {
        if (domain in map) {
          // 第一次碰撞，把原本的也搬到 regionMap
          if (!regionMap[domain]) {
            regionMap[domain] = {
              [getNindexRegion(map[domain])]: map[domain]
            }
          }
          regionMap[domain][getNindexRegion(nindex)] = nindex
          delete map[domain]
        } else if (domain in regionMap) {
          // 已在 regionMap 中，直接加入
          regionMap[domain][getNindexRegion(nindex)] = nindex
        } else {
          map[domain] = nindex
        }
      }
    }
  }
  return { map, regionMap }
}

/**
 * sites_v2 API 回傳的 domain 是字串，但下游（buildDomainMap、getNindexFromSitelist、popup 等）
 * 都預期陣列，統一在存入 storage 前轉成陣列
 */
export function normalizeSites(sites) {
  if (!sites || typeof sites !== "object") {
    return sites
  }
  for (const nindex in sites) {
    const site = sites[nindex]
    if (site && typeof site.domain === "string" && site.domain) {
      site.domain = [site.domain]
    }
  }
  return sites
}

export async function updateSites() {
  let data
  try {
    data = normalizeSites(await getSiteData())
    await storage.setObject({ [STORAGE_KEY_SITES]: data, ec_last_time: Date.now() })
  } catch(e) {
    // API 失敗不存 STORAGE_KEY_SITES，fallbackSites 只有 domain 欄位不適合作為完整 sites 資料
  }
  await updateSitesMap(data)
  return data
}

let _fallbackDomainMap
export function buildFallbackDomainMap() {
  if (!_fallbackDomainMap) _fallbackDomainMap = buildDomainMap(fallbackSites)
  return _fallbackDomainMap
}

export async function updateSitesMap(sites) {
  if (!sites) {
    sites = await storage.getItem(STORAGE_KEY_SITES, undefined)
    if (!sites || Object.keys(sites).length === 0) {
      sites = fallbackSites
    }
  }

  const { map, regionMap } = buildDomainMap(sites)
  await storage.setObject({
    [STORAGE_KEY_DOMAIN_MAP]: map,
    [STORAGE_KEY_DOMAIN_REGION_MAP]: regionMap,
  })
}

export async function syncSitesProcess(force=false) {
  try {
    // 6 hr
    const CACHE_EXPIRE_TIME = 1000 * 60 * 60 * 6
    // check last get data time
    const lastTime = await storage.getItem("ec_last_time")
    const isFirstTime = !lastTime
    const isOverTime = Date.now() - +lastTime > CACHE_EXPIRE_TIME

    if(force || isFirstTime || isOverTime) {
      return await updateSites()
    }

    const sites = await storage.getItem(STORAGE_KEY_SITES)
    if(sites) {
      return sites
    }
  } catch (error) {
    console.error("get sites list error: ", error)
  }

  return {}
}

export async function syncSites(force=false) {
  return wrapQueue("sync:sites", () => syncSitesProcess(force))
}

export async function getCPData(nindex) {
  // const url = `https://${process.env.API_DOMAIN}/api/store.php?method=get_store_coupon&id=${nindex}`
  // return getJson(url)
  return []
}

export async function syncCouponProcess(nindex) {
  if(!nindex) {
    return []
  }

  try {
    const CACHE_EXPIRE_TIME = 1000 * 60 * 30
    // get last time from store
    const lastTime = await storage.getItem(`coupon_last_time:${nindex}`, 0)
    const list = await storage.getItem("coupon_list", {})
    const isOverTime = Date.now() - +lastTime > CACHE_EXPIRE_TIME
    // 第一次或超過時間都要抓
    if(!lastTime || isOverTime) {
      const data = await getCPData(nindex)
      // 如果有正常抓到資料
      if(data && Array.isArray(data)) {
        const item = {
          ...list,
          [nindex]: data
        }
        storage.setItem("coupon_list", item)
        storage.setItem(`coupon_last_time:${nindex}`, Date.now())
        return data
      }
    }

    const couponList = await storage.getItem("coupon_list")
    if(couponList) {
      return couponList
    }
  } catch (error) {
    console.error("get coupon list error: ", error)
  }

  return []
}

export async function syncCoupon(nindex) {
  return wrapQueue(`sync:cp:${nindex}`, () => syncCouponProcess(nindex))
}

export async function getMemberData(force=false) {
  if (force || await getIsLogin()) {
    const url = `https://${process.env.API_DOMAIN}/api/member.php`
    return await getJson(url)
  }

  return undefined
}

export async function syncLoginProcess(force=false) {
  try {
    // get region
    // const region = await getRegion()
    // constant
    const TIMEOUT = 1000 * 60 * 30
    // flag
    const loginStatus = await storage.getItem(STORAGE_KEY_LOGIN)
    const loginLast = await storage.getItem(STORAGE_KEY_LOGIN_LAST_TIME, 0)
    const isFirstTime = !loginStatus
    const isOverTime = Date.now() - +loginLast > TIMEOUT

    if(isFirstTime || isOverTime || force) {
      const data = await getMemberData(force)

      if(!data) {
        return false
      }

      const isLogin = !!data.is_login
      const username = data.name || ""

      User.setLogin(isLogin, data)
      storage.setItem(STORAGE_KEY_LOGIN_LAST_TIME, Date.now())
      if(username) {
        storage.setItem("username", username)
      }

      // 如果有設定值
      if(data.extension_config) {
        setConfigFromServer(data.extension_config)
      }

      return isLogin
    }

    return !!JSON.parse(loginStatus)
  } catch (error) {
    console.error("sync login error: ", error)
  }

  return false
}

export async function syncLogin(force=false) {
  return wrapQueue("sync:login", () => syncLoginProcess(force))
}

export async function getUserName() {
  return storage.getItem("username", "")
}

/**
 * 將
 * tw: {
 *   nindex: {...}
 * }
 * 轉換成
 * {
 *   nindex: {
 *     region: tw,
 *     ...
 *   }
 * }
 */
export function transformECList(object) {
  const tmp = {}

  for (const region in object) {
    const list = object[region]
    for (const nindex in list) {
      const data = list[nindex]

      tmp[nindex] = {
        ...data,
        region,
        nindex
      }
    }
  }

  return tmp
}

export async function updateECList() {
  try {
    const url = `https://${process.env.API_DOMAIN}/api/eclist.php`
    const obj = await getJson(url)

    let list = {}
    if(obj.result) {
      list = transformECList(obj.data)
      await storage.setObject({
        [STORAGE_KEY_EC_LIST]: list,
        [STORAGE_UNION_LIST]: obj.union,
        ec_list_update_at: Date.now()
      })
    }

    return list
  } catch (error) {
    console.error("sync ec error: ", error)
  }

  return {}
}

export async function syncECListProcess(force=false) {
  const CACHE_EXPIRE_TIME = 1000 * 60 * 60 * 3

  const lastUpdate = await storage.getItem("ec_list_update_at", 0)
  const isOverTime = Date.now() - +lastUpdate > CACHE_EXPIRE_TIME
  let list = await storage.getItem(STORAGE_KEY_EC_LIST)
  if(force || !list || isOverTime) {
    list = await updateECList()
  }
  return list
}

export async function syncECList(force=false) {
  return wrapQueue("sync:eclist", () => syncECListProcess(force))
}

export async function getPriceHistory(item, days) {
  const url = `https://${process.env.API_DOMAIN}/api/product_price_history.php`
  const body = {item, days}
  return postJson(url, body)
}

export async function getLastLoginList() {
  return getJson(`https://${process.env.ACCOUNT_DOMAIN}/api/get_loginlist.php`)
}

export async function syncAccountToken(force=false) {
  const CACHE_EXPIRE_TIME = 1000 * 60 * 30

  const lastUpdate = await storage.getItem("sync_token_update_at", 0)
  const isOverTime = Date.now() - +lastUpdate > CACHE_EXPIRE_TIME
  let token = await storage.getItem(STORAGE_KEY_ACCOUNT_TOKEN)

  console.log("[BigGo login] syncAccountToken force:", force, "isOverTime:", isOverTime, "cachedToken:", token)

  if(!token || isOverTime || force) {
    const url = `https://${process.env.ACCOUNT_DOMAIN}/api/get_token.php`
    // get_token.php 回傳帶引號的字串（未登入時是 `""`）；去引號/空白正規化後儲存，
    // 空字串即代表未登入。這樣下方判斷與儲存值一致，不會被引號字元騙過。
    token = (await getText(url) + "").replaceAll(/\"/g, "").trim()
    console.log("[BigGo login] get_token.php =>", JSON.stringify(token))
    await storage.setObject({
      [STORAGE_KEY_ACCOUNT_TOKEN]: token,
      sync_token_update_at: Date.now()
    })
  }

  if (token && token !== "[]" && (force || isOverTime)) {
    console.log("[BigGo login] token valid -> call login.php?src=extension + setLogin(true)")
    await getText(`https://${process.env.API_DOMAIN}/api/login.php?src=extension&token=${token}`)
    User.setLogin(true)
  } else {
    console.log("[BigGo login] setLogin NOT called (token empty/invalid or not force/overtime)")
  }

  return token
}

export async function clearAccountToken() {
  // 登出時清掉快取 token（含更新時間戳），讓下次 syncAccountToken 一定重抓 get_token.php
  return storage.removeItem([STORAGE_KEY_ACCOUNT_TOKEN, "sync_token_update_at"])
}

export default {
  syncRegion,
  syncSites,
  updateSites,
  syncCoupon,
  syncLogin,
  syncECList,
  updateECList,
  getUserName,
  getMemberData,
  getPriceHistory,
  getLastLoginList,
  syncAccountToken,
  clearAccountToken
}
