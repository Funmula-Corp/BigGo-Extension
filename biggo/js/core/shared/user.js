import storage, { STORAGE_KEY_LOGIN, STORAGE_KEY_LOGIN_PROFILE } from "./storage"

export async function login() {
  await storage.setItem(STORAGE_KEY_LOGIN, true)
}

export async function logout() {
  await storage.setItem(STORAGE_KEY_LOGIN, false)
}

export async function isLogin() {
  return await storage.getItem(STORAGE_KEY_LOGIN, false)
}

export async function getUserProfile() {
  if(!(await isLogin())) {
    return false
  }

  return await storage.getItem(STORAGE_KEY_LOGIN_PROFILE, false)
}

export async function setUserProfile(profile) {
  await storage.setItem(STORAGE_KEY_LOGIN_PROFILE, profile||false)
}