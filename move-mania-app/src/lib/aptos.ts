import { AptosAccount, AptosClient, BCS, CoinClient, FaucetClient, HexString, Network, Provider, TxnBuilderTypes } from "aptos";
import { BetData, CashOutData } from "./types";
import { User } from "./schema";
import { MagicAptosWallet } from "@magic-ext/aptos";
import { Account, Aptos, AptosConfig, Ed25519PrivateKey, MultiKeyAccount } from "@aptos-labs/ts-sdk";
import getConfig from "../envManager"
import {CHAIN_MODE, NETWORK_ID} from '@/constants'
// // require('dotenv').config();
// const {MODULE_ADDRESS,
//       CRASH_RESOURCE_ACCOUNT_ADDRESS,
//       LP_RESOURCE_ACCOUNT_ADDRESS,
//     Z_APT_RESOURCE_ACCOUNT_ADDRESS,
//     ADMIN_ACCOUNT_PRIVATE_KEY,
//     CHAIN_MODE,
//   NODE_URL}  = getConfig()
const MODULE_NAME = 'crash';
// const CHAIN_MODE = process.env.CHAIN_MODE as string
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

const aptosConfig = new AptosConfig({ network: NETWORK_ID }); // default to devnet
const aptos = new Aptos(aptosConfig);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


const faucetClient = new FaucetClient(
  RPC_URL,
  FAUCET_URL
);

const TRANSACTION_OPTIONS = {
  max_gas_amount: '500000',
  gas_unit_price: '100',
};

const APT = 1_0000_0000;

async function getUserAccount(userPrivateKey: string) {
  return new AptosAccount(
    new HexString(userPrivateKey).toUint8Array()
  );
}

export async function getBalance(userAddress: string, type: string) {
  const res = await provider.view({
    function: `0x1::coin::balance`,
    type_arguments: [type],
    arguments: [userAddress],
  })

  return parseInt(res[0].toString()) / APT;

}

export async function transferApt(userWallet: Account, amount: number, toAddress: string, type: string) {
  // const token = new TxnBuilderTypes.TypeTagStruct(
  //   TxnBuilderTypes.StructTag.fromString(type)
  // );
  // const payload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
  //   TxnBuilderTypes.EntryFunction.natural(
  //     "0x1::coin",
  //     "transfer",
  //     [token],
  //     [
  //       BCS.bcsToBytes(
  //         TxnBuilderTypes.AccountAddress.fromHex(toAddress)
  //       ),
  //       BCS.bcsSerializeUint64(Math.floor(amount * APT)),
  //     ]
  //   )
  // );

  // const { hash } = await userWallet.signAndSubmitBCSTransaction(payload);

  // const txResult = await client.waitForTransactionWithResult(hash);

  const fundingAccount = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(process.env.FUNDING_ACCOUNT_PRIVATE_KEY || '')
  });

  const transaction = await aptos.transaction.build.simple({
    sender: userWallet.accountAddress,
    withFeePayer: true,
    data: {
      function: `0x1::coin::transfer`,
      typeArguments: [type],
      functionArguments: [
        toAddress,
        Math.floor(amount * APT),
      ],
    },
  })

  // sign transaction
  const senderAuthenticator = aptos.transaction.sign({
    signer: userWallet,
    transaction,
  });

  const feePayerSignerAuthenticator = aptos.transaction.signAsFeePayer({
    signer: fundingAccount,
    transaction,
  });

  // submit transaction
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

  // const payload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
  //   TxnBuilderTypes.EntryFunction.natural(
  //     `${MODULE_ADDRESS}::z_apt`,
  //     "register",
  //     [],
  //     []
  //   )
  // );

  // // const txn = await provider.generateTransaction(
  // //   userAccount.address(),
  // //   {
  // //     function: `${MODULE_ADDRESS}::z_apt::register`,
  // //     type_arguments: [],
  // //     arguments: [],
  // //   },
  // //   TRANSACTION_OPTIONS
  // // );

  // const { hash } = await userWallet.

  // const txResult = await client.waitForTransactionWithResult(hash);

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
  })

  // sign transaction
  const senderAuthenticator = aptos.transaction.sign({
    signer: userWallet,
    transaction,
  });
  const feePayerSignerAuthenticator = aptos.transaction.signAsFeePayer({
    signer: fundingAccount,
    transaction,
  });
  // submit transaction
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

