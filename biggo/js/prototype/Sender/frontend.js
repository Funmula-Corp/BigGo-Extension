import {wrapData} from "../Bridge"
import * as BrowserSender from "./browser"

export function getWrapData(type, data) {
  return wrapData({type, data, name: "frontend"})
}

export function send(type, data, hash="") {
  BrowserSender.send(getWrapData(type, data, hash))
}
