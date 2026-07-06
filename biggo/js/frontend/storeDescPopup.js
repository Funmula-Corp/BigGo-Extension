import {getFormatTemplateDom, i18n} from "./util"
import {injectPop} from "./shadowDom"
import {send} from "../prototype/Sender/content"
import Dialog from "./storeDescDialog"

const ELEMENT_ID = "biggo-store-desc"
const DESTROY_TIME = 10 * 1000 // 10 sec

// 快取用的flag
let setFlag = false

async function setCashbackStatus(dom, isLogin, isCashbackActive, desc) {
  const domCashbackBtn = dom.querySelector("#cashback-btn")
  const adtip = dom.querySelector("#adtip")

  if(isCashbackActive && isLogin) {
    domCashbackBtn.classList.remove("btn-unactive")
    domCashbackBtn.classList.add("btn-active")
    domCashbackBtn.textContent = await i18n("already_active_cashback", [desc])
    adtip.style.display = ""
  } else {
    domCashbackBtn.classList.add("btn-unactive")
    domCashbackBtn.classList.remove("btn-active")
    domCashbackBtn.textContent = await i18n(isLogin ? "active_cashback" : "sign_active_cashback", [desc])
  }
}

export async function build({nindex, isCashbackActive, cashback, isCheckoutDonePage, site, isLogin}) {
  // 快取
  if(setFlag) {
    const el = document.getElementById(ELEMENT_ID)
    await setCashbackStatus(el.shadowRoot, isLogin, isCashbackActive, cashback.rate_desc)
    el.style.display = null
    setTimeout(remove, DESTROY_TIME)
    return
  }
  setFlag = true

  const dom = await getFormatTemplateDom("custom_popup/store_desc.html", {
    cashback_detail: await i18n("cashback_detail"),
    idle_restart: await i18n("idle_restart"),
    adblock_tip: await i18n("adblock_tip")
  })
  const domClose = dom.querySelector("#close")
  const domSetting = dom.querySelector("#setting")
  const domCheckoutDone = dom.querySelector("#checkout-done-tip")
  const domCashbackBtn = dom.querySelector("#cashback-btn")
  const domTitle = dom.querySelector("#title")
  const domGetMore = dom.querySelector("#get-more")

  if(!isCheckoutDonePage) {
    domCheckoutDone.style.display = "none"
  }

  await setCashbackStatus(dom, isLogin, isCashbackActive, cashback.rate_desc)
  domTitle.textContent = site.item.name

  domClose.addEventListener("click", remove)
  domSetting.addEventListener("click", () => {
    send("to_setting_page", "cb_popup")
  })
  domCashbackBtn.addEventListener("click", () => {
    send("biggo_r", {nindex, login: true, lb: "extension_firstopen"})
  })
  domGetMore.addEventListener("click", e => {
    Dialog.build({
      name: site.item.name,
      image: site.detail.image,
      descHTML: site.detail.desc
    })
  })

  const realDom = injectPop(ELEMENT_ID, dom, {
    minWidth: `320px`,
    padding: 0,
    paddingBottom: "12px"
  })

  setTimeout(remove, DESTROY_TIME)
}

export function remove() {
  const dom = document.getElementById(ELEMENT_ID)

  if(dom) {
    dom.style.display = "none"
  }
}

export default {
  build, remove
}