// export async function createAptosKeyPair(): Promise<{
//   public_address: string;
//   private_key: string;
// } | null> {
//   const wallet = new AptosAccount();
//   const privateKey = wallet.toPrivateKeyObject().privateKeyHex;
//   const publicKey = wallet.address();

//   const adminAccount = await getUserAccount(process.env.ADMIN_ACCOUNT_PRIVATE_KEY || '');
//   const fundingAccount = await getUserAccount(process.env.FUNDING_ACCOUNT_PRIVATE_KEY || '');

//   // await faucetClient.fundAccount(publicKey, 1_0000, 5)
//   // await registerForAPT(wallet);
//   console.log('funding account', publicKey.toString());
//   const transfer = await coinClient.transfer(
//     fundingAccount,
//     wallet,
//     1_0000_0000,
//     {
//       createReceiverIfMissing: true,
//     }
//   );
//   const fundTx = await client.waitForTransactionWithResult(transfer, { checkSuccess: true });
//   console.log('fund', fundTx);
//   // await sleep(5000);
  
//   await registerForZAPT(privateKey);

//   const txn = await provider.generateTransaction(
//     adminAccount.address(),
//     {
//       function: `${MODULE_ADDRESS}::z_apt::mint`,
//       type_arguments: [],
//       arguments: [
//         '100000000000',
//         wallet.address()
//       ],
//     },
//     TRANSACTION_OPTIONS
//   );

//   const tx = await provider.signAndSubmitTransaction(adminAccount, txn);

//   const txResult = await client.waitForTransactionWithResult(tx);

//   if (!(txResult as any).success) {
//     return null;
//   }

//   return {
//     public_address: publicKey.toString(),
//     private_key: privateKey,
//   };
// }

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

