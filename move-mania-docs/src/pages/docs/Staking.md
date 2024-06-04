import Bleed from 'nextra-theme-docs/bleed'

# Stake with Seam

Seam allows users to deploy and manage stake across multiple validators
 and transfer the ability to claim the stake deposit plus accrued yield(staking fees
 ## How you can deploy stake to validators with seam

 flow 1 - currated validator sets
    * user selects a stake period
    * deploy stake accross 4 high-performance validators(strong voting record) not at staking capacity
    motivations: user does not operate a validator
                user is uncomfortable deploying and managing stake via the CLI
                user would like to speculate 

 flow 2: user selected validator set
     - user stakes on validators of their choosing

    motivations: 
        - user operates validators and would like to optimize capital accross their set
        - user would like to adjust their exposure to staked asset


result: user holds a Token minted by the seam protocol which when transfered back 
 to the protocol is redemed for the initial stake and the stake fees generated during the duration 
 that they held the 
 
## After Staking

after a user has created the position above they are able to manage it the following ways

## claim rewards
in the aptos staking mechanism rewards are Distributed at the end of every epoch. At this time
 at this time users can claim their stake rewards with  

 
## sell staked position
    sell on the 'open market' - via our app or any nft marketplace
  sale formats:
                        * fixed price
                        * dutch auction (decending price auction,price lowers at a set rate, no time limit)
                        * traditional auction (buyer sets opening price and time limit)
    motivation:
            * staker no longer wants their funds tied up
            * staker believes current value of staked position is greater than the value at unlock

this sale could be denominated in any coin,
 but to pull apart the motivations of each party lets assume it was sold for the same asset that was staked

    result(original staker): staker created an mechanism to speculate on net value of staked asset + stake yield
    result(buyer): buyer now holds the right right to claim stake rewards, relock and claim the stake deposit at the end of the time lock


## conditionally sell position(portion or whole)
    the provider of stake would like to hedge their risk they can add a conditional on their stake deposit.
    some examples of conditions might be price of APT on a dex on aptos 



## Distributed staking
a mechanism to deploy stake across multiple validators via a single entry point and transfer the right to claim the stake deposit + stakin

Seam allows users to split stake deposits across multiple validators. 
This is ideal not only for decentralization of the network, but also also creates a more stable ROI for the 'staker' as rewards fluctuate with validator performance(voting performance)

reward rate on aptos
rewards_rate = Maximum possible reward * (Remaining lockup / Maximum lockup)

`Reward = Maximum possible reward * (Remaining lockup / Maximum lockup) * (Number of successful votes / Total number of blocks in the current epoch)`


This is done in the seam protocol through the use of the Owner-capability mechanism provided by the staking module.
 with this custodian model the seam protocol is able to mint a token(not a coin!) that bears the ownership of the staked APT.
  This is important because it allows the right to claim the stake deposit, plus accrued staking fees distributed by the [Aptos protocol](https://github.com/aptos-labs/aptos-core/tree/main/aptos-move)].


## Why stake with Seam?

Seam allows users to split stake deposits across multiple validators,
 and transfer the ability to claim the staked APT. 
This is ideal not only for decentralization of the network, but also also creates a more stable ROI for the 'staker',
and allows the user to stake any amount below the minimum stake requirements of a validator,
 or above the stake capacity of a single validator.
 as rewards fluctuate with validator performance and is dependent on its inclusion in the validator set

## Why is this better then liquid staking?
  liquid staking has become increasing more popular with even coinbase offering a liquid staked ETH asset.
  It makes sense that coinbase is able to do this because they are centralized and are able to adjust the amount
   ETH with funds seperate from those of buyers. They dont need 


## What is staking?

by staking your APT(aptos native coin) coins you help secure the network
 and earn rewards from the aptos protocol for doing so. More effective the validator you stake with is, 
 the higher the reward rate


## why stake instead of providing liquidity to a pool
LP fees in a single pool are inconsistent because volume exchanged in these pools can fluctuate wildly day to day
 in most cases when acting as an LP
staking is generally viewed as a safer option than providing liquidity for a pool since its dependent 
 on the security of the core of the chain

## what are the drawbacks of staking?

with a traditional staking mechanism a user cannot withdraw their funds at an instants' notice.
when staking within an L1 the staker has exposure to a single token and are unable to respond to impermenent loss accrued.

## What determines the APY of staking on aptos
    the stake fees accumulated by the are impacted by two things in the aptos ecosystem.
    1. number of successful votes cast
    2. the remaining lockup period
      
