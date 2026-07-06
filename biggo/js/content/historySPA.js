import constant from "./constant"

export const list = [
  "tw_mall_shopeemall",
  "tw_bid_shopee",
  "sg_bid_shopeesg",
  "thai_bid_shopeeth",
  "my_bid_shopeemy",
  "id_bid_shopeeid",
  "ph_bid_shopeeph",
  "vn_bid_shopeevn",
  "mx_bid_shopeemx",
  "in_bid_shopeein",
  "br_bid_shopeebr",
  "vn_mall_shopeemall",
  "sg_mall_shopeemall",
  "my_mall_shopeemall",
  "ph_mall_shopeemall",
  "id_mall_shopeemall",
  "thai_mall_shopeemall",
  "br_mall_shopeemall",
  "thai_pec_watsons",
  "id_ec_watsons",
  "sg_ec_watsons",
  "my_ec_watsons",
  "ph_ec_watsons",
  "tw_ec_watsons",
  "hk_ec_watsons",
  "vn_ec_watsons",
  "tw_pec_dokodemo",
  "my_ec_dokodemo",
  "sg_ec_dokodemo",
  "hk_ec_dokodemo",
  "thai_ec_dokodemo",
  "mx_ec_liverpool"
]

/**
 * 設定spa的路由監聽器
 */
export function set() {
  const scriptTag = document.createElement("script")
  scriptTag.src = chrome.runtime.getURL("/js/injection/SPA.rollup.js")
  ;(document.head||document.documentElement).appendChild(scriptTag)
  scriptTag.remove()
}

/**
 * 監聽前端的SPA history change事件
 * @param {Function} cb
 */
export function listen(cb) {
  let lock = false

  window.addEventListener("message", e => {
    if(!e.data) {
      return
    }

    if(typeof(e.data) === "string" && e.data === constant.HISTORY_CHANGE_EVENT) {
      if(lock) {
        return
      }

      lock = true
      setTimeout(() => {
        cb()
        lock = false
      }, 200)
    }
  })
}
