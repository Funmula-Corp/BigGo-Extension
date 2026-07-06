/** alias send */
export async function post(name="", type="", msg={}) {
  return send(name, type, msg)
}

export function send(name="", type="", msg={}) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({name, type, msg}, resolve)
  })
}

export default {send, post}