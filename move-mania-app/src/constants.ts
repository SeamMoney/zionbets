import {Network} from "@aptos-labs/ts-sdk";
export const CHAIN_MODE = "testnet"
export const NODE_URL = "https://fullnode.testnet.aptoslabs.com"
export const FAUCET_URL = "https://faucet.testnet.aptoslabs.com"
export const NETWORK_ID = CHAIN_MODE==='testnet' ? Network.TESTNET : Network.DEVNET