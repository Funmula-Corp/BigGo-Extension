import { isFirefox, isSafari } from "../util.shared"
import * as env from "@shared/env"

export const ICON_ROOT_PATH = "/icons/"
export const ICON_GREEN = "ic_B_enabled@2x.png"
export const ICON_YELLOW = "ic_B_disabled@2x.png"
export const ICON_GRAY = "ic_B_nocashback@2x.png"
export const ICON_FLASH_YELLOW = "2021_Extension icon.gif"
export const ICON_YELLOW_RED_BORDER = "ic-b-erro@2x.png"
export const ICON_MURASAKI = "ic-b-p@2x.png"

export function setIcon(img, tabId) {
  const path = `${ICON_ROOT_PATH}${img}`
  return new Promise(resolve => {
    if(isSafari()) {
      resolve()
    }

    // 以防萬一
    setTimeout(resolve, 1000)

    env.browserAction.setIcon({
      tabId, path
    }, resolve)
  })
}

// 閃爍區間時間
const BLINK_TIMEOUT_MS = 200
// maxium time 1.2s
const BLINK_END = 1200
// blink list map
const blinkMap = new Map

export function stopBlink(tabId) {
  const entity = blinkMap.has(tabId) && blinkMap.get(tabId) || false
  if(!entity) {
    return
  }

  clearTimeout(entity)
  blinkMap.delete(tabId)
  setIcon(ICON_YELLOW, tabId)
}

export function startBlink(tabId, frame=1) {
  // overtime
  if(frame * BLINK_TIMEOUT_MS > BLINK_END) {
    stopBlink(tabId)
    return
  }

  setIcon(frame % 2 ? ICON_YELLOW : ICON_YELLOW_RED_BORDER, tabId).then(() => {
    // next loop
    const entity = setTimeout(() => {
      startBlink(tabId, frame + 1)
    }, BLINK_TIMEOUT_MS)
    blinkMap.set(tabId, entity)
  })
}

let blinkListenerLock = false
export function bindBlinkListener() {
  if(blinkListenerLock) {
    return
  }
  // listener is only 1 time to bind
  blinkListenerLock = true

  chrome.tabs.onRemoved.addListener(tabId => {
    stopAnimation(tabId)
    clearFlag(tabId)
  })
  chrome.webNavigation.onBeforeNavigate.addListener(detail => {
    if(detail.parentFrameId !== -1) {
      return
    }

    stopAnimation(detail.tabId)
  })
}

const flashAniObj = {}
export function setAnimationIcon(filename, tabId) {
  return new Promise(resolve => {
    // 30fps 32ms per image
    flashAniObj[tabId] = setTimeout(() => {
      resolve(setIcon(`animation/${filename}.png`, tabId))
    }, 32)
  })
}

const flashFlag = {}
export async function startFlash(tabId) {
  if(flashFlag[tabId]) {
    return
  }

  const LAST_ANIMATION_FRAME = 115
  flashFlag[tabId] = true

  for (let index = 0; index < LAST_ANIMATION_FRAME; index++) {
    if(!flashFlag[tabId]) {
      break
    }

    await setAnimationIcon(`${index}`.padStart(5, 0), tabId)
  }

  flashFlag[tabId] = false
}

export async function stopFlash(tabId) {
  if(!flashFlag[tabId]) {
    return
  }

  flashFlag[tabId] = false
  clearTimeout(flashAniObj[tabId])
  return new Promise(resolve => setTimeout(() => {
    resolve(setIcon(ICON_YELLOW, tabId))
  }, 64))
}

const startAnimationFlag = {}
export function startAnimation(tabId) {
  // 防抖
  if(startAnimationFlag[tabId]) {
    return
  }
  startAnimationFlag[tabId] = true

  if(isFirefox()) {
    startBlink(tabId)
  }else{
    startFlash(tabId)
  }

  setTimeout(() => {
    startAnimationFlag[tabId] = false
  }, 1000)
}

export async function stopAnimation(tabId) {
  if(isFirefox()) {
    stopBlink(tabId)
  }else{
    await stopFlash(tabId)
  }
}

export async function clearFlag(tabId) {
  delete flashAniObj[tabId]
  delete flashFlag[tabId]
  delete startAnimationFlag[tabId]
}

export default {
  setIcon,
  stopBlink,
  startBlink,
  bindBlinkListener,
  startFlash,
  stopFlash,
  startAnimation,
  stopAnimation,
  ICON_GREEN,
  ICON_YELLOW,
  ICON_GRAY,
  ICON_FLASH_YELLOW,
  ICON_YELLOW_RED_BORDER,
  ICON_MURASAKI
}