export async function quickRemoveGame() {
  const adminAccount = await getUserAccount(process.env.ADMIN_ACCOUNT_PRIVATE_KEY || '');

  const txn = await provider.generateTransaction(
    adminAccount.address(),
    {
      function: `${MODULE_ADDRESS}::crash::hackathon_remove_game`,
      type_arguments: [],
      arguments: [],
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

export async function placeBet(userWallet: Account, betData: BetData) {

  // await faucetClient.fundAccount(userAccount.address(), 10_0000_0000, 5)

  // const payload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
  //   TxnBuilderTypes.EntryFunction.natural(
  //     `${MODULE_ADDRESS}::${MODULE_NAME}`,
  //     "place_bet",
  //     [],
  //     [
  //       BCS.bcsSerializeUint64(Math.floor(betData.betAmount * APT)),
  //     ]
  //   )
  // );

  // const { hash } = await userWallet.signAndSubmitBCSTransaction(payload);

  // const txResult = await client.waitForTransactionWithResult(hash);

  const fundingAccount = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(process.env.FUNDING_ACCOUNT_PRIVATE_KEY || '')
  });

  const transaction = await aptos.transaction.build.simple({
    sender: userWallet.accountAddress,
    withFeePayer: true,
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::place_bet`,
      typeArguments: [],
      functionArguments: [
        Math.floor(betData.betAmount * APT),
      ],
    },
  })

  // sign transaction
  const senderAuthenticator = aptos.transaction.sign({
    signer: userWallet,
    transaction,
  });
  const feePayerSignerAuthenticator = aptos.transaction.signAsFeePayer({
    signer: fundingAccount,
    transaction,
  });

  // submit transaction
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

export async function cashOut(userWallet: Account, cashOutData: CashOutData) {

  // const payload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
  //   TxnBuilderTypes.EntryFunction.natural(
  //     `${MODULE_ADDRESS}::${MODULE_NAME}`,
  //     "cash_out",
  //     [],
  //     [
  //       BCS.bcsSerializeUint64(Math.floor(cashOutData.cashOutMultiplier * 100)),
  //     ]
  //   )
  // );

  // const { hash } = await userWallet.signAndSubmitBCSTransaction(payload);

  // const txResult = await client.waitForTransactionWithResult(hash);

  const fundingAccount = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(process.env.FUNDING_ACCOUNT_PRIVATE_KEY || '')
  });
  const adminAccount = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(process.env.ADMIN_ACCOUNT_PRIVATE_KEY || '')
  });

  const transaction = await aptos.transaction.build.simple({
    sender: adminAccount.accountAddress,
    withFeePayer: true,
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::cash_out`,
      typeArguments: [],
      functionArguments: [
        userWallet.accountAddress,
        Math.floor(cashOutData.cashOutMultiplier * 100),
      ],
    },
  })

  // sign transaction
  const senderAuthenticator = aptos.transaction.sign({
    signer: adminAccount,
    transaction,
  });

  const feePayerSignerAuthenticator = aptos.transaction.signAsFeePayer({
    signer: fundingAccount,
    transaction,
  });

  // submit transaction
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

export async function getDeposits() {
  try {
    const response = await provider.getEventsByEventHandle(
      LP_RESOURCE_ACCOUNT_ADDRESS,
      `${MODULE_ADDRESS}::liquidity_pool::State`,
      'deposit_events',
      {
        limit: 100, 
      }
    );
  
    
  
    return response;
  } catch (e) {
    console.error(e);
  }
}

export async function getWithdrawals() {
  try {
    const response = await provider.getEventsByEventHandle(
      LP_RESOURCE_ACCOUNT_ADDRESS,
      `${MODULE_ADDRESS}::liquidity_pool::State`,
      'withdraw_events',
      {
        limit: 100, 
      }
    );
  
    
  
    return response;
  } catch (e) {
    console.error(e);
  }
}

export async function getExtracts() {
  try {
    const response = await provider.getEventsByEventHandle(
      LP_RESOURCE_ACCOUNT_ADDRESS,
      `${MODULE_ADDRESS}::liquidity_pool::State`,
      'extract_events',
      {
        limit: 100, 
      }
    );
  
    
  
    return response;
  } catch (e) {
    console.error(e);
  }
}

export async function getPuts() {
  try {
    const response = await provider.getEventsByEventHandle(
      LP_RESOURCE_ACCOUNT_ADDRESS,
      `${MODULE_ADDRESS}::liquidity_pool::State`,
      'put_events',
      {
        limit: 100, 
      }
    );
  
    
  
    return response;
  } catch (e) {
    console.error(e);
  }
}

export async function getLocks() {
  try {
    const response = await provider.getEventsByEventHandle(
      LP_RESOURCE_ACCOUNT_ADDRESS,
      `${MODULE_ADDRESS}::liquidity_pool::State`,
      'lock_events',
      {
        limit: 100, 
      }
    );
  
    
  
    return response;
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

  

  return parseInt(response[0].toString()) / APT
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

  

  return parseInt(response[0].toString()) / APT
}

export async function supplyPool(userWallet: MagicAptosWallet, amount: number) {

  const payload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
    TxnBuilderTypes.EntryFunction.natural(
      `${MODULE_ADDRESS}::liquidity_pool`,
      "supply_liquidity",
      [],
      [
        BCS.bcsSerializeUint64(Math.floor(amount * APT)),
      ]
    )
  );

  const { hash } = await userWallet.signAndSubmitBCSTransaction(payload);

  const txResult = await client.waitForTransactionWithResult(hash);

  if (!(txResult as any).success) {
    return null;
  }

  return {
    txnHash: txResult.hash,
    version: (txResult as any).version,
  };
}

export async function withdrawPool(userWallet: MagicAptosWallet, amount: number) {
  const payload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
    TxnBuilderTypes.EntryFunction.natural(
      `${MODULE_ADDRESS}::liquidity_pool`,
      "withdraw_liquidity",
      [],
      [
        BCS.bcsSerializeUint64(Math.floor(amount * APT)),
      ]
    )
  );

  const { hash } = await userWallet.signAndSubmitBCSTransaction(payload);

  const txResult = await client.waitForTransactionWithResult(hash);

  if (!(txResult as any).success) {
    return null;
  }

  return {
    txnHash: txResult.hash,
    version: (txResult as any).version,
  };
}



