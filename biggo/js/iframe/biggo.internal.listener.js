import clientHandle from "../client/handle"
import verify from "../client/verify"

const _biggo_listener = clientHandle()

window.addEventListener("message", async (e) => {
  if(!verify(e.data)) {
    return
  }

  if(_biggo_listener[e.data.type]) {
    _biggo_listener[e.data.type](e.data.msg, msg => {
      window.postMessage({
        type: `${e.data.type}_reply`,
        msg
      }, "*")
    })
  }
})
