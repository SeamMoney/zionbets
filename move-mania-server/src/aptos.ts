import { AptosAccount, AptosClient, HexString, Provider, Network } from "aptos";
import crypto from 'crypto';
import { calculateCrashPoint } from "./crashPoint";

const MODULE_ADDRESS = '0xead58f20349f8dacf71fe47722a6f14b4f9204c74e078cda7567456a506cd70f';
const CRASH_RESOURCE_ACCOUNT_ADDRESS = '0x09a9ee01215961135773c653f6c1a5be29c93cb49c47fb53a583f295796f5b9d';
const LP_RESOURCE_ACCOUNT_ADDRESS = '0xcd1c7a1f38b173856e3ccc820c37235d9330f83a3b14d3e088df33f2d131053c'
const Z_APT_RESOURCE_ACCOUNT_ADDRESS = '0x337fdddae41ccb60266741510a22b6b1a630cf934855c22f93a7404267e2b505';
const ADMIN_ACCOUNT_PRIVATE_KEY = '0xa3b22193740d044585a17a90cb413fbdb6303c0e7f42dce98ee5ffe6dfdac1ac';

const RPC_URL = 'https://fullnode.random.aptoslabs.com';
const FAUCET_URL = 'https://faucet.random.aptoslabs.com'

const client = new AptosClient(RPC_URL);
const provider = new Provider({
  fullnodeUrl: RPC_URL,
  indexerUrl: 'https://indexer.random.aptoslabs.com',
})

const TRANSACTION_OPTIONS = {
  max_gas_amount: '500000',
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
  console.log(crashTime, Date.now());
  if (crashTime + 500 >= Date.now()) {
    delay(crashTime + 500 - Date.now());
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