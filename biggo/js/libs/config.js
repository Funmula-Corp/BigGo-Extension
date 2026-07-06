import { post } from "./util"
import { getConfig } from "@shared/config"

export async function syncToServer() {
  const config = await getConfig()
  const url = `https://${process.env.API_DOMAIN}/api/set_config.php`
  return post(url, {
    price_history: config.pageFeature.priceHistory?1:0,
    more_like_this: config.pageFeature.moreLikeThis?1:0,
    promocode: config.pageFeature.couponPopup?1:0,
    region: config.pageFeature.region,
  })
}

export default {
  syncToServer
}
