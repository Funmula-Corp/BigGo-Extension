import {wrapData} from "../Bridge"
import receiver from "../Receiver/frontend"
import * as BrowserSender from "./browser"

export function getWrapData(type, data) {
  return wrapData({type, data, name: "content"})
}

export function send(type, data, hash="") {
  BrowserSender.send(getWrapData(type, data, hash))
}

export async function post(type, data) {
  return await BrowserSender.post(getWrapData(type, data), receiver)
}
