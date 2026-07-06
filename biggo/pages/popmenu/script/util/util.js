import * as util from "@/content/util.js"
import { i18nTemplate } from "@/util.shared"

export function isIframe () {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
}

export function isPopup(){
  try {
    return "chrome-extension:" === window.location.protocol || "moz-extension:" === window.location.protocol
  } catch(e) {
    return false
  }
}

export function send(key, msg="") {
  let root = window
  if(parent) {
    root = parent
  }

  root.postMessage({
    type: key,
    data: msg
  }, "*")
}

export function getParameter(hash=window.location.hash){
  return hash.replace(/^#/,'').split("&").map(query => {
      return query.split("=")
  }).reduce((last, item) => {
      last[item[0]] = item[1]
      return last
  }, {})
}

export function toggleDom(dom) {
  const isHide = dom.style.display === "none"
  dom.style.display = isHide ? "" : "none"
}

export function hideDom(dom) {
  if(dom) {
    dom.style.display = "none"
  }
}

export function showDom(dom, display="") {
  if(dom) {
    dom.style.display = display
    dom.classList.remove("d-none")
  }
}

export function localizeHtmlPage() {
  //Localize by replacing __MSG_***__ meta tags
  var objects = document.getElementsByTagName('html')
  for (var j=0; j < objects.length; j++) {
    var obj = objects[j]

    var valStrH = obj.innerHTML.toString()
    var valNewH = i18nTemplate(valStrH)

    if(valNewH != valStrH) {
      obj.innerHTML = valNewH
    }
  }
}

// TODO 必須整合到messager
export function postCode(code, title, content) {
  const payload = {code, title, content}

  try {
    sendTabMsg("coupon_code", payload)
  } catch (error) {
    parent.postMessage({type: "_biggo_open_coupon", data: payload}, "*")
  }
}

export function sendTabMsg(type, data) {
  chrome.tabs.query({currentWindow: true, active: true}, tabs => {
    const activeTab = tabs[0]
    chrome.tabs.sendMessage(activeTab.id, {type, data})
  })
}

export function getTab(){
  return new Promise((resolve, reject)=>{
      chrome.tabs.getCurrent(resolve);
  });
}

export function execScript(tabid, code) {
  if(tabId) {
    chrome.tabs.executeScript(Number(tabId), {
      code: code
    }, () => {})
  }
}
