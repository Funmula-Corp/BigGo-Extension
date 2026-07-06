import {getDataType} from "../Bridge"

const GLOBAL_FN = "__biggo_msg_receiver"
/**
 * 訊息傳遞原型物件
 * @interface
 */
class Receiver {
  constructor(name="_biggo_message") {
    this.cbs = {}
    this.name = name
    this.sender = () => {}
    this.listenFlag = false
  }

  /**
   * 執行callback
   * @param {string} type
   * @param {any} data
   */
  callback(type, data, reply) {
    // type name without hash
    const _type = getDataType(type)
    reply = reply || this.getReply(type)

    if(this.cbs[_type]) {
      this.cbs[_type](data, reply)
    }
  }

  /**
   * 取得回覆用的function
   * @returns {Function}
   */
  getReply(type, send=this.sender) {
    return data => {
      send(`${type}_reply`, data)
    }
  }

  /**
   * 監聽用的callback
   * @param {string} type 類別
   * @param {Function} cbs
   */
  onMessage(type, callback) {
    if(typeof callback !== "function") {
      return
    }

    this.cbs[type+""] = callback
  }

  /**
   * 一次監聽多個
   * @param {Object<string, Function>} obj
   */
  onMessageList(obj={}) {
    for (const name in obj) {
      this.onMessage(name, obj[name])
    }
  }

  /**
   * 移除callback
   * @param {string} type
   */
  removeListener(type) {
    if(this.cbs[type]) {
      delete this.cbs[type]
    }
  }

  listen() {
    if(this.listenFlag) {
      return
    }

    this.listenFlag = true
    this.listenProcess()
  }

  /**
   * @override
   */
  listenProcess() {}
  destroy() {}
}

/**
 * 取得全域下的receiver
 * @param {Receiver} receiver
 * @returns {Receiver}
 */
Receiver.getReceiver = receiver => {
  const name = `__biggo_msg_receiver_${receiver._name}`
  if(!window[name]) {
    window[name] = new receiver
  }

  return window[name]
}

export default Receiver