import verify from "../../js/client/verify"

if(!window.___biggo_extension_handle___) {
  window.___biggo_extension_handle___ = {}
  window.___biggo_extension_handle_taraget___ = {}

  window.addEventListener("message", async (e) => {
    if(!verify(e.data)) {
      return
    }

    const receiver = window.___biggo_extension_handle___[e.data.type]
    const replyTarget = window.___biggo_extension_handle_taraget___[e.data.type]
      || (e.srcElement||window.parent||window)

    if(receiver) {
      receiver(e.data.msg, msg => {
        replyTarget.postMessage({
          type: `${e.data.type}_reply`,
          msg
        }, "*")
      })
    }
  })
}

export function listen(name, handle=()=>{}, target=null) {
  window.___biggo_extension_handle___[name] = handle

  if(target) {
    window.___biggo_extension_handle_taraget___[name] = target
  }
}

export default listen