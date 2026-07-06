import {uuid} from "../util.shared"

const MESSAGE_SOURCE = "__biggo__"

/**
 * 驗證是否為監聽器該接收的訊息
 * @param {string} name
 * @param {Object} data
 * @returns {boolean}
 */
export function verify(name, data) {
  if(!data) {
    return false
  }

  if(typeof data !== "object") {
    return false
  }

  if(!data.type) {
    return false
  }

  if(!data.target || data.target !== name) {
    return false
  }

  if(!data.hash) {
    return false
  }

  if(data.source !== MESSAGE_SOURCE) {
    return false
  }

  return true
}

/**
 * 包裝資料 使其符合驗證器的條件
 * @returns {Object<string, any>}
 */
export function wrapData({name="", type="", data={}, hash=""}={}, reply=false) {
  if(reply) {
    data.reply = true
  }

  hash = hash || uuid()
  type = `${type}.${hash}`

  return {
    data, type, hash,
    target: name,
    source: MESSAGE_SOURCE
  }
}

export function getDataType(type) {
  const _type = (type+"")
  if(_type.indexOf(".") > -1) {
    return _type.slice(0, _type.lastIndexOf("."))
  }

  return type
}

function getAdapterWrapper(name) {
  return (data, reply=false) => wrapData({name, data}, reply)
}

export const adapter = {
  content: getAdapterWrapper("content"),
  frontend: getAdapterWrapper("frontend")
}
