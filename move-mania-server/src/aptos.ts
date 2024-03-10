import { AptosAccount, AptosClient, HexString, Provider, Network } from "aptos";
import crypto from 'crypto';

const MODULE_ADDRESS = '0x8404f42a23ecdd3d49b6cfbf876c6acaa8f50da825a10feb81bdb2b055a55d68';
const MODULE_NAME = 'crash';
const RESOURCE_ACCOUNT_ADDRESS = '0xfc93821f9e31367ca203de80f5554f7d39678728427ed395fa1a5c50717f920d';
const ADMIN_ACCOUNT_PRIVATE_KEY = '0xeb887a4de411a8679da1e19fc64cfb99cd38efc2dbba2979aac46f3658e3f5dc';

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
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::start_game`,
      type_arguments: [],
      arguments: [
        hashed_salted_house_secret, 
        hashed_salt
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
    if (change.data && change.data.type && change.data.type === `${MODULE_ADDRESS}::${MODULE_NAME}::State`){
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
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::reveal_crashpoint_and_distribute_winnings`,
      type_arguments: [],
      arguments: [
        house_secret, 
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
  //   if (change.data && change.data.type && change.data.type === `${MODULE_ADDRESS}::${MODULE_NAME}::State`){
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
// endGame('house_secret', 'salt')