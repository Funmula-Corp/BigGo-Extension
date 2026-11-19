import {wrapData} from "../Bridge"

export function getWrapData(type, data) {
  return wrapData({type, data, name: "popup"})
}

export async function send(type, data) {
  try {
    await chrome.runtime.sendMessage(getWrapData(type, data))
  } catch(e) {}
}