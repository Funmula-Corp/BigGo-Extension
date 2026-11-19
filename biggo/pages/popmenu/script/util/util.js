export function getParameter(hash=window.location.hash){
  return hash.replace(/^#/,'').split("&").map(query => {
      return query.split("=")
  }).reduce((last, item) => {
      last[item[0]] = item[1]
      return last
  }, {})
}
