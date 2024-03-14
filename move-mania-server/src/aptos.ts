import { AptosAccount, AptosClient, HexString, Provider, Network } from "aptos";
import crypto from 'crypto';
import { calculateCrashPoint } from "./crashPoint";

const MODULE_ADDRESS = '0x718f425ed1d75d876bdf0f316ab9f59624b38bccd4241405c114b9cd174d1e83';
const CRASH_RESOURCE_ACCOUNT_ADDRESS = '0x44d6cd854567d0bb4fc23ee3df1cb7eec15fea87c8cb844713c6166982826715';
const LP_RESOURCE_ACCOUNT_ADDRESS = '0xbdd5fb2899ba75294df3b6735b11a9565160e0d0b2327e9ec84979224cf31aa1'
const Z_APT_RESOURCE_ACCOUNT_ADDRESS = '0x6fc171eb36807e956b56a5c8c7157968f8aee43299e35e6e45f477719c8acd4d';
const ADMIN_ACCOUNT_PRIVATE_KEY = '0xad136a5224a592705a0f7a18e63ee16653a871e209b3a0b12b1c34dbf2ad6c6a';

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