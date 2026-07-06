import { getTemplateDom, injectStyle, getPriceHistory, emailLogin, closePageFeature } from "./util"
import { getPageImage, i18n, getNindexISO, getNindexRegion, getSitesLang } from "../util.shared"
import addInternalListener from "../iframe/biggo.internal.bundle"
import msg from "./messenger"
import buildAlert from "./dragIframeAlert"
import PriceHistory from "./priceHistoryModule"
import { UNION_MAP } from "../core/union"
import EventBus from "./EventBus"
import { setPageFeature, getConfig } from "@shared/config"
import { isLogin } from "@core/shared/user"
import { getDragPricehistoryDays, setDragPricehistoryDays } from "@shared/status"

// hover之後要跳出視窗的時間
export const HOVER_TIME = 500
// hover離開之後的倒數時間
export const HOVER_LEAVE_TIME = 1500

// 可拖曳的邊界上下最大值
export const DRAG_MAX_HEIGHT = 30
export const DRAG_MIN_HEIGHT = window.innerHeight - (30 + 52)
// 預設最高高度
let DEFAULT_POSITION_MAX_HEIGHT = 30
const ROOT_DOM_ID = "_biggo_float_ph_wrap"

let isSubscribe = false
const SUBSCRIBE_BAR_ID = "_biggo_float_drag_subscribe"

// 用來控制一開始的視窗是否要一直開著的flag
let stillOpen = false

// 15sec setTimeout obj
let timeout15Obj = null
// blur setTimeout obj
let timeoutBlur = null
let timeoutLoaded = null

let cacheObj = null

/** 監聽模組事件 */
EventBus.listen("drag_ph_set_max_height", height => {
  if(height) {
    DEFAULT_POSITION_MAX_HEIGHT = +height
  }
})

const anime = (() => {
  const clear = () => {
    const dom = document.getElementById("_biggo_diff_price")
    if(!dom || !dom.dataset) {
      return
    }

    for (const key in dom.dataset) {
      dom.removeAttribute(`data-${key}`)
    }
  }

  return {
    get time() {
      return document.documentElement.style.getPropertyValue("--biggo-loading-duration")
    },
    set time(ms) {
      document.documentElement.style.setProperty("--biggo-loading-duration", `${ms/1000}s`)
    },
    get width() {
      return document.documentElement.style.getPropertyValue("--biggo-loading-width")
    },
    set width(px) {
      document.documentElement.style.setProperty("--biggo-loading-width", `${px}px`)
    },
    clear,
    loadingImg() {
      document.getElementById("_biggo_drag_loading_img").style.display = null
      document.getElementById("_biggo_diff_img").style.display = "none"
    },
    loadedImg() {
      document.getElementById("_biggo_drag_loading_img").style.display = "none"
      document.getElementById("_biggo_diff_img").style.display = null
    },
    loading() {
      clear()
      document.getElementById("_biggo_diff_price").dataset.loading = true
    },
    loaded() {
      clear()
      document.getElementById("_biggo_diff_price").dataset.loaded = true
    },
    open() {
      clear()
      document.getElementById("_biggo_diff_price").dataset.open = true
    },
    close() {
      document.getElementById("_biggo_diff_price").removeAttribute("data-open")
    }
  }
})()

/**
 * 處理拖曳的類別
 */
class Drag {
  constructor() {
    this.originY = null

    this.isDragin = false
    this.isHover = false
    this.isClick = false
    this.clickFlag = false

    this.dragEnties = null
    this.hoverEnties = null
    this.clickEnties = null

    this.dom = null

    this.onHover = () => {}
    this.onBlur = () => {}
    this.onDrag = () => {}
    this.onClick = () => {}

    this.fnCloseDrag = this.getCloseDragFunction()
    this.fnOnDrag = this.getOnDragFunction()
  }

  /**
   * 掛載到dom
   * @param {HTMLElement} dom
   */
  mount(dom) {
    this.dom = dom
    this.bindEvent()
  }

