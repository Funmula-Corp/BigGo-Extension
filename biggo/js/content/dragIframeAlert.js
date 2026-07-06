import {i18n} from "../util.shared"
import * as Alert from "./IframeAlert"

const ID = "_biggo_close_price_history_alert"

export function destroy() {
  Alert.destroy(ID)
}

export function build({onSubmit=()=>{}}={}) {
  Alert.build(ID, i18n("close_price_history_tip"), i18n("close_price_history_desc"), {onSubmit})
}

export default build
