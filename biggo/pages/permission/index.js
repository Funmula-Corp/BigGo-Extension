document.querySelector("#header-name").textContent = chrome.i18n.getMessage("header_name")
document.querySelector(".body").textContent = chrome.i18n.getMessage("permission_desc")
document.querySelector(".btn").textContent = chrome.i18n.getMessage("permission_btn")
document.title = `BigGo ${chrome.i18n.getMessage("header_name")}`

document.querySelector(".btn").addEventListener("click", () => {
  const minimalPermission = {
    origins: [
      "https://extension.biggo.com/*",
      "https://account.biggo.com/*",
      "https://biggo.com.tw/*"
    ],
    permissions: [
      "webNavigation",
      "tabs",
      "cookies",
    ]
  }
  chrome.permissions.request(minimalPermission, () => window.close())
})
