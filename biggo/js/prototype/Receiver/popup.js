import Receiver from "./index"
import {verify} from "../Bridge"

class Popup extends Receiver {
  constructor() {
    super("popup")
  }

  /**
   * @param {MessageEvent} e
   * @returns {boolean}
   */
  verify(e) {
    if(!e.data) {
      return
    }

    return verify(this.name, e)
  }

  listenProcess() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if(!this.verify(request)) {
        return true
      }

      const {type, data} = request
      this.callback(type, data, sendResponse)
      return true
    })
  }
}

Popup._name = "popup"
export default Popup