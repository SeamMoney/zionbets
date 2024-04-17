import { AptosAccount, AptosClient, CoinClient, FaucetClient, HexString, Provider } from "aptos";
import { BetData, CashOutData } from "./types";
import { User } from "./schema";

const MODULE_ADDRESS = process.env.MODULE_ADDRESS as string;
const MODULE_NAME = 'crash';
const CRASH_RESOURCE_ACCOUNT_ADDRESS = process.env.CRASH_RESOURCE_ACCOUNT_ADDRESS as string;
const LP_RESOURCE_ACCOUNT_ADDRESS = process.env.LP_RESOURCE_ACCOUNT_ADDRESS as string;
const Z_APT_RESOURCE_ACCOUNT_ADDRESS = process.env.Z_APT_RESOURCE_ACCOUNT_ADDRESS as string;

export const RPC_URL = 'https://fullnode.devnet.aptoslabs.com';
const FAUCET_URL = 'https://faucet.devnet.aptoslabs.com';

const client = new AptosClient(RPC_URL);
const coinClient = new CoinClient(client);
const provider = new Provider({
  fullnodeUrl: RPC_URL,
  // indexerUrl: 'https://indexer.random.aptoslabs.com',
})

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

export async function transferApt(userPrivateKey: string, amount: number, toAddress: string, type: string) {
  const userAccount = await getUserAccount(userPrivateKey);

  const txn = await provider.generateTransaction(
    userAccount.address(),
    {
      function: `0x1::coin::transfer`,
      type_arguments: [type],
      arguments: [
        toAddress,
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

export async function registerForZAPT(userPrivateKey: string) {
  const userAccount = await getUserAccount(userPrivateKey);

  const txn = await provider.generateTransaction(
    userAccount.address(),
    {
      function: `${MODULE_ADDRESS}::z_apt::register`,
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
    1_0000_0000,
    {
      createReceiverIfMissing: true,
    }
  );
  const fundTx = await client.waitForTransactionWithResult(transfer, { checkSuccess: true });
  console.log('fund', fundTx);
}

export async function createAptosKeyPair(): Promise<{
  public_address: string;
  private_key: string;
} | null> {
  const wallet = new AptosAccount();
  const privateKey = wallet.toPrivateKeyObject().privateKeyHex;
  const publicKey = wallet.address();

  const adminAccount = await getUserAccount(process.env.ADMIN_ACCOUNT_PRIVATE_KEY || '');
  const fundingAccount = await getUserAccount(process.env.FUNDING_ACCOUNT_PRIVATE_KEY || '');

  // await faucetClient.fundAccount(publicKey, 1_0000, 5)
  // await registerForAPT(wallet);
  console.log('funding account', publicKey.toString());
  const transfer = await coinClient.transfer(
    fundingAccount,
    wallet,
    1_0000_0000,
    {
      createReceiverIfMissing: true,
    }
  );
  const fundTx = await client.waitForTransactionWithResult(transfer, { checkSuccess: true });
  console.log('fund', fundTx);
  // await sleep(5000);
  
  await registerForZAPT(privateKey);

  const txn = await provider.generateTransaction(
    adminAccount.address(),
    {
      function: `${MODULE_ADDRESS}::z_apt::mint`,
      type_arguments: [],
      arguments: [
        '100000000000',
        wallet.address()
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
    public_address: publicKey.toString(),
    private_key: privateKey,
  };
}

export async function mintZAPT(userPrivateKey: string, amount: number) {
  const userAccount = await getUserAccount(userPrivateKey);

  const adminAccount = await getUserAccount(process.env.ADMIN_ACCOUNT_PRIVATE_KEY || '');

  const txn = await provider.generateTransaction(
    adminAccount.address(),
    {
      function: `${MODULE_ADDRESS}::z_apt::mint`,
      type_arguments: [],
      arguments: [
        Math.floor(amount * APT),
        userAccount.address()
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

export async function placeBet(user: User, betData: BetData) {
  const userAccount = await getUserAccount(user.private_key);

  // await faucetClient.fundAccount(userAccount.address(), 10_0000_0000, 5)

  const placeBetTxn = await provider.generateTransaction(
    userAccount.address(),
    {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::place_bet`,
      type_arguments: [],
      arguments: [
        betData.betAmount * APT,
      ]
    },
    TRANSACTION_OPTIONS
  );

  const tx = await provider.signAndSubmitTransaction(userAccount, placeBetTxn);

  const txResult = await client.waitForTransactionWithResult(tx)

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

  const txResult = await client.waitForTransactionWithResult(tx)

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
  const res = await provider.getEventsByCreationNumber(
    '0x44d6cd854567d0bb4fc23ee3df1cb7eec15fea87c8cb844713c6166982826715',
    "5"
  );

  

  return res;
}

export async function simulateDeposit(user: User, amount: number) {
  try {
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

    const tx = await provider.simulateTransaction(
      userAccount,
      txn
    );

    // console.log(tx);

    let lp_coin_received = 0;

    tx[0].changes.forEach((change) => {
      
      if ((change as any).data && (change as any).data.type === `0x1::coin::CoinStore<${MODULE_ADDRESS}::liquidity_pool::LPCoin>`) {
        // console.log((change as any).data);
        // console.log((change as any).data.data.coin.value);
        lp_coin_received = parseInt((change as any).data.data.coin.value.toString()) / APT;
      }
    });

    return lp_coin_received - await getBalance(user.public_address, `0x1::coin::CoinStore<${MODULE_ADDRESS}::liquidity_pool::LPCoin>`);
  } catch (e) {
    console.error(e);
    return -1;
  }
}

export async function simulateWithdraw(user: User, amount: number) {
  try {
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

    const tx = await provider.simulateTransaction(
      userAccount,
      txn
    );

    // console.log(tx);

    let apt_received = 0;

    tx[0].changes.forEach((change) => {
      
      if ((change as any).data && (change as any).data.type === `0x1::coin::CoinStore<${MODULE_ADDRESS}::z_apt::ZAPT>`) {
        // console.log((change as any).data);
        // console.log((change as any).data.data.coin.value);
        apt_received = parseInt((change as any).data.data.coin.value.toString()) / APT;
      }
    });

    return apt_received - await getBalance(user.public_address, `${MODULE_ADDRESS}::z_apt::ZAPT`);
  } catch (e) {
    console.error(e);
    return -1;
  }
}