  /**
   * 開始監聽事件
   */
  bindEvent() {
    this.dom.addEventListener("mouseleave", e => {
      this.isHover = false

      if(this.hoverEnties) {
        clearTimeout(this.hoverEnties)
      }

      if(this.isDraging || this.isClick) {
        return
      }

      clearTimeout(timeoutBlur)
      timeoutBlur = setTimeout(() => {
        this.onBlur()
      }, 200)
    })

    this.dom.addEventListener("mouseenter", e => {
      this.isHover = true

      if(this.isDraging) {
        return
      }

      this.onHover()
    })

    this.dom.addEventListener("mousedown", e => {
      // handle click
      this.isClick = true
      // 0.5s detect time for click event
      this.clickEnties = setTimeout(() => this.isClick = false, 500)

      this.dragEnties = setTimeout(() => {
        this.dragMouseDown(e)
      }, 80)

      if(this.hoverEnties) {
        clearTimeout(this.hoverEnties)
      }
    })

    this.dom.addEventListener("mouseup", e => {
      if(this.isClick) {
        this.onClick()
      }

      this.dragEnties && clearTimeout(this.dragEnties)
    })
  }

  dragMouseDown(e) {
    e = e || window.event
    e.preventDefault()
    // get the mouse cursor position at startup:
    this.originY = e.clientY

    document.addEventListener("mouseup", this.fnCloseDrag)
    document.addEventListener("mousemove", this.fnOnDrag)

    this.dom.dataset.biggoDrag = 1
    this.isDraging = true

    this.onDrag()
  }

  elementDrag(e) {
    e = e || window.event
    e.preventDefault()
    // calculate the new cursor position:
    const newY = this.originY - e.clientY
    let top = this.dom.offsetTop - newY
    this.originY = e.clientY

    if(DRAG_MAX_HEIGHT && top < DRAG_MAX_HEIGHT) {
      top = DRAG_MAX_HEIGHT
    }

    if(DRAG_MIN_HEIGHT && top > DRAG_MIN_HEIGHT) {
      top = DRAG_MIN_HEIGHT
    }
    // set the element's new position:
    this.dom.style.top = top + "px"
  }

  closeDragElement() {
    this.dom.removeAttribute("data-biggo-drag")

    document.removeEventListener("mouseup", this.fnCloseDrag)
    document.removeEventListener("mousemove", this.fnOnDrag)

    this.isDraging = false

    if(this.isHover) {
      this.onHover()
    }

    msg.send("config", "set_drag_config", {
      position: this.dom.offsetTop
    })
  }

  getCloseDragFunction() {
    return e => {
      this.closeDragElement(e)
    }
  }

  getOnDragFunction() {
    return e => {
      this.elementDrag(e)
    }
  }
}

/**
 * iframe物件 負責建構跟顯示
 */
class Iframe {
  /**
   * @constructor
   * @param {string} nindex
   * @param {string} pid
   * @param {number?} defPrice
   */
  constructor(nindex, pid, oid, defPrice=0, currency="") {
    this.iframeId = "_biggo_drag_iframe"

    this.wrap = null
    this.iframe = null
    this.init(nindex, pid, oid, defPrice, currency)

    this.isHover = false

    this.bindEvent()

    this.onBlur = () => {}
    this.onHover = () => {}
  }

  async init(nindex, pid, oid, defPrice, currency) {
    this.wrap = this.getIframeWrap()
    this.iframe = await this.getIframe(nindex, pid, defPrice, currency)
    this.wrap.append(this.iframe)
    this.wrap.append(this.getSubscribeBar(nindex, oid))
  }

  bindEvent() {
    this.wrap.addEventListener("mouseenter", e => {
      this.isHover = true
      this.onHover()
    })

    this.wrap.addEventListener("mouseleave", e => {
      this.isHover = false
      clearTimeout(timeoutBlur)
      timeoutBlur = setTimeout(() => {
        this.onBlur()
      }, 200)
    })
  }

  getIframeWrap() {
    const div = document.createElement("div")
    div.style.position = "fixed"
    div.style.right = "25px"
    div.style.display = "none"
    div.style.height = "438px"
    div.style.width = "290px"
    div.style.zIndex = "2147483647"
    div.style.boxShadow = "0 6px 28px 0 rgba(0, 41, 83, 0.25)"
    div.style.overflow = "hidden"
    div.style.backgroundColor = "#fff"
    div.style.borderRadius = "10px"
    div.style.flexDirection = "column"
    div.id = this.iframeId + "-wrap"
    return div
  }

  getSubscribeBar(nindex, pid) {
    const div = document.createElement("div")
    div.id = SUBSCRIBE_BAR_ID
    div.dataset.sub = isSubscribe? 1 : 0
    div.addEventListener("click", subscribe.bind(null, nindex, pid))

    const svg = document.createElement("i")
    svg.classList.add("__biggo_ph_subscribe_bar_svg")

    const span = document.createElement("span")
    span.id = "__biggo_ph_subscribe_bar_text"
    span.innerText = isSubscribe ? i18n("price_history_favorited") : i18n("price_history_add_to_fav")
    span.style.userSelect = "none"

    div.append(svg)
    div.append(span)
    return div
  }

