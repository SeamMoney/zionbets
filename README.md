<p align="center">
  <img src="https://github.com/SeamMoney/zionbets/blob/main/move-mania-docs/src/images/zion_hero.png">
</p>

# Zion Bets: GambleFi on Aptos

## Introduction
Welcome to Zion Bets, a GambleFi project on the Aptos blockchain. Our platform is secured by on-chain randomness, offering a fast, transparent, and verifiable gambling experience.

## Features
- **Non-Custodial:** We never have access to user funds.
- **Transparent:** Users can always see and access our reserves.
- **Verifiable:** Public, unbiased, and verifiable random number generation.
- **Fast:** Ultra-fast betting.
- **Secure:** Audited MOVE contracts with built-in safety features.
- **Smooth Mobile UX:** Play and chat live with friends in a seamless mobile experience.

<p align="center">
  <img src="https://github.com/SeamMoney/zionbets/blob/main/move-mania-docs/src/images/zion_app_showcase.png">
</p>

## Modules
The `crash.move` module implements the core functionality of the crash game. It includes the following key functions:
- **initialize_game:** Sets up a new game with initial parameters.
- **place_bet:** Allows users to place bets on the current game.
- **generate_randomness:** Uses on-chain randomness to determine the crash point.
- **end_game:** Ends the current game, calculates outcomes, and distributes winnings.

The `liquidity_pool.move` module manages the liquidity pool for Zion Bets. Key functions include:
- **add_liquidity:** Allows users to add funds to the liquidity pool.
- **remove_liquidity:** Enables users to withdraw their funds from the pool.
- **calculate_payout:** Computes the payout for winning bets based on the current pool size.
- **distribute_fees:** Allocates a portion of game fees to the liquidity pool and the platform.
