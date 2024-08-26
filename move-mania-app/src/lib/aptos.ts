import { AptosAccount, AptosClient, BCS, CoinClient, FaucetClient, HexString, Network, Provider, TxnBuilderTypes } from "aptos";
import { BetData, CashOutData } from "./types";
import { User } from "./schema";
import { MagicAptosWallet } from "@magic-ext/aptos";
import { Account, Aptos, AptosConfig, Ed25519PrivateKey, MultiKeyAccount } from "@aptos-labs/ts-sdk";
import getConfig from "../envManager"
import { CHAIN_MODE, NETWORK_ID } from '@/constants'

const MODULE_NAME = 'crash';
const MODULE_ADDRESS = process.env.MODULE_ADDRESS
const CRASH_RESOURCE_ACCOUNT_ADDRESS = process.env.CRASH_RESOURCE_ACCOUNT_ADDRESS as string;
const LP_RESOURCE_ACCOUNT_ADDRESS = process.env.LP_RESOURCE_ACCOUNT_ADDRESS as string;
const Z_APT_RESOURCE_ACCOUNT_ADDRESS = process.env.Z_APT_RESOURCE_ACCOUNT_ADDRESS as string;

export const RPC_URL = 'https://fullnode.testnet.aptoslabs.com';
const FAUCET_URL = 'https://faucet.testnet.aptoslabs.com';

const client = new AptosClient(RPC_URL);
const coinClient = new CoinClient(client);
const provider = new Provider({
  fullnodeUrl: RPC_URL,
})

const aptosConfig = new AptosConfig({ network: NETWORK_ID });
const aptos = new Aptos(aptosConfig);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const faucetClient = new FaucetClient(RPC_URL, FAUCET_URL);

const TRANSACTION_OPTIONS = {
  max_gas_amount: '500000',
  gas_unit_price: '100',
};

const APT = 1_0000_0000;

async function getUserAccount(userPrivateKey: string) {
  return new AptosAccount(new HexString(userPrivateKey).toUint8Array());
}

export async function getBalance(userAddress: string, type: string) {
  const res = await provider.view({
    function: `0x1::coin::balance`,
    type_arguments: [type],
    arguments: [userAddress],
  })
  return parseInt(res[0].toString()) / APT;
}

export async function transferApt(userPrivateKey: string, amount: number, toAddress: string, type: string) {
  const aptosConfig = new AptosConfig({ network: Network.TESTNET }); // Adjust the network as needed
  const aptos = new Aptos(aptosConfig);

  const userWallet = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(userPrivateKey)
  });

  const fundingAccount = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(process.env.FUNDING_ACCOUNT_PRIVATE_KEY || '')
  });

  const transaction = await aptos.transaction.build.simple({
    sender: userWallet.accountAddress,
    withFeePayer: true,
    data: {
      function: `0x1::coin::transfer`,
      typeArguments: [type],
      functionArguments: [toAddress, Math.floor(amount * APT)],
    },
  });

  const senderAuthenticator = aptos.transaction.sign({ signer: userWallet, transaction });
  const feePayerSignerAuthenticator = aptos.transaction.signAsFeePayer({ signer: fundingAccount, transaction });

  const committedTransaction = await aptos.transaction.submit.simple({
    transaction,
    senderAuthenticator,
    feePayerAuthenticator: feePayerSignerAuthenticator,
  });

  const txResult = await aptos.transaction.waitForTransaction({ transactionHash: committedTransaction.hash });

  if (!txResult.success) return null;

  return {
    txnHash: txResult.hash,
    version: txResult.version,
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

export async function registerForZAPT(userWallet: Account) {
  const fundingAccount = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(process.env.FUNDING_ACCOUNT_PRIVATE_KEY || '')
  });

  const transaction = await aptos.transaction.build.simple({
    sender: userWallet.accountAddress,
    withFeePayer: true,
    data: {
      function: `${MODULE_ADDRESS}::z_apt::register`,
      typeArguments: [],
      functionArguments: [],
    },
  });

  const senderAuthenticator = aptos.transaction.sign({
    signer: userWallet,
    transaction,
  });
  const feePayerSignerAuthenticator = aptos.transaction.signAsFeePayer({
    signer: fundingAccount,
    transaction,
  });

  const committedTransaction = await aptos.transaction.submit.simple({
    transaction,
    senderAuthenticator,
    feePayerAuthenticator: feePayerSignerAuthenticator,
  });

  const txResult = await aptos.transaction.waitForTransaction({
    transactionHash: committedTransaction.hash,
  });

  if (!txResult.success) {
    return null;
  }

  return {
    txnHash: txResult.hash,
    version: txResult.version,
  };
}

export async function createAptosKeyPair(): Promise<{
  account: Account;
  public_address: string;
  private_key: string;
} | null> {
  try {
    const privateKey = Ed25519PrivateKey.generate();
    const account = Account.fromPrivateKey({ privateKey });
    const publicKey = account.publicKey;
    const address = account.accountAddress.toString();

    const fundingAccount = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(process.env.FUNDING_ACCOUNT_PRIVATE_KEY || '')
    });

    const transaction = await aptos.transaction.build.simple({
      sender: fundingAccount.accountAddress,
      data: {
        function: "0x1::aptos_account::create_account",
        typeArguments: [],
        functionArguments: [address],
      },
    });

    const senderAuthenticator = aptos.transaction.sign({ signer: fundingAccount, transaction });
    const committedTransaction = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator,
    });

    await aptos.transaction.waitForTransaction({ transactionHash: committedTransaction.hash });

    // Fund the account
    const fundTransaction = await aptos.transaction.build.simple({
      sender: fundingAccount.accountAddress,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [address, 1_0000_0000], // 1 APT
      },
    });

    const fundSenderAuthenticator = aptos.transaction.sign({ signer: fundingAccount, transaction: fundTransaction });
    const fundCommittedTransaction = await aptos.transaction.submit.simple({
      transaction: fundTransaction,
      senderAuthenticator: fundSenderAuthenticator,
    });

    await aptos.transaction.waitForTransaction({ transactionHash: fundCommittedTransaction.hash });

    await registerForZAPT(account);

    return {
      account,
      public_address: address,
      private_key: privateKey.toString(),
    };
  } catch (error) {
    console.error("Error creating Aptos key pair:", error);
    return null;
  }
}