  async getIframe(nindex, pid, defPrice, currency) {
    const days = await getDragPricehistoryDays()
    const lang = getSitesLang()
    const url = `https://${process.env.API_DOMAIN}/price_history/drag.php?i=${nindex}&id=${pid}&lang=${lang}${defPrice?"&currency="+currency:""}${defPrice?"&price="+defPrice:""}&days=${days}&v=2`
    const iframe = document.createElement("iframe")
    iframe.src = url
    iframe.frameBorder = "0"
    iframe.id = this.iframeId
    iframe.style.height = "400px"
    iframe.style.width = "290px"
    iframe.style.overflow = "hidden"
    iframe.scrolling = "no"
    iframe.style.borderRadius = "10px 10px 0 0"

    iframe.addEventListener("mouseover", () => {
      // 如果一開始是15sec的狀態 那就一併去除狀態
      if(timeout15Obj) {
        clearTimeout(timeout15Obj)
        timeout15Obj = null
        stillOpen = false
      }

      anime.open()
    })

    return iframe
  }

  isIframeExists() {
    return !!document.getElementById(this.iframeId)
  }

  isShow() {
    return this.wrap.style.display !== "none"
  }

  /**
   * 顯示iframe
   * @param {number} top
   */
  show(top) {
    this.wrap.style.display = "flex"
    this.wrap.style.top = `${top}px`

    if(!this.isIframeExists()) {
      document.body.append(this.wrap)
    }
  }

  /**
   * 隱藏iframe
   */
  hide() {
    this.wrap.style.display = "none"
    stillOpen = false
  }
}

let subTipInstance = null
async function subscribe(nindex, id) {
  if(!(await isLogin())) {
    emailLogin()
    return
  }

  msg.send("api", "subscribe", {nindex, id, type: !isSubscribe})
  setSubscribe(!isSubscribe)

  if(!isSubscribe) {
    document.querySelector(".___biggo_sub_tip").style.transform = "translateX(0)"
    subTipInstance = setTimeout(() => {
      document.querySelector(".___biggo_sub_tip").style.transform = "translateX(100%)"
    }, 2000)
  } else {
    document.querySelector(".___biggo_sub_tip").style.transform = "translateX(100%)"
    clearTimeout(subTipInstance)
  }
}

async function setSubscribe(type) {
  if(!(await isLogin())) {
    return
  }

  const bar = document.getElementById(SUBSCRIBE_BAR_ID)
  const barText = document.getElementById("__biggo_ph_subscribe_bar_text")
  const drag = document.getElementById("_biggo_drag_sub_wrap")

  if(drag) {
    drag.dataset.sub = !type ? 0 : 1
  }

  if(bar) {
    bar.dataset.sub = !type ? 0 : 1
  }

  if(barText) {
    barText.innerText = !type ? i18n("price_history_add_to_fav") : i18n("price_history_favorited")
  }

  isSubscribe = type
}

/**
 * 從server拿歷史價格資料
 * @param {string} nindex
 * @param {string} pid
 * @param {number} day
 * @returns
 */
async function getHistoryInfo(nindex, pid, day) {
  const item = `${nindex}-${pid}`
  const data = await getPriceHistory(item, day)

  if(!data) {
    return false
  }

  if(data[item] && !Array.isArray(data[item])) {
    return data[item]
  }

  for (const _item of data) {
    if(!Array.isArray(_item)) {
      return _item
    }
  }

  return false
}

/**
 * 計算顯示的視窗應該要在上面還是在下面
 * @param {number} offsetTop
 * @returns {number}
 */
function calcIframeHeight(offsetTop) {
  if(offsetTop) {
    const isUp = window.innerHeight / 2 > offsetTop
    return isUp ? offsetTop + 60 : offsetTop - 445
  }

  return offsetTop
}

/**
 * on hover handle
 * @param {Iframe} iframeObj
 * @param {Drag} dragObj
 */
function onHover(iframeObj, dragObj) {
  const offsetTop = dragObj.dom.offsetTop
  if(offsetTop) {
    iframeObj.show(calcIframeHeight(offsetTop))
    anime.open()
    anime.time = HOVER_LEAVE_TIME
  }

  clearTimeout(timeoutLoaded)
  clearTimeout(timeoutBlur)
}

