<script>
  import { getNindexRegion, chunk, isSafari as checkIsSafari } from "@/util.shared"
  import { send, post } from "@/prototype/Sender/content"
  import { getDiffImgWithFrontend } from "@/content/priceHistoryModule"
  import { ga } from "../../util"
  import { MLT_FOLD_CLOSE } from "@shared/status"
  import { getFilePath } from "../../util"
  import useTranslate from "./useTranslate"
  import Item from "./Item.svelte"
  import { onMount } from "svelte"

  let { nindex, id } = $props()

  let region = $state("us")
  let isClose = $state(false)
  let mlt = $state([])
  let page = $state(1)
  let pageItemCount = 5
  let lock = $state(false)
  let show = $state(false)
  let cheapestImg = $state("https://extension.biggo.com/images/extension/ic_cheapest_en@2x.png")
  let scrolling = $state(false)
  let scrollDirection = $state("none")
  let scrollAnimationTime = 550
  let formatter = $state(null)
  let translate = $state({ text: {}, img: [] })
  let isShowReview = $state(false)
  let isSafariFlag = $state(false)
  let isSafariHover = $state(false)

  let group = $derived(chunk(mlt, pageItemCount))
  let totalPage = $derived(Math.ceil(mlt.length / pageItemCount) || 1)

  let turnPageItem = $derived.by(() => {
    if (scrollDirection === "right") {
      return [
        ...group[page - 1],
        ...(group[page] || [])
      ]
    }
    if (scrollDirection === "left") {
      return [
        ...(group[page - 2] || []),
        ...group[page - 1]
      ]
    }
    return group[page - 1]
  })

  let pageItem = $derived(scrollDirection !== "none" ? turnPageItem : group[page - 1])

  function priceFormat(num) {
    return formatter && formatter.format(+num) || 0
  }

  function close() {
    isClose = true
    send("set_mlt_close")
  }

  function open() {
    if (!lock) {
      isClose = false
      send("set_mlt_open")
    }
  }

  async function getData() {
    const data = await post("get_mlt", { nindex, id })
    return data && data.found && data.more || []
  }

  function openPage(url) {
    window.open(url)
    ga("more_like_this", "open_url", url)
  }

  function nextPage() {
    if (scrolling || page >= totalPage) return
    scrollDirection = "right"
    setTimeout(() => {
      scrolling = true
      setTimeout(() => {
        page++
        scrolling = false
        scrollDirection = "none"
      }, scrollAnimationTime)
    }, 100)
  }

  function preventPage() {
    if (scrolling || page === 1) return
    scrollDirection = "left"
    setTimeout(() => {
      scrolling = true
      setTimeout(() => {
        page--
        scrolling = false
        scrollDirection = "none"
      }, scrollAnimationTime)
    }, 100)
  }

  async function getCheapestImg() {
    const lang = await post("get_ui_lang")
    let img = "ic_cheapest_en@2x.png"
    switch (lang) {
      case "zh_TW":
      case "zh_HK":
        img = "ic_cheapest@2x.png"
        break
      case "th_TH":
        img = "ic_cheapest_thai@2x.png"
    }
    return getFilePath(`images/${img}`)
  }

  async function isFold() {
    return (await post("get_mlt_fold")) === MLT_FOLD_CLOSE
  }

  function skipReview(sendGA = true) {
    isShowReview = false
    send("hide_review")
    if (sendGA) {
      ga("rateus_buttom", "skip")
    }
  }

  function goReview() {
    skipReview(false)
    window.open("https://extension.biggo.com/r/review.php")
    ga("rateus_buttom", "click")
  }

  function safariLeaveHover() {
    if (!isSafariFlag) return
    setTimeout(() => {
      isSafariHover = false
      setTimeout(() => {
        isSafariHover = true
        setTimeout(() => {
          isSafariHover = false
        }, 20)
      }, 50)
    }, 50)
  }

  onMount(async () => {
    let nindexRegion = getNindexRegion(nindex)
    nindexRegion = nindexRegion === "thai" ? "th" : nindexRegion
    formatter = new Intl.NumberFormat([nindexRegion, "us"])
    region = nindexRegion

    const items = await getData()
    items.forEach(item => mlt.push(item))

    for (const index in mlt) {
      mlt[index].diffImg = await getDiffImgWithFrontend(nindexRegion, mlt[index].price_diff_real)
    }

    cheapestImg = await getCheapestImg()

    if (mlt.length === 0) {
      lock = true
      isClose = true
    }

    if (await isFold()) {
      isClose = true
    }

    translate = await useTranslate()

    show = true
    send("mlt_ready")

    isShowReview = !(await post("has_reviewed"))
    isSafariFlag = checkIsSafari()
  })
</script>

{#if show}
  {#if isClose}
      <div class="trigger">
        <img onclick={open} src={translate.img?.trigger} height="42" alt="">
        <div class="tip">
          {mlt.length > 0 ? translate.text?.mlt_x_product_total?.replace("%s", mlt.length) : translate.text?.no_mlt_result}
        </div>
      </div>
    {:else}
      <div class="mlt-wrap" style={isSafariHover ? "display: inline-flex" : ""}>
        <div class="menu">
          <img src={translate.img?.logo} id="biggo-img" style="height: 22px" alt="">
          <div style="margin-top: 4px; margin-bottom: 8px; font-size: 12px;">
            <div>{translate.text?.x_items?.replace("%s", mlt.length)}</div>
            <div>{page}/{totalPage}</div>
          </div>
          <div class="close-hint" onclick={close}>
            <div class="arrow arrow-left"></div>
            <span style="margin-left:6px" class="close-hint">{translate.text?.close}</span>
          </div>
        </div>
        <div class="items" data-page={page} data-scrolling={scrolling ? 1 : 0} data-sd={scrollDirection} onmouseleave={safariLeaveHover}>
          {#if pageItem}
            {#each pageItem as item, index (item)}
              <Item {item} {index} {region} {page} {cheapestImg} onopen={openPage} />
            {/each}
          {/if}
          <div class="bloom">&nbsp;</div>
        </div>

        <div class="last-block" style="position: relative;">
          {#if page < totalPage && isShowReview}
            <div onclick={nextPage} class="nav" style="left: -10px"><div class="arrow arrow-right"></div></div>
          {/if}

          {#if isShowReview}
            <div class="review">
              <div>{translate.text?.review_do_you_like}</div>
              <div style="display: flex; flex-wrap: wrap">
                <div>{translate.text?.review_feedback}</div>
                <div>&nbsp;★★★★★</div>
              </div>
              <div class="review-btn-wrap">
                <div class="review-btn" style="margin-right: 8px" onclick={() => skipReview()}>{translate.text?.review_skip}</div>
                <div class="review-btn" onclick={goReview}>{translate.text?.review_rate}</div>
              </div>
            </div>
          {/if}
        </div>

        <div class="close-btn" onclick={close}></div>
        {#if page > 1}
          <div onclick={preventPage} class="nav" style="left: 63px"><div class="arrow arrow-left"></div></div>
        {/if}
        {#if page < totalPage && !isShowReview}
          <div onclick={nextPage} class="nav" style="right: 22px"><div class="arrow arrow-right"></div></div>
        {/if}
      </div>
  {/if}
{/if}
