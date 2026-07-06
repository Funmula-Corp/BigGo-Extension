export function addExtensionInfo2Url(url) {
  try {
    const urlObj = new URL(url)
    urlObj.searchParams.set("v", chrome.runtime.getManifest().version)
    urlObj.searchParams.set("lang", getSitesLang())
    return urlObj.href
  }catch(e){}

  return url
}

export function getSitesLang() {
  const langList = ["zh_TW", "zh_HK", "en_SG", "th_TH", "ja_JP", "id_ID", "ms_MY", "en_US", "hi_IN", "vi", "vi_VN", "es", "es_419", "pt_BR"]
  const uiLang = chrome.i18n.getUILanguage().replace("-", "_")
  const uiCountry = uiLang.split("_")[0]

  if(langList.includes(uiLang)) {
    return uiLang
  }

  for (const lang of langList) {
    const countryCode = lang.split("_")[0]
    if(uiCountry === countryCode) {
      return lang
    }
  }

  return "en_US"
}

export function i18n(key, param=[]) {
  return chrome.i18n.getMessage(key, param)
}

export function i18nTemplate(template) {
  return template.replace(/__MSG_(\w+)__/g, function(match, v1) {
    return v1 ? i18n(v1) : ""
  })
}

export function getNindexRegion(nindex) {
  if(!(nindex+"").match(/[a-z]{2,5}_[a-z0-9A-Z]+_[a-z0-9A-Z]+/)) {
    return "us"
  }

  return (nindex+"").split("_")[0]
}

export function getQueryVariable(url, variable, decode=false) {
  try {
    const urlObj = new URL(url)
    if(urlObj.searchParams.has(variable)) {
      return urlObj.searchParams.get(variable)
    }
  } catch (error) {}
  return null
}

export async function getTemplate(filepath) {
  try {
    const path = `template/${filepath}`
    const fsPath = chrome.runtime.getURL(path)
    return await fetch(fsPath).then(res => res.text())
  }catch(e) {
    return ""
  }
}

export function getPageImage(filepath) {
  const path = `pages/popmenu/images/${filepath}`
  try {
    return chrome.runtime.getURL(path)
  }catch(e) {
    return path
  }
}

export async function formatTemplate(template, formatter={}) {
  // format image @IMG_xxx.xxx@
  template = (template+"").replaceAll(/\@IMG_([0-9a-zA-Z\-\_\.\/\@]+(jpg|png|bmp))\@/gi, repl => {
    const image = repl.slice(5, -1)
    return chrome.runtime.getURL(image)
  })

  return Object.keys(formatter).reduce((_template, name) => {
    const value = formatter[name]
    const replName = `%${name}%`

    return _template.replaceAll(replName, value)
  }, template)
}

export async function getFormatTemplate(filepath, formatter={}) {
  const template = await getTemplate(filepath)
  return formatTemplate(template, formatter)
}

export function getScriptDom(path) {
  const src = chrome.runtime.getURL(path)
  const dom = document.createElement("script")

  dom.src = src
  dom.async = false

  return dom
}

export function getNindexISO(nindex) {
  return getRegionISO(getNindexRegion(nindex))
}

export function getRegionISO(region) {
  const list = {
    sg: "en-sg",
    tw: "zh-tw",
    th: "th-th",
    thai: "th-th",
    jp: "ja-JP",
    id: "id-id",
    my: "en-my",
    ph: "en-ph",
    hk: "zh-hk"
  }

  if(list[region]) return list[region]
  return "en-US"
}

/**
 * 複製文字
 * @param {String} text
 */
export function copy(text) {
  const input = document.createElement("input")
  document.body.appendChild(input)
  input.value = text
  input.select()
  document.execCommand("copy")
  input.remove()
}

export async function replaceAsync(string, searchValue, replacer) {
  try {
    if (typeof replacer === "function") {
      var values = []
      String.prototype.replace.call(string, searchValue, function () {
        values.push(replacer.apply(undefined, arguments))
        return ""
      })
      return Promise.all(values).then(function (resolvedValues) {
        return String.prototype.replace.call(string, searchValue, function () {
          return resolvedValues.shift()
        })
      })
    } else {
      return Promise.resolve(
        String.prototype.replace.call(string, searchValue, replacer)
      )
    }
  } catch (error) {
    return Promise.reject(error)
  }
}

export function uuid() {
  var d = Date.now()
  if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
    d += performance.now() //use high-precision timer if available
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0
    d = Math.floor(d / 16)
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export function isFirefox() {
  try {
    return chrome.runtime.getURL("").startsWith("moz-extension://")
  }catch(e){}
  return false
}

export function isSafari() {
  return process.env.BROWSER === "safari"
}

export function isUrl(url) {
  try {
    new URL(url)
    return true
  }catch(e){}
  return false
}

export function chunk(arr, chunkSize) {
  const res = []
  for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize)
      res.push(chunk)
  }
  return res
}

export async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

export function getDomFromHTML(html) {
  return document.createRange().createContextualFragment(html)
}

export function arrayBufferToBase64(arrayBuffer) {
  var binary = ""
  var bytes = new Uint8Array(arrayBuffer)
  var len = bytes.byteLength
  for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
  }

  return btoa(binary)
}

export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (var i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
  }
  
  return bytes.buffer
}

export function isImageSearchSupportFormat(buffer) {
  const bytes = new Uint8Array(buffer)

  // Check for PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
      bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
    return true
  }

  // Check for JPEG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[bytes.length - 2] === 0xFF && bytes[bytes.length - 1] === 0xD9) {
    return true
  }

  // Check for WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return true
  }

  return false
}

export default {
  addExtensionInfo2Url,
  getQueryVariable,
  getNindexRegion,
  i18n,
  i18nTemplate,
  getSitesLang,
  getTemplate,
  formatTemplate,
  getFormatTemplate,
  getScriptDom,
  getNindexISO,
  getRegionISO,
  copy,
  replaceAsync,
  uuid,
  isFirefox,
  isUrl,
  chunk,
  sleep
}
