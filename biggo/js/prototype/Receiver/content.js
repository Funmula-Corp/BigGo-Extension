import BrowserReceiver from "./browser"
import {send} from "../Sender/frontend"

class Content extends BrowserReceiver {
  constructor() {
    super("content")
  }

  /**
   * 取得回覆用的function
   * @TODO 需要新增可以回答runtime.sendMessage的reply function
   * @returns {Function}
   */
  getReply(type) {
    return super.getReply(type, send)
  }
}

Content._name = "content"
export default Content