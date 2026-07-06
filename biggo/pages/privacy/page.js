function i18n(key, param=[]) {
  return chrome.i18n.getMessage(key, param)
}

function i18nTemplate(template) {
  return template.replace(/__MSG_(\w+)__/g, function(match, v1) {
    return v1 ? i18n(v1) : ""
  })
}

function localizeHtmlPage() {
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

function onHoverSubmit() {
  document.querySelectorAll(`input[type="checkbox"]:not(:checked) + span .require-hover`).forEach(dom => {
    dom.classList.remove("invisible")
  })
}

function openPopup() {
  domPopup.classList.add("d-flex")
}

function getCheckboxList() {
  return Array.from(document.querySelectorAll(`input[type="checkbox"][data-require]`))
}

function getAllCheckboxList() {
  return Array.from(document.querySelectorAll(`input[type="checkbox"]`))
}

function isCheck() {
  return getCheckboxList().some(dom => dom.checked)
}

function isAllCheck() {
  return getCheckboxList().every(dom => dom.checked)
}

function isAllNoCheck() {
  return getCheckboxList().every(dom => !dom.checked)
}

function getPermission() {
  return getAllCheckboxList().reduce((obj, dom) => {
    const permission = dom.dataset.permission
    obj[permission] = dom.checked
    return obj
  }, {})
}

function onSubmit() {
  if(!isAllCheck()) {
    return openPopup()
  }

  chrome.storage.local.set({
    permission: getPermission()
  }, () => goToInstalled("?is_install=true"))
}

function goToInstalled(urlparam="") {
  window.location.href = "https://extension.biggo.com/welcome.php" + urlparam
}

localizeHtmlPage()
document.querySelectorAll(".hint").forEach(dom => {
  dom.innerHTML = i18n("privacy_learn_about_more", [`
    <a href="http://biggo.tw/privacy" target="_blank" style="color: #004aaf">
      ${i18n("privacy_learn_about_link")}
    </a>
  `])
})

const domSubmit = document.getElementById("submit")
const domPopup = document.getElementById("popup")
const domUninstall = document.getElementById("uninstall")
const domAllCheck = document.getElementById("allcheck")
const domCheck3 = document.getElementById("check3")

domSubmit.addEventListener("mouseenter", onHoverSubmit)
domSubmit.addEventListener("click", onSubmit)

domUninstall.addEventListener("click", e => {
  domPopup.classList.remove("d-flex")
  chrome.runtime.setUninstallURL("", () => {
    browser.management.uninstallSelf()
  })
  setTimeout(goToInstalled, 300)
})

domAllCheck.addEventListener("click", () => {
  chrome.storage.local.set({permission: getPermission()})
  setTimeout(goToInstalled, 300)
})

getCheckboxList().forEach(dom => {
  dom.addEventListener("change", () => {
    if(dom.checked) {
      dom.parentNode.querySelector("b").classList.add("invisible")
    }
  })
})