import { AptosAccount, AptosClient, BCS, CoinClient, FaucetClient, HexString, Network, Provider, TxnBuilderTypes } from "aptos";
import { BetData, CashOutData } from "./types";
import { User } from "./schema";

import { Account, Aptos, AptosConfig, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { Module } from "module";

const MODULE_ADDRESS = process.env.MODULE_ADDRESS as string;
const MODULE_NAME = 'crash';
const CRASH_RESOURCE_ACCOUNT_ADDRESS = process.env.CRASH_RESOURCE_ACCOUNT_ADDRESS as string;
const LP_RESOURCE_ACCOUNT_ADDRESS = process.env.LP_RESOURCE_ACCOUNT_ADDRESS as string;
const Z_APT_RESOURCE_ACCOUNT_ADDRESS = process.env.Z_APT_RESOURCE_ACCOUNT_ADDRESS as string;

export const APTOS_URL = 'https://fullnode.devnet.aptoslabs.com';
export const MOVEMENT_URL = 'https://aptos.devnet.m1.movementlabs.xyz';
const MODE = process.env.MODE as string || 'Movement';
// const NODE_URL = MODE === 'Movement' ? MOVEMENT_URL : APTOS_URL;
const NODE_URL = MOVEMENT_URL;
const FAUCET_URL = 'https://faucet.devnet.aptoslabs.com';

const client = new AptosClient(NODE_URL);
const coinClient = new CoinClient(client);
const provider = new Provider({
  fullnodeUrl: NODE_URL,
})
const config = new AptosConfig({ fullnode: NODE_URL});
const aptos = new Aptos(config);

const balances = aptos.account.getAccountCoinsData({accountAddress:MODULE_ADDRESS}).then((data) => {
    console.log("Data", data);
    return data;
    });
// console.log("Balances", balances);