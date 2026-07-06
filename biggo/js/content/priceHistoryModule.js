import { getPageImage } from "../util.shared"
import { getFilePath } from "../frontend/util"

export const GREEN = "#28a745"
export const RED = "#e64059"

export const GREEN_UP_IMG = getPageImage("history/btn_diff_price_up@2x.png")
export const GREEN_DOWN_IMG = getPageImage("history/btn_diff_price_down-green@2x.png")
export const RED_UP_IMG = getPageImage("history/btn_diff_price_up-red@2x.png")
export const RED_DOWN_IMG = getPageImage("history/btn_diff_price_down@2x.png")
export const HOLD_IMG = getPageImage("history/btn_diff_price_unchanged_i@2x.png")

export function getPriceUpColor(region="TW") {
  region = (region+"").toUpperCase()

  // switch(region) {
  //   case "MY":
  //   case "SG":
  //   case "ID":
  //   case "PH":
  //     return GREEN
  //   case "TW":
  //   case "TH": case "THAI":
  //   case "JP":
  //   default:
  //     return RED
  // }

  return RED
}

export function getPriceDownColor(region) {
  const upColor = getPriceUpColor(region)
  if(upColor === RED) {
    return GREEN
  }

  return RED
}

export function getPriceUpImage(region) {
  const upColor = getPriceUpColor(region)
  if(upColor === RED) {
    return RED_UP_IMG
  }

  return GREEN_UP_IMG
}

export function getPriceDownImage(region) {
  const downColor = getPriceDownColor(region)
  if(downColor === RED) {
    return RED_DOWN_IMG
  }

  return GREEN_DOWN_IMG
}

export function getDiffImg(region, diff) {
  if(+diff === 0) {
    return HOLD_IMG
  }

  if(+diff > 0) {
    return getPriceUpImage(region)
  }

  if(+diff < 0) {
    return getPriceDownImage(region)
  }
}

export async function getDiffImgWithFrontend(region, diff) {
  const originImg = getDiffImg(region, diff)
  switch(originImg) {
    case GREEN_UP_IMG: return  getFilePath("images/history/btn-diff-price-up-green-20-x-18-2@2x.png")
    case GREEN_DOWN_IMG: return getFilePath("images/history/btn-diff-price-down-red-20-x-19@2x.png")
    case RED_UP_IMG: return getFilePath("images/history/btn-diff-price-up-green-20-x-18@2x.png")
    case RED_DOWN_IMG: return getFilePath("images/history/btn-diff-price-down-red-20-x-19-2@2x.png")
    default: return getFilePath("images/history/btn-diff-price-unchanged-20-x-18@2x.png")
  }
}

export default {
  getPriceDownColor, getPriceUpColor,
  getPriceUpImage, getPriceDownImage,
  getDiffImg,
  GREEN, RED,
  RED_UP_IMG, GREEN_UP_IMG,
  RED_DOWN_IMG, GREEN_DOWN_IMG,
  HOLD_IMG,
}
