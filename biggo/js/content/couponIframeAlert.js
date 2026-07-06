import {i18n} from "../util.shared"
import * as Alert from "./IframeAlert"

const ID = "_biggo_close_coupon_alert"

export function destroy() {
  Alert.destroy(ID)
}

export function build({onSubmit=()=>{}}) {
  Alert.build(ID, i18n("coupon_popup_alert_desc"), i18n("close_price_history_desc"), {onSubmit})
}

export default build