function destroyDrag() {
  remove()
  closePageFeature("priceHistory")
}

/**
 * on blur handle
 * @param {Iframe} iframeObj
 * @param {Drag} dragObj
 * @returns {Function}
 */
function onBlur(iframeObj, dragObj) {
  return () => {
    anime.loadedImg()

    if(stillOpen) {
      return
    }

    if(iframeObj.isShow() && !iframeObj.isHover && !dragObj.isHover) {
      anime.loading()
    }

    clearTimeout(timeoutLoaded)
    timeoutLoaded = setTimeout(() => {
      if(!iframeObj.isHover && !dragObj.isHover) {
        iframeObj.hide()
        anime.loaded()
      }
    }, HOVER_LEAVE_TIME)
  }
}

/**
 * on drag hadnle
 * @param {Iframe} iframeObj
 * @param {Drag} dragObj
 * @returns {Function}
 */
function onDrag(iframeObj, dragObj) {
  return () => {
    iframeObj.hide()
    anime.clear()
  }
}

/**
 * 監聽傳出來的事件
 * @param {Iframe} iframeObj
 */
function bindInternalEvent(iframeObj) {
  // 監聽關閉事件
  addInternalListener("close", () => {
    iframeObj.hide()
    anime.clear()
  })

  // 監聽關閉整個功能
  addInternalListener("destory-drag", async () => {
    const _isLogin = await isLogin()
    if(!_isLogin) {
      return buildAlert({onSubmit: destroyDrag})
    }

    destroyDrag()
  })

  // 監聽強制關閉功能
  addInternalListener("destory-force", destroyDrag)

  // 監聽設定預設放大
  addInternalListener("def-full", () => {
    msg.send("config", "set_drag_config", {
      default: "def-full"
    })
  })

  // 監聽設定預設縮小
  addInternalListener("def-min", () => {
    msg.send("config", "set_drag_config", {
      default: "def-min"
    })
  })

  // 監聽設定顯示15秒後關閉
  addInternalListener("15sec", () => {
    msg.send("config", "set_drag_config", {
      default: "15sec"
    })
  })

  // 監聽使前端可以拿到快取的price history資料
  addInternalListener("get-cache-pricehistory", (_, reply) => {
    reply(cacheObj)
  })

  // 設定預設天數
  addInternalListener("set-def-days", days => {
    setDragPricehistoryDays(+days)
  })
}

async function getModleList(nindex, id) {
  return msg.post("api", "get_product_model_list", {nindex, id})
}

/**
 * 主要處理程序
 * @param {Object} data
 * @param {string} nindex
 * @param {string} pid
 * @param {number} defPrice
 * @param {Object} config
 * @returns {Promise}
 */
