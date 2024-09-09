---
title: Composable Products
description: Quidem magni aut exercitationem maxime rerum eos.
---

seam pools are multi-protocol composite positions for staking, pools,lending, on-chain order-books. these give users the ability to hold a diverse set of positions across different dapps.

---

## Types + examples of protocols we are are considering integrating:

* [LiquidSwap](https://liquidswap.com/#/)
  * Usage: swap and pools
* Hippo - dex + aggregator
  * Usage: swap and pools
* Aries - margin trading
  * Usage: take out leveraged shorts and longs

* Aptin lending and borrowing
  * Usage: increase or decrease exposures

* tsunami - spot trades + leveraged
  * Usage: conditional order execution

* Econia - framework on chain order-book
  * Usage: limit orders

* Anime.swap - Uniswap v2 like Pools + swap

for examples of these how examples of combining positions across these protocols using the parallelization of can create unique opportunities for LP's

### what is unique about creating positions with seam

unlike other Defi product aggregators, seam allows you to wrap these positions together into one custodial token. with custody of this token, the user is able to claim rewards from yields/staking(+increase time lock), and mint a token with a conditional right to claim all or a portion of the managed position.

This can be kept by the minter to ensure the close of a position at the expiry if the condition expires valid they are able to execute their option and claim the .
A Minter may also choose to sell, effectively hedging

### First Pools

for our first set of pools the first composed pools will provide a fixed ratio multi-LP position.

an example of this could be a combination of pools providing liquidity
to a set of liquidity pools provided by the integrations above

for more examples checkout out [trade page](www.seam.money/trade)

some composables could roughly be the following: - a pool with fixed ratio deposits across APT/(BTC,ETH,SOL) pools - provide liquidity to pool X/Z with supply of X to lending market for borrowing X + Z - increase exposure with lend + borrow to sell long on orderbook - stake and sell short(via orderbook) to limit poten

### Dao Nominated pools/stratigies

The Dao will be responsible for deploying these composables at first, which any users will be able to create a tokenized position from. [the Dao]("www.seam.money/governance")

from here the dao will work towards integrating the the interface for the creation of these composables

### Seam Set Performance Assessments

Performance is based on this equation:

```math
Score(SeamSet) = (\frac{Performance_{fund}}{Performance_{max}}W_{performance}) + (\frac{AUM_{fund}}{AUM_{max}}W_{aum}) + (\frac{NOD_{fund}}{NOD_{max}}W_{nod})
```

The time duration for performance measure is applied for inception, 30 day, and 7 day windows.