async function fundAccountWithAdmin(userAccount: string, amount: number) {
  const adminAccount = await getUserAccount(process.env.ADMIN_ACCOUNT_PRIVATE_KEY || '');

  // const transfer = await coinClient.transfer(
  //   adminAccount,
  //   accountToFund,
  //   2500_0000,
  //   {
  //     createReceiverIfMissing: true,
  //   }
  // );
  // await client.waitForTransaction(transfer, { checkSuccess: true });
}

export async function fundAccountWithGas(userAddress: string) {
  console.log('funding account', userAddress);
  const fundingAccount = await getUserAccount(process.env.FUNDING_ACCOUNT_PRIVATE_KEY || '');
  const transfer = await coinClient.transfer(
    fundingAccount,
    userAddress,
    1000_0000,
    {
      createReceiverIfMissing: true,
    }
  );
  const fundTx = await client.waitForTransactionWithResult(transfer, { checkSuccess: true });
  console.log('fund', fundTx);
}

export async function mintZAPT(userAddress: string, amount: number) {
  const adminAccount = await getUserAccount(process.env.ADMIN_ACCOUNT_PRIVATE_KEY || '');

  const txn = await provider.generateTransaction(
    adminAccount.address(),
    {
      function: `${MODULE_ADDRESS}::z_apt::mint`,
      type_arguments: [],
      arguments: [
        Math.floor(amount * APT),
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

export async function placeBet(userPrivateKey: string, betData: BetData) {
  const userWallet = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(userPrivateKey)
  });

  const fundingAccount = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(process.env.FUNDING_ACCOUNT_PRIVATE_KEY || '')
  });

  const transaction = await aptos.transaction.build.simple({
    sender: userWallet.accountAddress,
    withFeePayer: true,
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::place_bet`,
      typeArguments: [],
      functionArguments: [Math.floor(betData.betAmount * APT)],
    },
  })

  const senderAuthenticator = aptos.transaction.sign({ signer: userWallet, transaction });
  const feePayerSignerAuthenticator = aptos.transaction.signAsFeePayer({ signer: fundingAccount, transaction });

  const committedTransaction = await aptos.transaction.submit.simple({
    transaction,
    senderAuthenticator,
    feePayerAuthenticator: feePayerSignerAuthenticator,
  });

  const txResult = await aptos.transaction.waitForTransaction({ transactionHash: committedTransaction.hash });

  if (!txResult.success) return null;

  return {
    txnHash: txResult.hash,
    version: txResult.version,
  };
}

export async function cashOut(userPrivateKey: string, cashOutData: CashOutData) {
  console.log("cashOut function called with:", { userPrivateKey: userPrivateKey.slice(0, 5) + '...', cashOutData });
  try {
    const userWallet = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(userPrivateKey)
    });

    const fundingAccount = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(process.env.FUNDING_ACCOUNT_PRIVATE_KEY || '')
    });

    const transaction = await aptos.transaction.build.simple({
      sender: userWallet.accountAddress,
      withFeePayer: true,
      data: {
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::cash_out`,
        typeArguments: [],
        functionArguments: [Math.floor(cashOutData.cashOutMultiplier * 100)],
      },
    });

    const senderAuthenticator = aptos.transaction.sign({ signer: userWallet, transaction });
    const feePayerSignerAuthenticator = aptos.transaction.signAsFeePayer({ signer: fundingAccount, transaction });

    const committedTransaction = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator,
      feePayerAuthenticator: feePayerSignerAuthenticator,
    });

    console.log("Transaction submitted:", committedTransaction.hash);

    const txResult = await aptos.transaction.waitForTransaction({ transactionHash: committedTransaction.hash });

    console.log("Transaction result:", txResult);

    if (!txResult.success) {
      console.error("Transaction failed:", txResult);
      return null;
    }

    return {
      txnHash: txResult.hash,
      version: txResult.version,
    };
  } catch (error) {
    console.error("Error in cashOut function:", error);
    throw error;
  }
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

  return parseInt(response[0].toString()) / APT;
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

  return parseInt(response[0].toString()) / APT;
}

export async function supplyPool(user: User, amount: number) {
  const userAccount = await getUserAccount(user.private_key);

  const txn = await provider.generateTransaction(
    userAccount.address(),
    {
      function: `${MODULE_ADDRESS}::liquidity_pool::supply_liquidity`,
      type_arguments: [],
      arguments: [
        Math.floor(amount * APT),
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
        Math.floor(amount * APT),
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
    const response = await fetch(`${RPC_URL}/accounts/44d6cd854567d0bb4fc23ee3df1cb7eec15fea87c8cb844713c6166982826715/events/5?limit=100`);
    const data = await response.json();
    return data;
  } catch (e) {
    console.error(e);
  }
}