export async function getCrashCalculationEvents() {
  const res = await provider.getEventsByCreationNumber(
    '0x44d6cd854567d0bb4fc23ee3df1cb7eec15fea87c8cb844713c6166982826715',
    "5"
  );

  

  return res;
}

export async function simulateDeposit(userWallet: MagicAptosWallet, amount: number) {

  return 0;

  // try {
  //   const payload = new TxnBuilderTypes.TransactionPayloadEntryFunction( 
  //     TxnBuilderTypes.EntryFunction.natural(
  //       `${MODULE_ADDRESS}::liquidity_pool`,
  //       "deposit",
  //       [],
  //       [
  //         BCS.bcsSerializeUint64(Math.floor(amount * APT)),
  //       ]
  //     )
  //   );

  //   const txn = await provider.generateTransaction(
  //     userAccount.address(),
  //     {
  //       function: `${MODULE_ADDRESS}::liquidity_pool::supply_liquidity`,
  //       type_arguments: [],
  //       arguments: [
  //         Math.floor(amount * APT),
  //       ],
  //     },
  //     TRANSACTION_OPTIONS
  //   );

  //   const tx = await provider.simulateTransaction(
  //     userAccount,
  //     txn
  //   );

  //   // console.log(tx);

  //   let lp_coin_received = 0;

  //   tx[0].changes.forEach((change) => {
      
  //     if ((change as any).data && (change as any).data.type === `0x1::coin::CoinStore<${MODULE_ADDRESS}::liquidity_pool::LPCoin>`) {
  //       // console.log((change as any).data);
  //       // console.log((change as any).data.data.coin.value);
  //       lp_coin_received = parseInt((change as any).data.data.coin.value.toString()) / APT;
  //     }
  //   });

  //   return lp_coin_received - await getBalance(user.public_address, `0x1::coin::CoinStore<${MODULE_ADDRESS}::liquidity_pool::LPCoin>`);
  // } catch (e) {
  //   console.error(e);
  //   return -1;
  // }
}

export async function simulateWithdraw(userWallet: MagicAptosWallet, amount: number) {
  return 0;
  // try {
  //   const userAccount = await getUserAccount(user.private_key);

  //   const txn = await provider.generateTransaction(
  //     userAccount.address(),
  //     {
  //       function: `${MODULE_ADDRESS}::liquidity_pool::remove_liquidity`,
  //       type_arguments: [],
  //       arguments: [
  //         Math.floor(amount * APT),
  //       ],
  //     },
  //     TRANSACTION_OPTIONS
  //   );

  //   const tx = await provider.simulateTransaction(
  //     userAccount,
  //     txn
  //   );

  //   // console.log(tx);

  //   let apt_received = 0;

  //   tx[0].changes.forEach((change) => {
      
  //     if ((change as any).data && (change as any).data.type === `0x1::coin::CoinStore<${MODULE_ADDRESS}::z_apt::ZAPT>`) {
  //       // console.log((change as any).data);
  //       // console.log((change as any).data.data.coin.value);
  //       apt_received = parseInt((change as any).data.data.coin.value.toString()) / APT;
  //     }
  //   });

  //   return apt_received - await getBalance(user.public_address, `${MODULE_ADDRESS}::z_apt::ZAPT`);
  // } catch (e) {
  //   console.error(e);
  //   return -1;
  // }
}