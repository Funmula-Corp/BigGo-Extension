import {getFormatTemplateDom, i18n} from "./util"
import {injectPop} from "./shadowDom"

const ELEMENT_ID = "biggo-store-dialog"

export function show() {
  document.getElementById(ELEMENT_ID).style.display = ""
}

export function hide() {
  document.getElementById(ELEMENT_ID).style.display = "none"
}

function isExist() {
  return !!document.getElementById(ELEMENT_ID)
}

export async function build({name, image, descHTML}) {
  if(isExist()) {
    return show()
  }

  const dom = await getFormatTemplateDom("custom_popup/store_dialog.html", {
    close: await i18n("close"),
    cashback_infomation: await i18n("cashback_infomation")
  })
  const domClose = dom.querySelector("#close")
  const domDesc = dom.querySelector("#desc")
  const domImage = dom.querySelector("#store-img")
  const domName = dom.querySelector("#name")

  domClose.addEventListener("click", hide)
  domDesc.innerHTML = descHTML.replace("&nbsp;", "")
  domName.textContent = name
  domImage.src = image

  injectPop(ELEMENT_ID, dom, {
    position: "fixed",
    width: "540px",
    top: "50%",
    left: "50%",
    marginTop: "-333px",
    marginLeft: "-270px",
    padding: "0"
  })
}

export function remove() {
  const dom = document.getElementById(ELEMENT_ID)
  dom && dom.remove()
}

export default {
  build, show, hide, remove
}
