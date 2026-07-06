import * as util from "./content/util"

;(async () => {
  const url = window.location.href
  // 是店商就更新icon
  let nindex = await util.getNindex(url)
  let id = ""
  if(nindex) {
    const result = await util.resolveTrueNindex(nindex, url)
    nindex = result.nindex
    id = result.pid
  }

  util.updateIcon(nindex, id)
})()
