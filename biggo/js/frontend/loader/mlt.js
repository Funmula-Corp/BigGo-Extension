import * as Mlt from "../mlt"
import { MLT_GLOBAL_VAR_NAME } from "./global"

;(global => {
  const {nindex, id} = global[MLT_GLOBAL_VAR_NAME]
  Mlt.build(nindex, id)

  window.addEventListener("message", e => {
    if(e.data !== MLT_GLOBAL_VAR_NAME) {
      return
    }

    const {nindex, id} = global[MLT_GLOBAL_VAR_NAME]
    Mlt.build(nindex, id)
  })
})(window)
