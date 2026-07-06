import { send } from "./util.js"
import constant from "@/content/constant.js"
import { setHistoryFold, HISTORY_FOLD_OPEN, MLT_FOLD_CLOSE } from "@shared/status"
import ga from "@shared/ga"
import { i18n } from "@/util.shared.js"

export function sendHistoryOpen() {
  setHistoryFold(HISTORY_FOLD_OPEN)
  send(constant.IFM_HIS_OPEN_FOLD)
}

export function sendHistoryClose() {
  setHistoryFold(MLT_FOLD_CLOSE)
  send(constant.IFM_HIS_CLOSE_FOLD)
}

export async function setHintMax() {
  document.getElementById("hint-pop").textContent = i18n("maximize")
}

export async function setHintMin() {
  document.getElementById("hint-pop").textContent = i18n("minimize")
}

export function closePop() {
  BigGo.send("destroy", {id: "_biggo_history_ifm"});
}

export function openHistory() {
  document.querySelector("#expend-btn img").src = "./images/btn-scale-down@2x.png"
  document.getElementById("ifm").style.visibility = "visible"
  document.getElementById("price-mini-show").style.display = 'none'
  sendHistoryOpen()
  setHintMin()

  ga('extension-pricehistory', 'click', 'open')
}

export function closeHistory() {
  document.querySelector("#expend-btn img").src = "./images/btn-scale-up@2x.png"
  document.getElementById("ifm").style.visibility = "hidden"
  sendHistoryClose()
  setHintMax()

  const miniShowHistory = document.getElementById("price-mini-show")
  if(miniShowHistory.dataset && miniShowHistory.dataset.loaded) {
    miniShowHistory.style.display = "inline-flex"
  }

  ga('extension-pricehistory', 'click', 'close')
}

export function showFull() {
  send(constant.IFM_HIS_OPEN_FULL)
}

export function showMain() {
  send(constant.IFM_HIS_SHOW_PRICE_HISTORY)
}

export function destoryMain() {
  send(constant.IFM_HIS_HIDE_PRICE_HISTORY)
}

export function showPopHead() {
  document.getElementById("head_wrap").style.display = ""
}