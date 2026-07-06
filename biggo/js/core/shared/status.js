import storage from "./storage"

export async function getPoppedList() {
  const trans = await storage.getItem("popuped", {})
  return purePoppedExpire(trans) || {}
}

export function purePoppedExpire(list) {
  // 5 min
  const EXPIRE_TIME = 1000 * 60 * 5
  const now = Date.now()
  let tmp = {}

  for (const nindex in list) {
    if(now - list[nindex].expire < EXPIRE_TIME) {
      tmp[nindex] = list[nindex]
    }
  }

  return tmp
}

export async function isPopped(nindex) {
  const list = await getPoppedList()
  return !!list[nindex]
}

export async function setPopped(nindex) {
  const list = await getPoppedList()
  list[nindex] = {
    nindex,
    expire: Date.now()
  }

  storage.setItem("popuped", list)
}

export async function clearPopped(nindex) {
  const list = await getPoppedList()

  if(list[nindex]) {
    delete list[nindex]
  }

  storage.setItem("popuped", list)
}

/* ----------------------------------------------------------------- */

export const MLT_FOLD_OPEN = "open"
export const MLT_FOLD_CLOSE = "close"
const MLT_FOLD_STORAGE_KEY = "mlt_iframe_fold"

export function setMLTFold(status) {
  storage.setItem(MLT_FOLD_STORAGE_KEY, status)
}

export function closeMLTFold() {
  setMLTFold(MLT_FOLD_CLOSE)
}

export function openMLTFold() {
  setMLTFold(MLT_FOLD_OPEN)
}

export async function getMLTFold() {
  return await storage.getItem(MLT_FOLD_STORAGE_KEY, MLT_FOLD_CLOSE)
}

/* ----------------------------------------------------------------- */

export const HISTORY_FOLD_OPEN = "open"
export const HISTORY_FOLD_CLOSE = "close"
export const HISTORY_FOLD_STORAGE_KEY = "history_iframe_fold"

export function setHistoryFold(status) {
  storage.setItem(HISTORY_FOLD_STORAGE_KEY, status)
}

export function closeHistoryFold() {
  setHistoryFold(HISTORY_FOLD_CLOSE)
}

export function openHistoryFold() {
  setHistoryFold(HISTORY_FOLD_OPEN)
}

export async function getHistoryFold() {
  return await storage.getItem(HISTORY_FOLD_STORAGE_KEY, HISTORY_FOLD_OPEN)
}

/* ----------------------------------------------------------------- */

const POPUP_CB_FOLD_OPEN = "open"
const POPUP_CB_FOLD_CLOSE = "close"
const POPUP_CB_FOLD_STORAGE_KEY = "popup_cb_iframe_fold"

export async function getPopupCashbackFold() {
  return await storage.getItem(POPUP_CB_FOLD_STORAGE_KEY, POPUP_CB_FOLD_OPEN)
}

export function isPopupCashbackFold() {
  return getPopupCashbackFold() === POPUP_CB_FOLD_CLOSE
}

export function setPopupCashbackFold(status) {
  storage.setItem(POPUP_CB_FOLD_STORAGE_KEY, status)
}

export function openPopupCashbackFold() {
  setPopupCashbackFold(POPUP_CB_FOLD_CLOSE)
}

export function closePopupCashbackFold() {
  setPopupCashbackFold(POPUP_CB_FOLD_OPEN)
}

/* ----------------------------------------------------------------- */

const POPUP_DOC_SHOW_STORAGE_KEY = "popup_doc_show"
const POPUP_DOC_SHOW_LIMIT = 5

export async function getCountPopupDocShow() {
  return +(await storage.getItem(POPUP_DOC_SHOW_STORAGE_KEY, 0))
}

export function setCountPopupDocShow(v) {
  storage.setItem(POPUP_DOC_SHOW_STORAGE_KEY, +v)
}

export function increasePopupDocShow(count=1) {
  setCountPopupDocShow(getCountPopupDocShow() + count)
}

export function isOverShowPopupDoc() {
  return getCountPopupDocShow() > POPUP_DOC_SHOW_LIMIT
}

/* ----------------------------------------------------------------- */

const DRAG_PRICEHISTORY_DEF_DAYS_STORAGE_KEY = "drag_pricehistory_def_days"

export async function getDragPricehistoryDays() {
  return +(await storage.getItem(DRAG_PRICEHISTORY_DEF_DAYS_STORAGE_KEY, 90))
}

export function setDragPricehistoryDays(days) {
  storage.setItem(DRAG_PRICEHISTORY_DEF_DAYS_STORAGE_KEY, +days)
}

/* ----------------------------------------------------------------- */

const REVIEW_SHOW_STORAGE_KEY = "review_show"

export function setReviewed() {
  storage.setItem(REVIEW_SHOW_STORAGE_KEY, 1)
}

export async function isReviewed() {
  return !!(await storage.getItem(REVIEW_SHOW_STORAGE_KEY))
}