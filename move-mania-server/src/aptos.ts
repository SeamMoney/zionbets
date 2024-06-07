import { AptosAccount, AptosClient, HexString, Provider, Network } from "aptos";
import crypto from 'crypto';
import { calculateCrashPoint } from "./crashPoint";
import getConfig from "./envManager";

require('dotenv').config();
const {MODULE_ADDRESS,
      CRASH_RESOURCE_ACCOUNT_ADDRESS,
      LP_RESOURCE_ACCOUNT_ADDRESS,
    Z_APT_RESOURCE_ACCOUNT_ADDRESS,
    ADMIN_ACCOUNT_PRIVATE_KEY,
    CHAIN_MODE,
  NODE_URL}  = getConfig()
// const MODULE_ADDRESS = process.env.MODULE_ADDRESS as string;
// const CRASH_RESOURCE_ACCOUNT_ADDRESS = process.env.CRASH_RESOURCE_ACCOUNT_ADDRESS as string;
// const LP_RESOURCE_ACCOUNT_ADDRESS = process.env.LP_RESOURCE_ACCOUNT_ADDRESS as string;
// const ADMIN_ACCOUNT_PRIVATE_KEY = process.env.ADMIN_ACCOUNT_PRIVATE_KEY as string;

// const RPC_URL = 'https://fullnode.devnet.aptoslabs.com';
// const FAUCET_URL = 'https://faucet.devnet.aptoslabs.com'

const client = new AptosClient(NODE_URL);
const provider = new Provider({
  fullnodeUrl: NODE_URL,
  indexerUrl: `https://indexer.testnet.aptoslabs.com`,
})

const TRANSACTION_OPTIONS = {
  max_gas_amount: '10000',
  gas_unit_price: '100',
};


function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

const fromHexString = (hexString: any) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte: any) => parseInt(byte, 16)));

function getAdminAccount() {
  return new AptosAccount(
    new HexString(ADMIN_ACCOUNT_PRIVATE_KEY).toUint8Array()
  );
}

export async function createNewGame(house_secret: string, salt: string): Promise<{ txnHash: string, startTime: number, randomNumber: string } | null> { 
  const adminAccount = getAdminAccount();

  const hashed_salted_house_secret = crypto.createHash("SHA3-256").update(`${house_secret}${salt}`).digest('hex');
  const hashed_salt = crypto.createHash("SHA3-256").update(salt).digest('hex');

  const createGameTxn = await provider.generateTransaction(
    adminAccount.address(), 
    {
      function: `${MODULE_ADDRESS}::crash::start_game`,
      type_arguments: [],
      arguments: [
        fromHexString(hashed_salted_house_secret),
        fromHexString(hashed_salt)
      ]
    }, 
    TRANSACTION_OPTIONS
  );

  const tx = await provider.signAndSubmitTransaction(adminAccount, createGameTxn);

  const txResult = await client.waitForTransactionWithResult(tx);
  // console.log(txResult);
  // console.log((txResult as any).success);
  let startTime;
  let randomNumber;
  (txResult as any).changes.forEach((change: any) => {
    // console.log(change);
    if (change.data && change.data.type && change.data.type === `${MODULE_ADDRESS}::crash::State`){
      // console.log(JSON.stringify(change.data.data.current_game.vec[0], null, 4));
      startTime = parseInt(change.data.data.current_game.vec[0].start_time_ms);
      randomNumber = change.data.data.current_game.vec[0].randomness;
    }
  });
  if ((txResult as any).success === false) { 
    console.error("Transaction failed:", txResult);
    return null; 
  }
  // console.log({
  //   txnHash: txResult.hash,
  //   startTime, 
  //   randomNumber
  // })
  return {
    txnHash: txResult.hash,
    startTime: startTime as unknown as number, 
    randomNumber: randomNumber as unknown as string
  }
}

export async function endGame(house_secret: string, salt: string, crashTime: number): Promise<{ txnHash: string } | null> {

  const adminAccount = getAdminAccount();

  // If the crash time is in the future, then wait until the crash time to end the game
  if (crashTime + 200 >= Date.now()) {
    await delay(crashTime + 1000 - Date.now());
  }
    

  const createGameTxn = await provider.generateTransaction(
    adminAccount.address(), 
    {
      function: `${MODULE_ADDRESS}::crash::reveal_crashpoint_and_distribute_winnings`,
      type_arguments: [],
      arguments: [
        Uint8Array.from(Buffer.from(`${house_secret}${salt}`)),
        Uint8Array.from(Buffer.from(salt))
      ]
    }, 
    TRANSACTION_OPTIONS
  );

  const tx = await provider.signAndSubmitTransaction(adminAccount, createGameTxn);

  const txResult = await client.waitForTransactionWithResult(tx);
  // console.log(txResult);
  // console.log((txResult as any).success);
  // let startTime;
  // let randomNumber;
  // (txResult as any).changes.forEach((change: any) => {
  //   // console.log(change);
  //   if (change.data && change.data.type && change.data.type === `${MODULE_ADDRESS}::crash::State`){
  //     console.log(JSON.stringify(change.data.data.current_game.vec[0], null, 4));
  //     startTime = parseInt(change.data.data.current_game.vec[0].start_time_ms);
  //     randomNumber = parseInt(change.data.data.current_game.vec[0].randomness);
  //   }
  // });
  // console.log(txResult);
  if ((txResult as any).success === false) { 

    return null; 
  }
  // console.log({
  //   txnHash: txResult.hash
  // })
  return {
    txnHash: txResult.hash
  }
}

async function test_crashpoint_calculatation() {

  console.log(calculateCrashPoint('6904922446877749869', 'house_secretsalt'));

  const adminAccount = getAdminAccount();

  const createGameTxn = await provider.generateTransaction(
    adminAccount.address(), 
    {
      function: `${MODULE_ADDRESS}::crash::test_out_calculate_crash_point_with_randomness`,
      type_arguments: [],
      arguments: [
        '6904922446877749869', 
        'house_secretsalt'
      ]
    }, 
    TRANSACTION_OPTIONS
  );

  const tx = await provider.signAndSubmitTransaction(adminAccount, createGameTxn);

  const txResult = await client.waitForTransactionWithResult(tx);

  console.log(txResult.hash)
}

// test_crashpoint_calculatation()

// createNewGame('house_secret', 'salt')
// endGame('house_secret', 'salt')

// console.log(crypto.createHash("SHA3-256").update(`house_secretsalt`).digest('hex'));
// console.log(crypto.createHash("SHA3-256").update(`salt`).digest('hex'));

// console.log(fromHexString(crypto.createHash("SHA3-256").update(`house_secretsalt`).digest('hex')))
// console.log(fromHexString(crypto.createHash("SHA3-256").update(`salt`).digest('hex')))
