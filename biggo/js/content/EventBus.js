const bus = document.createElement("div")

export function listen(event, fn) {
  bus.addEventListener(event, e => fn(e.detail))
}

export function dispatch(event, detail) {
  bus.dispatchEvent(new CustomEvent(event, {detail}))
}

export default {listen, dispatch}