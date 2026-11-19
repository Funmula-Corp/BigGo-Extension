import storage from "@shared/storage"
import { getItemKey, isActivity } from "@shared/cashback"

const ITEM_KEY_LIST_STORAGE_KEY = "cb-keylist"
let activeList = []

export async function updateCashbackActivity(nindex, tabid) {
  if(nindex === "tw_bid_shopee") {
    nindex = "tw_mall_shopeemall"
  }

  const itemKey = getItemKey(nindex, tabid)
  storage.setItem(itemKey, Date.now())
  activeList.push(itemKey)
  storage.setItem(ITEM_KEY_LIST_STORAGE_KEY, activeList)
}

export async function cancelCashback(nindex, tabid) {
  if(nindex === "tw_bid_shopee") {
    nindex = "tw_mall_shopeemall"
  }

  storage.removeItem(getItemKey(nindex, tabid))
}

export async function clear() {
  if(!activeList.length) {
    activeList = await storage.getItem(ITEM_KEY_LIST_STORAGE_KEY) || []
  }

  if(activeList.length) {
    storage.removeItem(activeList)
  }
  activeList = []
}

export default {
  isActivity,
  updateCashbackActivity,
  cancelCashback,
  clear,
}
