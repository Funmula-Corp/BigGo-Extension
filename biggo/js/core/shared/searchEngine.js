import { getQueryVariable } from "../../util.shared"

export const list = {
  "google": {
    ptn: new RegExp("https:\/\/www\.google\.(com|com\.tw|co\.jp|com\.sg|com\.my|co\.th|co\.id|com\.ph)\/search\?"),
    mark: "google",
    path: ".g div > a[data-ved]:not([class])",
    parser(querystring) {
      return getQueryVariable(querystring, 'q', false)
    },
    sparser() {
      return document.body.querySelectorAll(".g div > a[data-ved]:not([class])")
    },
  }
}

export function getPath(se) {
  return list[se] && list[se].path || ""
}

export function getQuery(se, url) {
  const engine = list[se]
  if(engine) {
    return engine.parser(url)
  }

  return ""
}

export function checkUrl(url) {
  for(const name in list) {
    const obj = list[name]
    if(!(obj.ptn instanceof RegExp)) {
      obj.ptn = new RegExp(obj.ptn)
    }
    if(obj.ptn.test(url)) {
      return name
    }
  }

  return null
}

export function getDomPath(url) {
  const se = checkUrl(url) || ""
  if(!se) {
    return ""
  }

  return list[se].path || ""
}
