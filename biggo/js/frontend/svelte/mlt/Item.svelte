<script>
  import useTranslate from "./useTranslate"
  import { onMount } from "svelte"

  let { item, index, region, page = 1, cheapestImg = "", onopen } = $props()

  const priceFormat = (price) => (new Intl.NumberFormat([region, "us"])).format(+price)

  let cbImg = $state("#")

  onMount(async () => {
    const { img } = await useTranslate()
    cbImg = img.bigicon
  })
</script>

<div class="item" onclick={() => onopen?.(item.url)}>
  <div class="pop">
    {#if index === 0 && page === 1}
      <img src={cheapestImg} class="cheapest" alt="">
    {/if}

    <div class="hover-show">
      <div class="product-img">
        <img src={item.image} alt="">
      </div>
    </div>

    {#if item.cashback}
      <div class="hover-show" style="margin-bottom: 3px">
        <div class="cashback-wrap">
          <img width="12" src={cbImg} alt="">
          <span>{item.cashback.rate_desc}</span>
        </div>
      </div>
    {/if}

    <div class="product-title line-clamp-2">
      {item.title}
    </div>

    <div class="price-wrap" style="margin-top: 5px; margin-bottom: 6px">
      <div class="currency">{item.symbol}</div>
      <div class="line-clamp-1">{priceFormat(item.price)}</div>
    </div>

    <div class="bottom">
      <div class="store">
        <img src={item.store.image} class="store-img" alt="">
        <span class="store-name line-clamp-1">
          {item.store.name}
        </span>
      </div>
    </div>
  </div>
</div>
