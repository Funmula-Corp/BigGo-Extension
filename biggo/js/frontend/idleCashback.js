import { inject } from "./shadowDom"
import { getFilePath, getFormatTemplateDom, i18n, biggoR, getSiteList } from "./util"

const COMPONENT_NAME = "biggo-idle"

async function getDom() {
  const root = await getFormatTemplateDom("idle_cashback.html", {
    idle_may_not_track: await i18n("idle_may_not_track"),
    idle_cashback_reason: await i18n("idle_cashback_reason"),
  })
  return root
}

function destroy() {
  if(document.querySelector(COMPONENT_NAME)) {
    document.querySelector(COMPONENT_NAME).remove()
  }
}

async function buildFeat(dom, site, nindex) {
  const domCloseBtn = dom.getElementById("biggo_close_btn")
  const domRedirectBtn = dom.getElementById("biggo_goto_btn")
  const domWrap = dom.querySelector(".main-wrap")
  const domMain = dom.querySelector(".main")

  // 點擊後面黑色部份要關閉
  domCloseBtn.addEventListener("click", destroy)
  domWrap.addEventListener("click", destroy)
  domMain.addEventListener("click", e => e.stopPropagation())

  // Redirect
  domRedirectBtn.addEventListener("click", () => {
    biggoR(nindex)
    destroy()
  })

  const domStoreLogo = dom.getElementById("biggo_ec_logo")
  const domCashbackRate = dom.getElementById("biggo_ec_rate_desc")

  if(site.detail) {
    if(site.detail.image) {
      domStoreLogo.src = site.detail.image
    }

    if(site.detail.rate_desc) {
      let desc = site.detail.rate_desc

      const getMaxRateDesc = (desc, sp) => {
        const strarr = desc.split(sp)
        if(strarr.length >= 2) {
          desc = strarr[1]
        }
        return desc.trim()
      }

      if(desc.includes("-")) {
        desc = getMaxRateDesc(desc, "-")
      }

      if(desc.includes("~")) {
        desc = getMaxRateDesc(desc, "~")
      }

      domCashbackRate.innerText = await i18n("active_cashback", [desc])
    }
  }
}

export async function build(nindex) {
  const sites = await getSiteList()
  if(!(nindex in sites)) {
    return
  }

  const site = sites[nindex]
  const dom = await getDom(nindex)
  buildFeat(dom, site, nindex)

  const shadow = inject(COMPONENT_NAME, dom, {
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    position: "fixed",
    zIndex: "999999999",
  }, ["style/mlt.css", "style/idleCashback.css"])
}
