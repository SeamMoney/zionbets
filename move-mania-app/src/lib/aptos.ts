import { AptosAccount, AptosClient, CoinClient, FaucetClient, HexString, Provider, TxnBuilderTypes } from "aptos";
import { BetData, CashOutData } from "./types";
import { User } from "./schema";
import getConfig from "../envManager";
import { CHAIN_MODE, NETWORK_ID } from '@/constants';

const {
  MODULE_ADDRESS,
  CRASH_RESOURCE_ACCOUNT_ADDRESS,
  LP_RESOURCE_ACCOUNT_ADDRESS,
  G_MOVE_RESOURCE_ACCOUNT_ADDRESS,
  ADMIN_ACCOUNT_PRIVATE_KEY,
} = getConfig();

const MODULE_NAME = 'crash';

export const RPC_URL = 'https://aptos.testnet.suzuka.movementlabs.xyz/v1';
const FAUCET_URL = 'https://aptos.testnet.suzuka.movementlabs.xyz/v1';

const client = new AptosClient(RPC_URL);
const coinClient = new CoinClient(client);
const provider = new Provider({
  fullnodeUrl: RPC_URL,
});

const TRANSACTION_OPTIONS = {
  max_gas_amount: '500000',
  gas_unit_price: '100',
};

const MOVE = 1_0000_0000;

async function getUserAccount(userPrivateKey: string) {
  return new AptosAccount(
    new HexString(userPrivateKey).toUint8Array()
  );
}

export async function getBalance(userPrivateKey: string, type: string) {
  const userAccount = await getUserAccount(userPrivateKey);
  const res = await provider.view({
    function: `0x1::coin::balance`,
    type_arguments: [type],
    arguments: [userAccount.address().toString()],
  });

  return parseInt(res[0].toString()) / MOVE;
}

export async function transferApt(userPrivateKey: string, amount: number, toAddress: string, type: string) {
  const userAccount = await getUserAccount(userPrivateKey);

  const txn = await provider.generateTransaction(
    userAccount.address(),
    {
      function: `0x1::coin::transfer`,
      type_arguments: [type],
      arguments: [
        toAddress,
        Math.floor(amount * MOVE),
      ],
    },
    TRANSACTION_OPTIONS
  );

  const tx = await provider.signAndSubmitTransaction(userAccount, txn);

  const txResult = await client.waitForTransactionWithResult(tx);

  if (!(txResult as any).success) {
    return null;
  }

  return {
    txnHash: txResult.hash,
    version: (txResult as any).version,
  };
}

export async function registerForAPT(userAccount: AptosAccount) {
  const txn = await provider.generateTransaction(
    userAccount.address(),
    {
      function: `0x01::managed_coin::register`,
      type_arguments: ['0x1::aptos_coin::AptosCoin'],
      arguments: [],
    },
    TRANSACTION_OPTIONS
  );

  const tx = await provider.signAndSubmitTransaction(userAccount, txn);

  const txResult = await client.waitForTransactionWithResult(tx);

  if (!(txResult as any).success) {
    return null;
  }

  return {
    txnHash: txResult.hash,
    version: (txResult as any).version,
  };
}

export async function registerForGMOVE(userPrivateKey: string) {
  const userAccount = await getUserAccount(userPrivateKey);

  const txn = await provider.generateTransaction(
    userAccount.address(),
    {
      function: `${MODULE_ADDRESS}::g_move::register`,
      type_arguments: [],
      arguments: [],
    },
    TRANSACTION_OPTIONS
  );

  const tx = await provider.signAndSubmitTransaction(userAccount, txn);

  const txResult = await client.waitForTransactionWithResult(tx);

  if (!(txResult as any).success) {
    return null;
  }

  return {
    txnHash: txResult.hash,
    version: (txResult as any).version,
  };
}

export async function createAptosKeyPair(): Promise<{
  public_address: string;
  private_key: string;
} | null> {
  const wallet = new AptosAccount();
  const privateKey = wallet.toPrivateKeyObject().privateKeyHex;
  const publicKey = wallet.address();

  const fundingAccount = await getUserAccount(process.env.FUNDING_ACCOUNT_PRIVATE_KEY || '');

  const transfer = await coinClient.transfer(
    fundingAccount,
    wallet,
    1_0000_0000,
    {
      createReceiverIfMissing: true,
    }
  );
  const fundTx = await client.waitForTransactionWithResult(transfer, { checkSuccess: true });

  await registerForGMOVE(privateKey);

  return {
    public_address: publicKey.toString(),
    private_key: privateKey,
  };
}

export async function mintGMOVE(userAddress: string, amount: number) {
  const adminAccount = await getUserAccount(process.env.ADMIN_ACCOUNT_PRIVATE_KEY || '');

  const txn = await provider.generateTransaction(
    adminAccount.address(),
    {
      function: `${MODULE_ADDRESS}::g_move::mint`,
      type_arguments: [],
      arguments: [
        Math.floor(amount * MOVE),
        userAddress
      ],
    },
    TRANSACTION_OPTIONS
  );

  const tx = await provider.signAndSubmitTransaction(adminAccount, txn);

  const txResult = await client.waitForTransactionWithResult(tx);

  if (!(txResult as any).success) {
    return null;
  }

  return {
    txnHash: txResult.hash,
    version: (txResult as any).version,
  };
}

