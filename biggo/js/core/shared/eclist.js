import { getQueryVariable } from "../../util.shared"

export const isInListBlock = (nindex) => {
  return [].includes(nindex)
}

export const getUrlMatch = (url, regex) => {
  return new RegExp(regex).exec(url)
}

export const getIdWithRegexp = (url, regex, template="%1", config={}) => {
  let match = getUrlMatch(url, regex)
  let pid

  if(match) {
    pid = match[1]
  }

  // TODO 改成自適應數量 適配足夠的
  // TODO 目前只支援到2個 之後可以改成支援多個
  // TODO 支援負數%
  if(template && match) {
    pid = template.replace("%1", match[1])
    if(template.indexOf("%2") > -1 && match.length > 2) {
      pid = template.replace("%2", match[2])
      if(pid.indexOf("%1") > -1) {
        pid = pid.replace("%1", match[1])
      }
    }
  }

  if("len" in config && "pad" in config && config.len && pid.includes("%p") && +config.len > pid.length) {
    pid = pid.replace("%p", Array(config.len - (pid.length - 2)).fill().map(_ => config.pad).join())
  }

  return {match, pid}
}

export const getParser = (url, nindex, config) => {
  const isUppercase = !!config.uppercase
  const isLowercase = !!config.lowercase

  let regex = config.match || ""
  let query = config.query || ""
  let template = config.template || "%1"

  // init parameter
  let match = []
  let pid = ""

  if(!isInListBlock(nindex)) {
    // check regexp
    if(regex) {
      // 都包裝成array統一處理
      if(!Array.isArray(regex)) {
        regex = [regex]
      }
      if(!Array.isArray(template)) {
        template = [template]
      }

      // 取得結果
      const tmp = regex
        .map((re, index) => getIdWithRegexp(url, re, template[index]||template[0]), config)
        .filter(obj => obj.pid)
      if(tmp.length > 0) {
        match = tmp[0].match
        pid = tmp[0].pid
      }
    }

    // check url search query
    if(query) {
      pid = getQueryVariable(url, query) || pid
    }
  }

  // custom rule
  if(nindex === "tw_pmall_rakuten") {
    if(match[1] && match[2]) {
      return `${match[1]}_${match[2].toUpperCase()}`
    }
  }

  if(isUppercase) {
    pid = pid.toUpperCase()
  }

  if(isLowercase) {
    pid = pid.toLowerCase()
  }

  return pid
}

export const getParserWrap = (nindex, config) => {
  return url => getParser(url, nindex, config)
}

export const buildEcList = (list) => {
  tmp = {...list}
  for (const nindex in tmp) {
    tmp[nindex].pparser = getParserWrap(nindex, tmp[nindex])
  }
  return tmp
}

export const getProductId = (list, nindex, url) => {
  let pid = ""
  if(list[nindex]) {
    const current = list[nindex]
    pid = getParser(url, nindex, current)
  }

  pid = pid && pid.pid || pid || ""
  if(typeof pid === "string") {
    return pid
  }
  return ""
}

export default {buildEcList, getIdWithRegexp, getProductId}