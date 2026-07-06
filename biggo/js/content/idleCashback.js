import { getRegion } from "@shared/region"
import { getSiteList } from "@shared/sites"
import * as util from "./util"
import * as FrontendSender from "../prototype/Sender/frontend.js"

// mouseomve event action timer
const MOUSE_MOVE_TIMER_MS = 1000 * 60
let mouseLast = 0
// 30min for online timeout
const TIMER_PERIODIC_MS = 1000 * 60 * 30
let nindex = null
let instance = null
let timer = Date.now()

// cache parameter
let region = null
let isCashback = false

let callback = () => {}

/**
 * on pop handle
 * @param {Function} cb
 */
export function onPop(cb) {
  if(typeof(cb) === "function") {
    callback = cb
  }
}

/**
 * 設定idle 提示pop
 * @returns {void}
 */
export function setIdleHint() {
  if(isExcept()) {
    return
  }

  FrontendSender.send("open_idle_cb", {nindex})
}

/**
 * 更新timer
 * @returns {void}
 */
export function updateTimer() {
  if(isExcept()) {
    return
  }

  timer = Date.now()
  markActivity(nindex)
}

function markActivity(_nindex) {
  util.markCashbackActivity(_nindex)
}

export function tick(){
  if(isExcept()) {
    return
  }

  if(instance) {
    //not really need it
    clearTimeout(instance)
  }

  const now = Date.now()
  const diff = now - timer
  if(diff < TIMER_PERIODIC_MS) {
    instance = setTimeout(tick, TIMER_PERIODIC_MS - diff)
    return
  }

  callback()
  setIdleHint()
}

/**
 * 排除不支援的國家
 * @returns {boolean}
 */
export function isExcept() {
  return !isCashback || region !== "tw"
}

/**
 * 初始化
 * @param {string} _nindex
 * @returns {void}
 */
export async function init(_nindex) {
  const sites = await getSiteList()

  if(!sites[_nindex]) {
    return
  }

  region = await getRegion()
  isCashback = sites[_nindex].detail
    && sites[_nindex].detail.desc
  nindex = _nindex
}

let binded = false

/**
 * 開始監聽事件
 * @returns {void}
 */
// 返現啟用後監聽 mousemove/keypress/mousedown，handler 只呼叫 updateTimer() 延續 session 計時；不讀鍵值/座標、不外傳（非 keylogger）
export function listen() {
  if(binded) {
    return
  }

  binded = true
  document.body.addEventListener("mousemove", e => {
    if (Date.now() - mouseLast > MOUSE_MOVE_TIMER_MS) {
      mouseLast = Date.now()
      updateTimer()
    }
  })
  document.body.addEventListener("keypress", updateTimer)
  document.body.addEventListener("mousedown", updateTimer)
}

export default {
  tick,
  init,
  updateTimer,
  listen,
  onPop
}
