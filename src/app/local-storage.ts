export function getLocalStorage(key: string) {
  if (typeof window === "undefined") {
    return null
  }

  return window.localStorage.getItem(key)
}

export function setLocalStorage(key: string, val: string) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(key, val)
}