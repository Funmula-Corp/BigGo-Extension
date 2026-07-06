import Receiver from "./prototype/Receiver/frontend"
import * as StoreDescPopup from "./frontend/storeDescPopup"
import * as StoreDescDialog from "./frontend/storeDescDialog"
import * as reportCouponPopup from "./frontend/reportCouponPopup"
import * as FN_KEY from "./frontend/loader/global"
import { getFilePath } from "./frontend/util"

const rev = Receiver.getReceiver(Receiver)

rev.onMessage("is_ready", (_, reply) => {
  reply(true)
})

rev.onMessage("open_store_desc", data => {
  StoreDescPopup.build(data)
})

rev.onMessage("open_store_detail", data => {
  StoreDescDialog.build(data)
})

rev.onMessage("open_report_popup", ({nindex}) => {
  reportCouponPopup.build(nindex)
})

rev.onMessage("open_mlt", async ({nindex, id}) => {
  window[FN_KEY.MLT_GLOBAL_VAR_NAME] = {nindex, id}
  const src = await getFilePath("js/frontend/loader/mlt.rollup.js")

  if(!document.querySelector(`script[src="${src}"]`)) {
    const script = document.createElement("script")
    script.src = src
    document.body.appendChild(script)
  }else{
    postMessage(FN_KEY.MLT_GLOBAL_VAR_NAME, "*")
  }
})

rev.onMessage("open_idle_cb", async ({nindex}) => {
  window[FN_KEY.BIGGO_IDLECB_GLOBAL_VAR_NAME] = {nindex}
  const src = await getFilePath("js/frontend/loader/idleCashback.rollup.js")

  if(!document.querySelector(`script[src="${src}"]`)) {
    const script = document.createElement("script")
    script.src = src
    document.body.appendChild(script)
  }
})

rev.listen()