export async function placeBet(user: User, betData: BetData) {
  const userAccount = await getUserAccount(user.private_key);

  const placeBetTxn = await provider.generateTransaction(
    userAccount.address(),
    {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::place_bet`,
      type_arguments: [],
      arguments: [
        betData.betAmount * MOVE,
      ]
    },
    TRANSACTION_OPTIONS
  );

  const tx = await provider.signAndSubmitTransaction(userAccount, placeBetTxn);

  const txResult = await client.waitForTransactionWithResult(tx);

  if (!(txResult as any).success) {
    return null;
  }

  return {
    txnHash: txResult.hash,
    version: (txResult as any).version,
  };
}

export async function cashOut(user: User, cashOutData: CashOutData) {
  const userAccount = await getUserAccount(user.private_key);

  const cashOutTxn = await provider.generateTransaction(
    userAccount.address(),
    {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::cash_out`,
      type_arguments: [],
      arguments: [
        Math.floor(cashOutData.cashOutMultiplier * 100)
      ]
    },
    TRANSACTION_OPTIONS
  );

  const tx = await provider.signAndSubmitTransaction(userAccount, cashOutTxn);

  const txResult = await client.waitForTransactionWithResult(tx);

  if (!(txResult as any).success) {
    return null;
  }

  return {
    txnHash: txResult.hash,
    version: (txResult as any).version,
  };
}

export async function getDeposits() {
  try {
    const response = await fetch(`${RPC_URL}/accounts/${LP_RESOURCE_ACCOUNT_ADDRESS}/events/${MODULE_ADDRESS}::liquidity_pool::State/deposit_events?limit=100`);
    const data = await response.json();
    return data;
  } catch (e) {
    console.error(e);
  }
}

export async function getWithdrawals() {
  try {
    const response = await fetch(`${RPC_URL}/accounts/${LP_RESOURCE_ACCOUNT_ADDRESS}/events/${MODULE_ADDRESS}::liquidity_pool::State/withdraw_events?limit=100`);
    const data = await response.json();
    return data;
  } catch (e) {
    console.error(e);
  }
}

export async function getExtracts() {
  try {
    const response = await fetch(`${RPC_URL}/accounts/${LP_RESOURCE_ACCOUNT_ADDRESS}/events/${MODULE_ADDRESS}::liquidity_pool::State/extract_events?limit=100`);
    const data = await response.json();
    return data;
  } catch (e) {
    console.error(e);
  }
}

export async function getPuts() {
  try {
    const response = await fetch(`${RPC_URL}/accounts/${LP_RESOURCE_ACCOUNT_ADDRESS}/events/${MODULE_ADDRESS}::liquidity_pool::State/put_events?limit=100`);
    const data = await response.json();
    return data;
  } catch (e) {
    console.error(e);
  }
}

export async function getLocks() {
  try {
    const response = await fetch(`${RPC_URL}/accounts/${LP_RESOURCE_ACCOUNT_ADDRESS}/events/${MODULE_ADDRESS}::liquidity_pool::State/lock_events?limit=100`);
    const data = await response.json();
    return data;
  } catch (e) {
    console.error(e);
  }
}

export async function getPoolAptSupply(version?: string) {
  const response = await provider.view(
    {
      function: `${MODULE_ADDRESS}::liquidity_pool::get_pool_supply`,
      type_arguments: [],
      arguments: [],
    },
    version
  );

  return response;
}

export async function getLPCoinSupply(version?: string) {
  const response = await provider.view(
    {
      function: `${MODULE_ADDRESS}::liquidity_pool::get_lp_coin_supply`,
      type_arguments: [],
      arguments: [],
    },
    version
  );

  return parseInt(response[0].toString()) / MOVE;
}

export async function getLockedLPCoinSupply(version?: string) {
  const response = await provider.view(
    {
      function: `${MODULE_ADDRESS}::liquidity_pool::get_amount_of_locked_liquidity`,
      type_arguments: [],
      arguments: [],
    },
    version
  );

  return parseInt(response[0].toString()) / MOVE;
}

export async function supplyPool(user: User, amount: number) {
  const userAccount = await getUserAccount(user.private_key);

  const txn = await provider.generateTransaction(
    userAccount.address(),
    {
      function: `${MODULE_ADDRESS}::liquidity_pool::supply_liquidity`,
      type_arguments: [],
      arguments: [
        Math.floor(amount * MOVE),
      ],
    },
    TRANSACTION_OPTIONS
  );

  const tx = await provider.signAndSubmitTransaction(userAccount, txn);

  const txResult = await client.waitForTransactionWithResult(tx);

  if (!(txResult as any).success) {
    return null;
  }

  return {
    txnHash: txResult.hash,
    version: (txResult as any).version,
  };
}

export async function withdrawPool(user: User, amount: number) {
  const userAccount = await getUserAccount(user.private_key);

  const txn = await provider.generateTransaction(
    userAccount.address(),
    {
      function: `${MODULE_ADDRESS}::liquidity_pool::remove_liquidity`,
      type_arguments: [],
      arguments: [
        Math.floor(amount * MOVE),
      ],
    },
    TRANSACTION_OPTIONS
  );

  const tx = await provider.signAndSubmitTransaction(userAccount, txn);

  const txResult = await client.waitForTransactionWithResult(tx);

  if (!(txResult as any).success) {
    return null;
  }

  return {
    txnHash: txResult.hash,
    version: (txResult as any).version,
  };
}

export async function getCrashCalculationEvents() {
  try {
    const response = await fetch(`${RPC_URL}/accounts/a7930d58b5ab4d61c7ffa7c0b9255094fde5f62b6c4cf7ef7b84606f5c26b7cd/events/5?limit=100`);
    const data = await response.json();
    return data;
  } catch (e) {
    console.error(e);
  }
}