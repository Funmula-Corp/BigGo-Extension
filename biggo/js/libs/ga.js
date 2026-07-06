import { v1 as uuid } from "uuid"
import { isFirefox } from "../util.shared"
import storage from "../core/shared/storage"

const gaAPIKey = process.env.GA_API_SECRET
const gaId = process.env.GA_MEASUREMENT_ID

// 讀 biggo 自家網域的 _ga cookie 延續匿名分析 id（無個資），取不到就用隨機 UUID
export async function getClientId() {
  const cacheId = await storage.getItem("ga_cid")
  if(cacheId) {
    return cacheId
  }

  return new Promise(resolve => {
    const onFail = () => resolve(getUUID())

    chrome.cookies.get({url: `https://${process.env.API_DOMAIN}`, name: "_ga"}, c => {
      if(!c) {
        return onFail()
      }

      const testResult = /(\d{3,}\.\d{3,})/.exec(c.value || "")
      if(!testResult || !testResult.length) {
        return onFail()
      }

      resolve(testResult[0])
      storage.setItem("ga_cid", testResult[0])
    })

    // 已防萬一
    setTimeout(() => resolve(getUUID()), 1000);
  }).catch(() => getUUID())
}

export async function getUUID() {
  const storageUUID = await storage.getItem("uuid")
  if(storageUUID && storageUUID.length) {
    return storageUUID
  }

  const _uuid = uuid()
  storage.setItem("uuid", _uuid)

  return _uuid
}

let gaUserId = ""
export function setGAUserId(id) {
  gaUserId = id
}

/**
 * send ga event
 * @param {string} eventCategory
 * @param {string} eventAction
 * @param {string} eventLabel
 * @returns {Promise<Response|null>}
 */
export default async function(eventCategory, eventAction, eventLabel) {
  if(isFirefox()) {
    return
  }

  // Analytics is opt-in at build time via GA_API_SECRET / GA_MEASUREMENT_ID env vars.
  if(!gaAPIKey || !gaId) {
    return
  }

  try {
    if (!eventAction && !eventCategory) {
      console.warn('sendAnalyticsEvent() called with no eventAction or ' + 'eventCategory.')
      // We want this to be a safe method, so avoid throwing unless absolutely necessary.
      return
    }

    // Create hit data
    const payloadData = {
      // Version Number
      client_id: chrome.runtime.id,
      // Client ID
      user_id: await getClientId(),
      events: [{
        name: eventCategory,
        params: {
          action: eventAction,
          label: eventLabel,
        },
      }]
    }

    if(gaUserId) {
      payloadData.user_id = gaUserId
    }

    // Post to Google Analytics endpoint
    const url = `https://www.google-analytics.com/mp/collect?api_secret=${gaAPIKey}&measurement_id=${gaId}`
    return navigator?.sendBeacon
      ? navigator?.sendBeacon(url, JSON.stringify(payloadData))
      : fetch(url, {
        body: JSON.stringify(payloadData),
        method: 'POST'
      })
  } catch(e) {
    console.error(e)
  }
}
