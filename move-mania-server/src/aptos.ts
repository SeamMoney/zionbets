import { AptosAccount, AptosClient, HexString, Provider, Network } from "aptos";
import crypto from 'crypto';

const MODULE_ADDRESS = '0xd88fc15949378757f66045995e666e6ac76f5d0e9879903333203be239d654a8';
const CRASH_RESOURCE_ACCOUNT_ADDRESS = '0xd1f80c92f20c3027476f264d45c5e832f2cabdb23bd921ccdbb3b41a65df06a3';
const LP_RESOURCE_ACCOUNT_ADDRESS = '0xf5393e9a5acca561dcf3ca6bb585702b7156004afe6ede2e2163cdf21225394e'
const ADMIN_ACCOUNT_PRIVATE_KEY = '0x358f9ab5d95321dd3f9426ec10808ae02d4d645c7e21c5e2f651b23775bc2caa';

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

const fromHexString = (hexString: any) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte: any) => parseInt(byte, 16)));

function getAdminAccount() {
  return new AptosAccount(
    new HexString(ADMIN_ACCOUNT_PRIVATE_KEY).toUint8Array()
  );
}

export async function createNewGame(house_secret: string, salt: string) { 
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
      console.log(JSON.stringify(change.data.data.current_game.vec[0], null, 4));
      startTime = parseInt(change.data.data.current_game.vec[0].start_time_ms);
      randomNumber = parseInt(change.data.data.current_game.vec[0].randomness);
    }
  });
  if ((txResult as any).success === false) { 
    return null; 
  }
  console.log({
    txnHash: txResult.hash,
    startTime, 
    randomNumber
  })
  return {
    txnHash: txResult.hash,
    startTime, 
    randomNumber
  }
}

export async function endGame(house_secret: string, salt: string) {

  const adminAccount = getAdminAccount();

  const createGameTxn = await provider.generateTransaction(
    adminAccount.address(), 
    {
      function: `${MODULE_ADDRESS}::crash::reveal_crashpoint_and_distribute_winnings`,
      type_arguments: [],
      arguments: [
        `${house_secret}${salt}`, 
        salt
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
  console.log(txResult);
  if ((txResult as any).success === false) { 
    return null; 
  }
  console.log({
    txnHash: txResult.hash
  })
  return {
    txnHash: txResult.hash
  }
}

// createNewGame('house_secret', 'salt')
endGame('house_secret', 'salt')

// console.log(crypto.createHash("SHA3-256").update(`house_secretsalt`).digest('hex'));
// console.log(crypto.createHash("SHA3-256").update(`salt`).digest('hex'));

// console.log(fromHexString(crypto.createHash("SHA3-256").update(`house_secretsalt`).digest('hex')))
// console.log(fromHexString(crypto.createHash("SHA3-256").update(`salt`).digest('hex')))