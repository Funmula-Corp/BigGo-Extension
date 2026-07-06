import {post} from "../../prototype/Sender/content"

/** @type {Map<string, string>} */
const imgPath = new Map

/**
 * 取得圖片
 * @param {string} path
 * @returns {Promise<string>}
 */
export default async function(path) {
  if(!path) {
    return ""
  }

  const tryGet = imgPath.get(path)
  if(tryGet) {
    return tryGet
  }

  const response = await post("get_extension_url", {path})
  if(response) {
    imgPath.set(path, response)
    return response
  }

  return path
}