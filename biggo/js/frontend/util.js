import * as sender from "../prototype/Sender/content"
import shared from "../util.shared"

export async function getFormatTemplateDom(path, format={}) {
  const html = await getFormatTemplate(path, format)
  return document.createRange().createContextualFragment(html)
}

export async function formatTemplate(template, formatter={}) {
  // format image @IMG_xxx.xxx@
  template = await shared.replaceAsync(template, /\@IMG_([0-9a-zA-Z\-\_\.\/\@]+(jpg|png|bmp))\@/gi, repl => {
    const path = repl.slice(5, -1)
    return sender.post("get_extension_url", {path})
  })

  return Object.keys(formatter).reduce((_template, name) => {
    const value = formatter[name]
    const replName = `%${name}%`

    return _template.replaceAll(replName, value)
  }, template)
}

export async function getFilePath(path) {
  try {
    return await sender.post("get_extension_url", {path})
  }catch(e) {
    return ""
  }
}

export async function getFormatTemplate(filepath, formatter={}) {
  const template = await getTemplate(filepath)
  return formatTemplate(template, formatter)
}

export async function getTemplate(filepath) {
  try {
    const path = `template/${filepath}`
    const fsPath = await getFilePath(path)
    return await fetch(fsPath).then(res => res.text())
  } catch(e) {
    return ""
  }
}

export async function i18n(key, param=[]) {
  return await sender.post("i18n", {key, param})
}

export function biggoR(nindex) {
  sender.send("biggo_r", {nindex})
}

export function ga(label, action, desc) {
  sender.send("ga", {label, action, desc})
}

export function getSiteList() {
  return sender.post("get_sites_list")
}

export function getRegion() {
  return sender.post("get_region")
}