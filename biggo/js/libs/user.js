import * as util from "./util"
import { setGAUserId as _setGAUserId } from "./ga"
import {send as PopupSender} from "../prototype/Sender/popup"
import { login as _login, logout as _logout, setUserProfile, isLogin, getUserProfile as getLoginProfile } from "@shared/user"

function logout() {
  _logout()
  setUserProfile(false)
  PopupSender("logout")
}

export async function apiLogout() {
  try {
    await util.getText(`https://${process.env.ACCOUNT_DOMAIN}/logout.php?src=extension`)
    await util.getText(`https://${process.env.API_DOMAIN}/api/logout.php?src=extension`)
    return true
  } catch(e) {}

  console.log("logout fail")
  return false
}

function login() {
  _login()
  PopupSender("login")
}

export function setLogin(flag, profile=false) {
  !!flag ? login() : logout()

  if(flag && profile && profile.is_login) {
    setUserProfile(profile)
    setGAUserId()
  }
}

export async function getUserId() {
  const profile = await getLoginProfile()
  if(profile && profile.id) {
    return profile.id
  }

  return false
}

export async function setGAUserId() {
  try {
    const id = await getUserId()
    if(!id) {
      return
    }

    _setGAUserId(id)
  }catch(e){}
}

export default {
  setLogin,
  isLogin,
  getLoginProfile,
  apiLogout,
  getUserId,
  setGAUserId
}
