import ga from "./ga"
import * as Region from "@shared/region"
import { i18n } from "../util.shared"
import { getConfig } from "@core/shared/config"

const imageFilename = "image"

/**
 * @param {string} base64
 * @returns {File}
 */
function base64ToFile(base64) {
  const base64Data = base64.split(",")[1]
  const mime = base64.slice(base64.indexOf("image/"), base64.indexOf(";"))

  const binaryString = globalThis.atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const blob = new Blob([bytes], { type: mime })
  return new File([blob], imageFilename, { type: mime, lastModified: Date.now() })
}

/**
 * @param {string} url
 * @returns {Promise<File>}
 */
function getFileFromUrl(url) {
  return fetch(url)
    .then(res => res.blob())
    .then(imageBlob => new File([imageBlob], imageFilename, { type: imageBlob.type }))
}

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
function uploadImage(file) {
  const form = new FormData()
  form.append("method", "upload_image")
  form.append("image", file)

  return fetch("https://biggo.com.tw/api/imagesearch.php", { method: "POST", body: form })
    .then(res => res.json())
    .then(res => res.key)
    .catch(console.error)
}

/**
 * @param {chrome.contextMenus.OnClickData} info
 * @param {chrome.tabs.Tab} tab
 * @param {string} domain
 */
async function onSelection (info, tab, domain) {
  const searchQuery = info.selectionText ? encodeURIComponent(info.selectionText) : ""
  const url = `https://${domain}/s/?q=${searchQuery}`
  chrome.tabs.create({ url, active: true })
  ga("google_search_for", "desc", "")
}

/**
 * @param {chrome.contextMenus.OnClickData} info
 * @param {chrome.tabs.Tab} tab
 * @param {string} domain
 */
async function onImageSearch (info, tab, domain) {
  const { srcUrl } = info
  if(!srcUrl.startsWith("http") && !srcUrl.startsWith("data:image")) {
    return
  }

  const isHttpUrl = srcUrl.startsWith("http")
  const file = isHttpUrl ? await getFileFromUrl(srcUrl) : base64ToFile(srcUrl)
  const imageId = await uploadImage(file)

  if(!imageId) {
    return
  }

  const url = `https://${domain}/imgsearch/${imageId}`
  chrome.tabs.create({ url, active: true })

  ga("image_search", "context_menu", isHttpUrl ? "url" : "base64")
}

/**
 * @param {chrome.contextMenus.OnClickData} info
 * @param {chrome.tabs.Tab} tab
 */
async function onClicked (info, tab) {
  const domain = await Region.getCurrentRegionDomain()
  const handle = info.selectionText ? onSelection : onImageSearch
  handle(info, tab, domain).catch(console.error)
}

export async function installContextMenu() {
  const region = await Region.getRegion()
  const isSupport = Region.isSupportSearchRegion(region)

  if(!isSupport) {
    return
  }

  const config = await getConfig()

  const createContextMenus = () => {
    chrome.contextMenus.create({
      id: "biggosearch",
      title: i18n("@SEARCH_WITH_BIGGO"),
      contexts: ["selection"]
    })

    if(Region.isSupportImageSearch(region) && config.pageFeature.imageSearchContext) {
      chrome.contextMenus.create({
        id: "biggoimagesearch",
        title: i18n("@IMAGE_SEARCH_WITH_BIGGO"),
        contexts: ["image"]
      })
    }
  }

  chrome.contextMenus.removeAll(createContextMenus)
  chrome.contextMenus.onClicked.removeListener(onClicked)
  chrome.contextMenus.onClicked.addListener(onClicked)
}