async function processDragIframe(data, nindex, pid, oid, defPrice, currency, config) {
  // 取得包裝iframe的dom
  const dom = document.getElementById(ROOT_DOM_ID)

  // 設定最後一次的高度
  if(config.position) {
    dom.style.top = `${DEFAULT_POSITION_MAX_HEIGHT > config.position ? DEFAULT_POSITION_MAX_HEIGHT : config.position}px`
  }

  // 建構需要的物件
  const dragObj = new Drag
  dragObj.mount(dom)
  setSubscribe(isSubscribe)

  const dragSubscribeBtn = document.getElementById("_biggo_drag_sub_wrap")
  dragSubscribeBtn.addEventListener("mousedown", e => {
    e.preventDefault()
    e.stopPropagation()
  })
  dragSubscribeBtn.addEventListener("click", e => {
    e.preventDefault()
    e.stopPropagation()
    subscribe(nindex, oid)
  })

  const iframeObj = new Iframe(nindex, pid, oid, defPrice, currency)

  // 綁定callback
  iframeObj.onBlur = dragObj.onBlur = onBlur(iframeObj, dragObj)
  iframeObj.onHover = () => {
    anime.time = HOVER_LEAVE_TIME
    anime.open()
    clearTimeout(timeoutLoaded)
    clearTimeout(timeoutBlur)
  }
  dragObj.onHover = () => {
    anime.open()
    if(!iframeObj.isShow()) {
      anime.loadingImg()
    }
    dragObj.hoverEnties = setTimeout(() => {
      anime.loadedImg()
      onHover(iframeObj, dragObj)
    }, HOVER_TIME)
  }
  dragObj.onClick = () => {
    anime.open()
    anime.loadedImg()
    // 同一個實作 所以先用跟hover一樣的handle
    onHover(iframeObj, dragObj)
  }
  dragObj.onDrag = onDrag(iframeObj, dragObj)
  // handle close event
  bindInternalEvent(iframeObj)

  // 先檢查上次有沒有設定
  const mode = config.default
  if(mode === "15sec" || mode === "def-full") {
    setTimeout(() => {
      iframeObj.show(calcIframeHeight(dragObj.dom.offsetTop))
      stillOpen = true
    }, 0)
  }

  // 取得價格漲跌的文字跟圖片
  let diffImg = getPageImage("ic_price-history_price-stable.svg")
  let localeDiffPrice = ""

  // defPrice===0代表有資料
  if(defPrice === 0) {
    const price = data.current_price
    const symbol = data.symbol
    const lastPrice = data.price_history.length < 2
      ? data.current_price
      : data.price_history[data.price_history.length-2].y
    const diff = price - lastPrice
    localeDiffPrice = `${symbol}${Math.abs(+diff).toLocaleString(getNindexISO(nindex))}`
    const nindexRegion = getNindexRegion(nindex)

    if(diff < 0) {
      diffImg = getPageImage("ic_price-history_price-down.svg")
    }else if(diff > 0) {
      diffImg = getPageImage("ic_price-history_price-up.svg")
    }else{
      localeDiffPrice = ""
    }
  }

  // 有多規格就統一
  if(data.multiple_product) {
    diffImg = getPageImage("ic_price-history_price-stable.svg")
    localeDiffPrice = ""
  }

  document.getElementById("_biggo_diff_img").src = diffImg
  document.getElementById("_biggo_diff_price_text").textContent = localeDiffPrice
  document.getElementById("_biggo_drag_loading_img").src = getPageImage("loading.svg")
  document.querySelector(".___biggo_sub_tip").textContent = i18n("price_history_sub_tip")

  setTimeout(() => {
    anime.width = document.getElementById("_biggo_diff_price").clientWidth
    if(mode === "15sec") {
      anime.time = 17000
      anime.loading()

      timeout15Obj = setTimeout(() => {
        anime.loaded()
        iframeObj.hide()
      }, 1000 * 15)
    }
  }, 100)
}

/**
 * 建立整個功能
 * @param {string} nindex
 * @param {string} pid
 * @returns {Promise<boolean|null>}
 */
export async function build(nindex, pid) {
  const config = await getConfig()
  if(!config.pageFeature.priceHistory) {
    return false
  }

  /** @type {Record<string, {price: number, currency: string}>} */
  const modelList = await getModleList(nindex, pid)
  // 這兩個選項都是防止資料是空的
  let defPrice = 0
  let currency = ""
  const oid = pid

  if(typeof modelList === "object" && Object.keys(modelList).length > 0) {
    const modelIdList = Object.keys(modelList)
    const lastModelId = modelIdList[modelIdList.length-1] || ""
    pid = `${pid}-${lastModelId}`
    defPrice = +modelList[lastModelId].price
    currency = modelList[lastModelId].currency
  }

  let history = await getHistoryInfo(nindex, pid, 90)
  if(!history) {
    if(defPrice === 0) {
      return false
    }
  }

  // cache price history data
  cacheObj = history

  injectStyle("dragIframe.css")
  const dom = await getTemplateDom("drag_price_history.html")
  document.body.append(dom)

  const initSub = async () => setSubscribe(await msg.post("api", "is_subscribe", {nindex, id: oid}))
  if(await isLogin()) {
    await initSub()
  } else {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if(request.type === "login_success") {
        initSub()
      }
    })
  }

  return new Promise(resolve => {
    setTimeout(() => {
      resolve(processDragIframe(history, nindex, pid, oid, defPrice, currency, config.dragPriceHistory))
    }, 0)
  })
}

/**
 * 功能 rollback
 */
export async function remove() {
  const dom = document.getElementById(ROOT_DOM_ID)
  if(dom) {
    dom.remove()
  }

  const iframe = document.getElementById("_biggo_drag_iframe")
  if(iframe) {
    iframe.remove()
  }

  const iframeWrap = document.getElementById("_biggo_drag_iframe-wrap")
  if(iframeWrap) {
    iframeWrap.remove()
  }
}

export default {
  build,
  remove
}
