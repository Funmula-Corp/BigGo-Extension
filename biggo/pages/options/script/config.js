!(async () => {
  // const util = import("../../../js/content/util.js")
  // const config = await util.getConfig()
  // const {pageFeature} = config
  // const {
  //   priceHistory,
  //   moreLikeThis,
  //   searchEngineSuggest,
  //   idleCashback,
  //   couponPopup
  // } = pageFeature

  // const domPriceHistory = document.getElementById("price-history-toggle")
  // const domMoreLikeThis = document.getElementById("more-like-this-toggle")
  // const domGoogleSuggest = document.getElementById("google-suggestion-toggle")
  // const domCouponCode = document.getElementById("promo-code-toggle")

  // domPriceHistory.checked = !!priceHistory
  // domMoreLikeThis.checked = !!moreLikeThis
  // domGoogleSuggest.checked = !!searchEngineSuggest
  // domCouponCode.checked = !!couponPopup

  // const domSubmit = document.getElementById("submit-config")
  // domSubmit.addEventListener("click", e => {
  //   config.pageFeature.priceHistory = domPriceHistory.checked
  //   config.pageFeature.moreLikeThis = domMoreLikeThis.checked
  //   config.pageFeature.searchEngineSuggest = domGoogleSuggest.checked
  //   config.pageFeature.couponPopup = domCouponCode.checked
  //   util.setConfig(config)
  // })

  window.location.href = "https://extension.biggo.com/member/account.php#feature-setting"
})()