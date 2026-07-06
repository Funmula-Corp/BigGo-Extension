export const browserAction = process.env.MANIFEST_VERSION === "3" ? chrome.action : chrome.browserAction
export const isContent = !chrome.tabs
export const isBackground = !isContent

export function envCall({content, background}) {
  if(isContent) {
    return content()
  }
  return background()
}