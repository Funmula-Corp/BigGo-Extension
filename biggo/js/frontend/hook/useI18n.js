import {post} from "../../prototype/Sender/content"

/** @type {Map<string, string>} */
const i18n = new Map

/**
 * 取得翻譯
 * @param {string} key
 * @param {string[]} param
 * @returns {Promise<string>}
 */
export default async function(key, param=[]) {
  if(!key) {
    return ""
  }

  const tryGet = i18n.get(key)
  if(tryGet) {
    return tryGet
  }

  const response = await post("i18n", {key, param})
  if(response) {
    i18n.set(key, response)
    return response
  }

  return key
}