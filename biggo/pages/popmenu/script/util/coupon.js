import { i18n } from "@/util.shared"
import { postCode } from "./util"

function getCouponCodeItem({discount, discount_text, title, content, code}) {
  // gen random string
  const key = Math.random().toString(36).substring(2, 15)
  return `<div>
    <div class='block-cp'>
      <div class='discount-cp'>
        <div class='discount-number-cp'>${discount}</div>
        <div class='discount-sub-cp'>${discount_text}</div>
      </div>
      <div style='display: block;width:100%;'>
        <div class='title-cp'>${title}</div>
        <div class='conten-cp'>${content}</div>
        <div class='code-cp' id='code[${key}]' data-clipboard-text='${code}' data-title='${title}' data-subtitle='${content}'>
          <div class='code-button-cp'>
            <div>${i18n("Copy")}</div>
            <div>${i18n("discount_code_full")}</div>
          </div>
          <div class='code-block-cp'>
            <input class='code-text-cp' type="text" readonly="" value="${code}">
          </div>
        </div>
      </div>
    </div>
  </div>`
}

function getCouponCampaignItem({discount, discount_text, title, content, isStart, affurl}) {
  const leftDesc = discount || discount_text
    ? `<div class='discount-number-cp'>${discount}</div>
      <div class='discount-sub-cp'>${discount_text}</div>`
    : `<img src="https://biggo.com.tw/images/ic_event_default@2x.png" alt="coupon" height="63">`

  const couponDescStyle = isStart ? "" :"background-color: #e0e2e5; border: solid 2px #e0e2e5;"
  const mainDesc =
    `<a href='${isStart ? affurl : "#"}' class='event-cp' target="_blank">
        <div class='event-btn-cp' style="${couponDescStyle}">
          ${isStart ? i18n("LEARN_MORE") : i18n("COMMING_SOON_2")}
        </div>
    </a>`

  return `<div>
    <div class='block-cp'>
      <div class='discount-cp'>
        ${isStart ? `<div class='coupon-tag'>${i18n("COMMING_SOON")}</div>`:""}
        ${leftDesc}
      </div>
      <div style='display: block;;width:100%;'>
        <div class='title-cp'>${title}</div>
        <div class='conten-cp'>${content}</div>
        ${mainDesc}
      </div>
    </div>
  </div>`;
}

export function listen() {
  document.querySelectorAll(".code-cp[data-clipboard-text]").forEach(dom => {
    const code = dom.dataset.clipboardText || ""
    const title = dom.dataset.title || ""
    const content = dom.dataset.subtitle || ""

    dom.addEventListener('click', e => {
      postCode(code, title, content)
    })
  })
}

export function buildHTML(couponList, sitename) {
  if(couponList.length) {
    return couponList.reduce((html, coupon) => {
      html += (() => {
        return coupon.hasOwnProperty("code")
          ? getCouponCodeItem(coupon)
          : getCouponCampaignItem(coupon)
      })()

      return html
    }, "")
  }

  return `<div>
    <div style='display: flex; justify-content: center; padding-top: 62px;'>
        <img src='./images/img_no_coupon@3x.png' alt='No item.' style='max-height: 90px; margin-bottom: 16px;'>
    </div>
    <div style='display: flex; justify-content: center;'>
        <span style='font-family: NotoSansCJKtc; font-size: 16px; line-height: 1.44; color: #616c74;'>${sitename} ${i18n("NO_COUPON")}</span>
    </div>
  </div>`
}

export default {
  buildHTML,
  listen
}
