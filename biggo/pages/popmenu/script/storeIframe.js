import { isNindexCashback, updateSameNindexUrl } from "@/content/util"
import constant from "@/content/constant"
import { openPopupCashbackFold, closePopupCashbackFold, isPopupCashbackFold } from "@shared/status"
import { showDom, getParameter, localizeHtmlPage } from "./util/util"
import { LoginButton, SimpleIframe } from "./util/classes"
import { getSiteList } from "@core/shared/sites"
import { isLogin } from "@core/shared/user"
import { isActivity } from "@core/shared/cashback"

function expendUp() {
  const classList = document.getElementById("expend").classList
  classList.remove("expend-down")
  classList.add("expend-up")
}

function expendDown() {
  const classList = document.getElementById("expend").classList
  classList.remove("expend-up")
  classList.add("expend-down")
}

function expendToggle() {
  const classList = document.getElementById("expend").classList
  if(classList.contains("expend-up")) {
    expendDown()
  }else{
    expendUp()
  }
}

class StoreIframe extends SimpleIframe {
  constructor() {
    super(constant.STORE_IFRAME_ID, {
      content: document.getElementById("content"),
      head: document.getElementById("head"),
      close: document.getElementById("close")
    })
  }

  openContent() {
    super.openContent()
    openPopupCashbackFold()
  }

  closeContent() {
    super.closeContent()
    closePopupCashbackFold()
  }

  async init() {
    super.init()

    const isFold = isPopupCashbackFold()
    const {nindex, purl, buied} = getParameter()
    const sites = await getSiteList()
    const site = sites[nindex]

    if(!site) {
      return this.destroy()
    }

    if(buied) {
      showDom(document.getElementById("buied-hint"))
    }

    const isCashback = await isNindexCashback(nindex)
    const isActCashback = await isActivity(nindex)
    const _isLogin = await isLogin()

    const domFoldToggle = document.getElementById("fold-toggle")
    const activityBtn = document.getElementById("act-btn")

    // push cashback detail
    if(site.detail && site.detail.desc) {
      this.content.innerHTML = site.detail.desc
    }

    // handle button status
    const loginBtn = new LoginButton(activityBtn)
    if(isCashback) {
      activityBtn.classList.remove("d-none")

      if(isActCashback && _isLogin) {
        loginBtn.enableCashback()
      }else if(!_isLogin) {
        loginBtn.unLoginEnableCashback()
      }else if(!isActCashback) {
        loginBtn.reEnableCashback()
      }

      activityBtn.addEventListener("click", e => {
        util.updateSameNindexUrl(nindex)
      })
    }

    if(!isFold) {
      expendDown()
      this.closeContent()
    }else{
      this.iframeFitContent()
    }

    domFoldToggle.addEventListener("click", e => {
      expendToggle()
      this.toggleContent()
    })
    this.destroyCountdown()
  }
}

window.addEventListener("load", async (e) => {
  localizeHtmlPage()
  ;(new StoreIframe).init()
})
