import { getQueryVariable } from "../../util.shared"

export const list = {
  "google": {
    parser(querystring) {
      return getQueryVariable(querystring, 'q', false)
    },
  }
}

export function getQuery(se, url) {
  const engine = list[se]
  if(engine) {
    return engine.parser(url)
  }

  return ""
}
