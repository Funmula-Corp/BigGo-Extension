export const STORAGE_KEY_SITES = "sites"
export const STORAGE_KEY_EC_LIST = "ec_list"
export const STORAGE_UNION_LIST = "union_list"
export const STORAGE_KEY_LOGIN = "login_status"
export const STORAGE_KEY_LOGIN_PROFILE = "login_info"
export const STORAGE_KEY_CONFIG = "config"
export const STORAGE_KEY_REGION = "region"
export const STORAGE_KEY_ACCOUNT_TOKEN = "account_token"
export const STORAGE_KEY_LOGIN_LAST_TIME = "login_last_time"
export const STORAGE_KEY_DOMAIN_MAP = "domain_map"
export const STORAGE_KEY_DOMAIN_REGION_MAP = "domain_region_map"

export async function getItem(key, def="") {
  const resolveDef = () => typeof def === "function" ? def() : def

  return new Promise(resolve => {
    chrome.storage.local.get(Array.isArray(key) ? key : [key], async (result) => {
      if(chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError)
        return resolve(await resolveDef())
      }

      if(!result || !result[key]) {
        return resolve(await resolveDef())
      }

      if(typeof key === "string") {
        return resolve(result[key])
      }

      resolve(result)
    })
  })
}

export async function getItemWithExpire(key, onExpire=()=>undefined) {
  const value = await getItem(key, false)
  if(!value) {
    return
  }

  if(!value.expire) {
    return value
  }

  if(Date.now() > (+value.expire + value.timestamp)) {
    const res = await onExpire()
    setItemWithExpire(key, value, Date.now())
    return res
  }

  return value.value
}

export async function setItem(key, value) {
  return new Promise(resolve => {
    chrome.storage.local.set({[key]: value}, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError)
        return resolve(false)
      }

      resolve()
    })
  })
}

export async function setItemWithExpire(key, value, expire = 60000) {
  return setItem(key, {
    timestamp: Date.now(),
    expire,
    value,
  })
}

export async function setObject(obj) {
  return new Promise(resolve => {
    chrome.storage.local.set(obj, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError)
        return resolve(false)
      }
      resolve()
    })
  })
}

export async function removeItem(key) {
  if(!key) {
    return
  }

  return new Promise(resolve => chrome.storage.local.remove(key, resolve))
}

export default {getItem, setItem, setObject, removeItem}
