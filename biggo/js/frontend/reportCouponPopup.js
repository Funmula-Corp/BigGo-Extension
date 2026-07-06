import {getFormatTemplateDom, i18n} from "./util"
import {injectPop} from "./shadowDom"
import {post} from "../prototype/Sender/content"

const ELEMENT_ID = "biggo-coupon-report"

const translateList = [
  "share_coupon_submit", "share_coupon_title", "share_coupon_desc",
  "share_coupon_cancel", "share_coupon_send", "share_coupon_tks",
  "share_coupon_code", "share_coupon_done", "share_coupon_submit_other",
  "discount_code"
]

async function getTranslateObj() {
  let tmp = {}
  for (const key of translateList) {
    tmp[key] = await i18n(key)
  }

  return tmp
}

/**
 * 送出coupon資料
 * @async
 * @param {string} coupon
 * @param {string} desc
 * @param {string} nindex
 */
async function sendCoupon(coupon, desc, nindex="") {
  return await post("share_coupon", {code: coupon, desc, nindex})
}

export async function contentFactory(nindex) {
  const dom = await getFormatTemplateDom("custom_popup/report_coupon.html", await getTranslateObj())
  const frameSend = dom.getElementById("send-form")
  const frameSended = dom.getElementById("sended")
  const close = dom.getElementById("close")
  const inputCoupon = dom.getElementById("coupon")
  const inputDesc = dom.getElementById("desc")
  const btnCancel = dom.getElementById("cancel")
  const btnSubmit = dom.getElementById("submit")
  const sendedClose = dom.getElementById("sended-close")
  const otherCoupon = dom.getElementById("other-coupon")

  function enableSubmit() {
    btnSubmit.classList.add("btn-main")
    btnSubmit.classList.remove("btn-unverify")
  }

  function switchFrame() {
    frameSend.classList.toggle("d-none")
    frameSended.classList.toggle("d-none")
  }

  function disableSubmit() {
    btnSubmit.classList.add("btn-unverify")
    btnSubmit.classList.remove("btn-main")
  }

  function bindEvent() {
    btnSubmit.addEventListener("click", async (e) => {
      if(!inputCoupon.value || !inputDesc.value) {
        return
      }

      await sendCoupon(inputCoupon.value, inputDesc.value, nindex)
      init()
      switchFrame()
    })

    let inputCahngeFlag = null
    const inputChange = e => {
      if(inputCahngeFlag) {
        clearTimeout(inputCahngeFlag)
      }

      inputCahngeFlag = setTimeout(() => {
        inputCoupon.value && inputDesc.value ? enableSubmit() : disableSubmit()
      }, 300)
    }
    inputCoupon.addEventListener("input", inputChange)
    inputDesc.addEventListener("input", inputChange)

    otherCoupon.addEventListener("click", e => {
      init()
      switchFrame()
    })

    sendedClose.addEventListener("click", remove)
    close.addEventListener("click", remove)
    btnCancel.addEventListener("click", remove)
  }

  function init() {
    inputCoupon.value = ""
    inputDesc.value = ""
  }

  bindEvent()
  return dom
}

export async function buildExist(nindex) {
  const dom = document.getElementById(ELEMENT_ID)
  const shadowDom = dom.shadowRoot
  const root = shadowDom.getElementById("root")
  root.innerHTML = ""
  root.appendChild(await contentFactory(nindex))

  dom.style.display = ""
}

export async function init(nindex) {
  const dom = await contentFactory(nindex)
  injectPop(ELEMENT_ID, dom, {
    width: "320px"
  }, ["style/reportCoupon.css"])
}

export async function build(nindex) {
  if(document.getElementById(ELEMENT_ID)) {
    return buildExist(nindex)
  }

  init(nindex)
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
