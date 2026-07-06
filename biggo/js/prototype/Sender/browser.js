import {wrapData, getDataType} from "../Bridge"
import Receiver from "../Receiver/index"

export function send(data) {
  window.postMessage(data)
}

export async function post(data, receiver) {
  const rev = Receiver.getReceiver(receiver)
  const {type} = data

  return new Promise(resolve => {
    const listenKey = `${type}_reply`
    rev.onMessage(listenKey, res => {
      rev.removeListener(listenKey)
      resolve(res)
    })

    rev.listen()
    send(data)
  })
}
