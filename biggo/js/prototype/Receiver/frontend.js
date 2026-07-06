import BrowserReceiver from "./browser"
import {send} from "../Sender/content"

class Frontend extends BrowserReceiver {
  constructor() {
    super("frontend")
  }

  /**
   * 取得回覆用的function frontend只會回覆content
   * @returns {Function}
   */
  getReply(type) {
    return super.getReply(type, send)
  }
}

Frontend._name = "frontend"
export default Frontend