import Receiver from "./index"
import {verify} from "../Bridge"

export default class Browser extends Receiver {
  constructor(name) {
    super(name)
    this.listener = null
  }

  /**
   * @param {MessageEvent} e
   * @returns {boolean}
   */
  verify(e) {
    if(!e.data) {
      return
    }

    return verify(this.name, e.data)
  }

  listenProcess() {
    this.listener = e => {
      if(!this.verify(e)) {
        return
      }

      const {type, data} = e.data
      this.callback(type, data, this.getReply(type))
    }

    window.addEventListener("message", this.listener)
  }

  destroy() {
    this.listener && window.removeEventListener("message", this.listener)
  }
}
