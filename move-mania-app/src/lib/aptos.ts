import { AptosAccount, AptosClient, FaucetClient, HexString, Provider } from "aptos";
import { BetData, CashOutData } from "./types";
import { User } from "./schema";
import { magic } from "./magic";

const MODULE_NAME = 'crash';
const MODULE_ADDRESS = '0x840ccdef3d9c4b7c076a392d79bf2a87b9c3b6ed7b7f05f7b505df55f5f16cf6';
const CRASH_RESOURCE_ACCOUNT_ADDRESS = '0x08804824aa3bde0b407697347490b3e34a58a1b85938bfa9748ecd12e8acc838';
const LP_RESOURCE_ACCOUNT_ADDRESS = '0x45f9120e1bf29e2c8733984b77fb54b430d4497a6caf286130e0f40450e01f2f'
const Z_APT_RESOURCE_ACCOUNT_ADDRESS = '0x76b9bf86be7a219edd280b385570486242be3099d8b6f8533206516db7646aab';
const ADMIN_ACCOUNT_PRIVATE_KEY = '0xf7ed930cbe0223b922803207723162f4691eac6431b59bf1129806f340050788';

export const RPC_URL = 'https://fullnode.random.aptoslabs.com';
const FAUCET_URL = 'https://faucet.random.aptoslabs.com';

const client = new AptosClient(RPC_URL);
const provider = new Provider({
  fullnodeUrl: RPC_URL,
  // indexerUrl: 'https://indexer.random.aptoslabs.com',
})

const faucetClient = new FaucetClient(
  RPC_URL,
  FAUCET_URL
);

const TRANSACTION_OPTIONS = {
  max_gas_amount: '500000',
  gas_unit_price: '100',
};

const APT = 1_0000_0000;

function getAdminAccount() {
  return new AptosAccount(
    new HexString(ADMIN_ACCOUNT_PRIVATE_KEY).toUint8Array()
  );
}

export async function getBalance(address: string, type: string) {
  const res = await provider.view({
    function: `0x1::coin::balance`,
    type_arguments: [type],
    arguments: [address],
  })
  console.log('res: ', res);

  return parseInt(res[0].toString()) / APT;

}

export async function transferCoin(userInfo: User, amount: number, toAddress: string, type: string) {

  if (!magic) {
    return null;
  }

  const txn = await provider.generateTransaction(
    userInfo.address,
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

  const tx = await magic.aptos.signTransaction(userInfo.address, txn as any);

  const txResult = await client.waitForTransactionWithResult(
    new TextDecoder().decode(tx)
  );

  console.log(txResult);

  if (!(txResult as any).success) {
    return null;
  }

  return {
    txnHash: txResult.hash,
    version: (txResult as any).version,
  };

}

export async function fundAccountWithGas(publicAddress: string) {
  await faucetClient.fundAccount(publicAddress, 1_0000_0000, 5)
}

export async function mintUserZAPT(publicAddress: string, amount: number) {
  const adminWallet = getAdminAccount();

  const txn = await provider.generateTransaction(
    adminWallet.address(),
    {
      function: `${MODULE_ADDRESS}::z_apt::actual_mint`,
      type_arguments: [],
      arguments: [
        Math.floor(amount * APT),
        publicAddress
      ],
    },
    TRANSACTION_OPTIONS
  );

  const tx = await provider.signAndSubmitTransaction(adminWallet, txn);

  const txResult = await client.waitForTransactionWithResult(tx);

  console.log(txResult);

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

  await faucetClient.fundAccount(publicKey, 1_0000_0000, 5)

  const txn = await provider.generateTransaction(
    wallet.address(),
    {
      function: `${MODULE_ADDRESS}::z_apt::actual_mint`,
      type_arguments: [],
      arguments: [
        '10000000000'
      ],
    },
    TRANSACTION_OPTIONS
  );

  const tx = await provider.signAndSubmitTransaction(wallet, txn);

  const txResult = await client.waitForTransactionWithResult(tx);

  console.log(txResult);

  if (!(txResult as any).success) {
    return null;
  }

  return {
    public_address: publicKey.toString(),
    private_key: privateKey,
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

  const txResult = await client.waitForTransactionWithResult(tx);
  console.log(txResult);

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
  console.log(txResult);

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
  
    console.log(response);
  
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
  
    console.log(response);
  
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
  
    console.log(response);
  
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
  
    console.log(response);
  
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
  
    console.log(response);
  
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

  console.log(response);

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

  console.log(response);

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

  console.log(response);

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

  console.log(txResult);

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

  console.log(txResult);

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

  console.log(res);

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
      console.log(change);
      if ((change as any).data && (change as any).data.type === "0x1::coin::CoinStore<0x718f425ed1d75d876bdf0f316ab9f59624b38bccd4241405c114b9cd174d1e83::liquidity_pool::LPCoin>") {
        // console.log((change as any).data);
        // console.log((change as any).data.data.coin.value);
        lp_coin_received = parseInt((change as any).data.data.coin.value.toString()) / APT;
      }
    });

    return lp_coin_received - await getBalance(user.address, '0x718f425ed1d75d876bdf0f316ab9f59624b38bccd4241405c114b9cd174d1e83::liquidity_pool::LPCoin');
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
      console.log(change);
      if ((change as any).data && (change as any).data.type === "0x1::coin::CoinStore<0x718f425ed1d75d876bdf0f316ab9f59624b38bccd4241405c114b9cd174d1e83::z_apt::ZAPT>") {
        // console.log((change as any).data);
        // console.log((change as any).data.data.coin.value);
        apt_received = parseInt((change as any).data.data.coin.value.toString()) / APT;
      }
    });

    return apt_received - await getBalance(user.address, '0x718f425ed1d75d876bdf0f316ab9f59624b38bccd4241405c114b9cd174d1e83::z_apt::ZAPT');
  } catch (e) {
    console.error(e);
    return -1;
  }
}