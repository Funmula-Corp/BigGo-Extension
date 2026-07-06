import * as idleCashback from "../idleCashback"
import { BIGGO_IDLECB_GLOBAL_VAR_NAME } from "./global"

;(global => {
  const { nindex } = global[BIGGO_IDLECB_GLOBAL_VAR_NAME]
  idleCashback.build(nindex)
})(window)