/** @type {Record<string, Promise<any>>} */
globalThis.globalQueue = globalThis.globalQueue || {}
/** @type {Record<string, number>} */
globalThis.globalQueueTimers = globalThis.globalQueueTimers || {}

const QUEUE_EXPIRE_TIME = 1000 * 60 * 5

function scheduleCleanup(key) {
  if(globalThis.globalQueueTimers[key]) {
    clearTimeout(globalThis.globalQueueTimers[key])
  }
  globalThis.globalQueueTimers[key] = setTimeout(() => {
    delete globalThis.globalQueue[key]
    delete globalThis.globalQueueTimers[key]
  }, QUEUE_EXPIRE_TIME)
}

/**
 * 同步佇列管理
 * @param {string} key
 * @param {(...any)=>Promise<T>} fn
 */
export default async function(key, fn) {
  if(!globalThis.globalQueue[key]) {
    globalThis.globalQueue[key] = Promise.resolve("")
  }

  globalThis.globalQueue[key] = globalThis.globalQueue[key]
    .then(fn)
    .then((result) => {
      scheduleCleanup(key)
      return result
    }).catch(e => {
      console.error(e)
      scheduleCleanup(key)
      return undefined
    })

  return globalThis.globalQueue[key]
}
