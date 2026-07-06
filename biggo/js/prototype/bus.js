const CONTENT_DOM_ID = "___biggo___c_dom"
const FRONTEND_DOM_ID = "___biggo___f_dom"

function createDom(id) {
  const dom = document.createElement("div")
  dom.id = id
  dom.style.display = "none"

  document.body.append(dom)
}

export function installFrontendBus() {
  if(document.getElementById(CONTENT_DOM_ID)) {
    return
  }

  createDom(CONTENT_DOM_ID)

  if(document.getElementById(FRONTEND_DOM_ID)) {
    return
  }

  createDom(FRONTEND_DOM_ID)
}

export function getContentBus() {
  return document.getElementById(CONTENT_DOM_ID)
}

export function getFrontendBus() {
  return document.getElementById(FRONTEND_DOM_ID)
}