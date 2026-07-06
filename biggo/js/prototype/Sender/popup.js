import {wrapData} from "../Bridge"
import ContentRceiver from "../Receiver/content"
import * as BrowserSender from "./browser"

export function getWrapData(type, data) {
  return wrapData({type, data, name: "popup"})
}

export async function send(type, data) {
  try {
    await chrome.runtime.sendMessage(getWrapData(type, data))
  } catch(e) {}
}