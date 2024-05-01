// 
//  this file contains functions that are used to calculate the overall stats of a user

// import { AptosAccount, AptosClient, HexString, Provider, Network } from "aptos";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
require('dotenv').config();

const MODULE_ADDRESS = process.env.MODULE_ADDRESS as string;
const CRASH_RESOURCE_ACCOUNT_ADDRESS = process.env.CRASH_RESOURCE_ACCOUNT_ADDRESS as string;
const LP_RESOURCE_ACCOUNT_ADDRESS = process.env.LP_RESOURCE_ACCOUNT_ADDRESS as string;
const Z_APT_RESOURCE_ACCOUNT_ADDRESS = process.env.Z_APT_RESOURCE_ACCOUNT_ADDRESS as string;
const ADMIN_ACCOUNT_PRIVATE_KEY = process.env.ADMIN_ACCOUNT_PRIVATE_KEY as string;

const RPC_URL = 'https://fullnode.devnet.aptoslabs.com';
const FAUCET_URL = 'https://faucet.devnet.aptoslabs.com'

const aptos = new Aptos(new AptosConfig({network: Network.DEVNET}));  // Only devnet supported as of now.

export const getUserBets = async (address: string) => {
    const bets = await aptos.getAccountEventsByEventType({
        accountAddress: address,
        eventType: `${MODULE_ADDRESS}::crash::BetPlacedEvent`,
    })
    console.log(bets);
    return bets;
}

export const getUserCashOuts = async (address: string) => {
    const cashOuts = await aptos.getAccountEventsByEventType({
        accountAddress: address,
        eventType: `${MODULE_ADDRESS}::crash::CashOutEvent`,
    })
    return cashOuts;
}

export const getUserStats = async (address: string) => {
    const bets = await getUserBets(address);
    const cashOuts = await getUserCashOuts(address);

    let totalBets = 0;
    let totalCashOuts = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let totalWinnings = 0;

    for (let i = 0; i < bets.length; i++) {
        const bet = bets[i];
        totalBets += bet.data.amount;
        totalWinnings += bet.data.winnings;
    }

    for (let i = 0; i < cashOuts.length; i++) {
        const cashOut = cashOuts[i];
        totalCashOuts += cashOut.data.amount;
    }

    totalProfit = totalWinnings - totalBets;
    totalLoss = totalBets - totalCashOuts;

    return {
        totalBets,
        totalCashOuts,
        totalProfit,
        totalLoss,
        totalWinnings
    }
}

