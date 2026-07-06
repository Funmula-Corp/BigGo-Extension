import {i18n} from "../util.shared"

function buildDialog(ID) {
  const dialog = document.createElement("div")
  dialog.style.padding = "35px 30px 25px"
  dialog.style.borderRadius = "10px"
  dialog.style.boxShadow = "0 6px 28px 0 rgba(0, 41, 83, 0.25)"
  dialog.style.backgroundColor = "#fff"
  dialog.style.position = "fixed"
  dialog.style.width = "540px"
  dialog.style.top = "50%"
  dialog.style.left = "50%"
  dialog.style.marginTop = "-180px"
  dialog.style.marginLeft = "-270px"
  dialog.style.display = "flex"
  dialog.style.flexDirection = "column"
  dialog.style.alignItems = "center"
  dialog.style.justifyContent = "center"
  dialog.style.zIndex = 9999999999999999999
  dialog.id = ID

  return dialog
}

function buildImage() {
  const img = document.createElement("img")
  img.src = chrome.runtime.getURL("/pages/popmenu/images/img-notify-close@2x.png")
  img.style.height = "115px"
  img.style.width = "200px"

  return img
}

function buildTitle(titleContent) {
  const title = document.createElement("div")
  title.textContent = titleContent
  title.style.fontSize = "18px !important"
  title.style.color = "#000"
  title.style.fontWeight = "bold"
  title.style.marginTop = "20px"

  return title
}

function buildDesc(descContent) {
  const desc = document.createElement("div")
  desc.textContent = descContent
  desc.style.fontSize = "15px"
  desc.style.color = "#667680"
  desc.style.marginTop = "10px"

  return desc
}

function buildButton(onSubmit=()=>{}, ID) {
  const wrap = document.createElement("div")
  wrap.style.width = "100%"
  wrap.style.display = "flex"
  wrap.style.justifyContent = "flex-end"
  wrap.style.alignContent = "center"
  wrap.style.marginTop = "44px"

  const cancel = document.createElement("div")
  cancel.textContent = i18n("cancel")
  cancel.style.padding = "10px 45px"
  cancel.style.borderRadius = "10px"
  cancel.style.boxShadow = "0 4px 7px 0 rgba(0, 41, 83, 0.16)"
  cancel.style.backgroundColor = "#fff"
  cancel.style.fontSize = "16px !important"
  cancel.style.color = "#24343f"
  cancel.style.marginRight = "15px"
  cancel.style.cursor = "pointer"
  cancel.addEventListener("click", destroy.bind(null, ID))
  cancel.addEventListener("mouseenter", () => {
    cancel.style.backgroundColor = "#eceff4"
    cancel.style.boxShadow = "none"
  })
  cancel.addEventListener("mouseleave", () => {
    cancel.style.backgroundColor = "#fff"
    cancel.style.boxShadow = "0 4px 7px 0 rgba(0, 41, 83, 0.16)"
  })

  const submit = document.createElement("div")
  submit.textContent = i18n("confirm")
  submit.style.padding = "10px 45px"
  submit.style.borderRadius = "10px"
  submit.style.boxShadow = "0 3px 6px 0 rgba(0, 196, 196, 0.5)"
  submit.style.backgroundColor = "#02c3c3"
  submit.style.fontSize = "16px !important"
  submit.style.color = "#fff"
  submit.style.marginRight = "15px"
  submit.style.cursor = "pointer"
  submit.addEventListener("click", () => {
    onSubmit()
    destroy(ID)
  })

  wrap.appendChild(cancel)
  wrap.appendChild(submit)
  return wrap
}

export function destroy(ID) {
  const dom = document.getElementById(ID)
  if(dom) {
    dom.remove()
  }
}

export function build(ID, titleContent, descContent, {onSubmit=()=>{}}) {
  const dom = document.getElementById(ID)
  if(dom) {
    return
  }

  const dialog = buildDialog(ID)
  const image = buildImage()
  const title = buildTitle(titleContent)
  const desc = buildDesc(descContent)
  const btn = buildButton(onSubmit, ID)

  dialog.appendChild(image)
  dialog.appendChild(title)
  dialog.appendChild(desc)
  dialog.appendChild(btn)

  document.body.appendChild(dialog)
}

export default build
