import storage, { STORAGE_KEY_CONFIG } from "./storage"

export function getDefConfig() {
  return {
    pageFeature: {
      priceHistory: true,
      moreLikeThis: true,
      searchEngineSuggest: true,
      idleCashback: true,
      couponPopup: true,
      blockSetting: true,
      region: "auto",
      imageSearchContext: true,
      imageSearchPage: true,
    },
    dragPriceHistory: {
      position: 30,
      default: "15sec"
    },
    popCouponSetting: {
      default: "def"
    }
  }
}

export async function getConfig() {
  const defConfig = getDefConfig()
  const config = await storage.getItem(STORAGE_KEY_CONFIG, defConfig)

  config.pageFeature = {
    ...defConfig.pageFeature,
    ...config.pageFeature,
  }

  config.dragPriceHistory = {
    ...defConfig.dragPriceHistory,
    ...config.dragPriceHistory,
  }

  config.popCouponSetting = {
    ...defConfig.popCouponSetting,
    ...config.popCouponSetting,
  }

  return config
}

export async function setConfig(config) {
  const currentConfig = await getConfig()
  const _config = {}
  _config.pageFeature = {
    ...getDefConfig().pageFeature,
    ...(currentConfig.pageFeature || {}),
    ...(config.pageFeature || {})
  }

  _config.dragPriceHistory = {
    ...getDefConfig().dragPriceHistory,
    ...(currentConfig.dragPriceHistory || {}),
    ...(config.dragPriceHistory || {})
  }

  _config.popCouponSetting = {
    ...getDefConfig().popCouponSetting,
    ...(currentConfig.popCouponSetting || {}),
    ...(config.popCouponSetting || {})
  }

  storage.setItem(STORAGE_KEY_CONFIG, _config)
}

export function setDragConfig(config) {
  setConfig({
    dragPriceHistory: config
  })
}

export function setPageFeature(config) {
  return setConfig({
    pageFeature: config
  })
}

export async function setConfigFromServer(remoteConfig) {
  const current = await getConfig()

  await setPageFeature({
    priceHistory: !!remoteConfig.price_history,
    moreLikeThis: !!remoteConfig.more_like_this,
    couponPopup: !!remoteConfig.promocode,
    region: remoteConfig.region || current.pageFeature.region || "auto",
    searchEngineSuggest: typeof remoteConfig.google_query === "undefined" ? true : !!remoteConfig.google_query,
    blockSetting: typeof remoteConfig.block_setting === "undefined" ? true : !!remoteConfig.block_setting,
    imageSearchContext: typeof remoteConfig.image_search_context === "undefined" ? true : !!remoteConfig.image_search_context,
    imageSearchPage: typeof remoteConfig.image_search_page === "undefined" ? true : !!remoteConfig.image_search_page,
  })
}
