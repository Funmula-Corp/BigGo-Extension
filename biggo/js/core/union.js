export const UNION_LIST = [
  ["tw_pec_taaze", "tw_books_taaze", "tw_bid_taaze_used"],
  ["tw_pec_kingstone", "tw_books_kingstone"],
  ["tw_books_foreignbooks", "tw_pec_books"],
  ["tw_pmall_jollybuy", "tw_bid_jollybuy"],
  ["tw_pec_etmall", "tw_bid_etmall"],
  ["tw_pec_momoshop", "tw_bid_momostoreplus"],

  /** shopee */
  ["tw_bid_shopee", "tw_mall_shopeemall"],
  ["vn_mall_shopeemall" , "vn_bid_shopeevn"],
  ["sg_bid_shopeesg", "sg_mall_shopeemall"],
  ["thai_bid_shopeeth", "thai_mall_shopeemall"],
  ["my_bid_shopeemy", "my_mall_shopeemall"],
  ["id_bid_shopeeid", "id_mall_shopeemall"],
  ["ph_bid_shopeeph", "ph_mall_shopeemall"],
  ["br_bid_shopeebr", "br_mall_shopeemall"],

  /** lazada */
  ["thai_pec_lazada", "thai_mall_lazada"],
  ["ph_mall_lazada", "ph_ec_lazada"],
  ["my_mall_lazada", "my_ec_lazada"],
  ["sg_pec_lazada", "sg_mall_lazada"],
  ["id_pmall_lazada", "id_ec_lazada"],
  ["vn_mall_lazada", "vn_ec_lazada"],
]

export function getUnionMapFromList(union) {
  if (!union) {
    return {}
  }

  return union.reduce((acc, list) => {
    return {
      ...acc,
      ...list.reduce((l, index) => {
        l[index] = list
        return l
      }, {})
    }
  }, {})
}

export const UNION_MAP = getUnionMapFromList(UNION_LIST)
