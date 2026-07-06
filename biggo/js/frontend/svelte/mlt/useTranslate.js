import useI18n from "../../hook/useI18n"
import useImagePath from "../../hook/useImagePath"

export default async function() {
  return {
    text: {
      x_items: await useI18n("x_items", ["%s"]),
      mlt_x_product_total: await useI18n("mlt_x_product_total", ["%s"]),
      close: await useI18n("close"),
      no_mlt_result: await useI18n("no_mlt_result"),
      review_do_you_like: await useI18n("review_do_you_like"),
      review_feedback: await useI18n("review_feedback"),
      review_skip: await useI18n("review_skip"),
      review_rate: await useI18n("review_rate"),
    },
    img: {
      trigger: await useImagePath("images/btn_biggo_icon@2x.png"),
      logo: await useImagePath("images/new-logo@3x.png"),
      bigicon: await useImagePath("images/bigcoin.png")
    }
  }
}
