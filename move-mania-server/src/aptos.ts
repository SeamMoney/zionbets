import { AptosAccount, AptosClient, HexString, Provider, Network } from "aptos";
import crypto from 'crypto';

const MODULE_ADDRESS = '0x84b53c89b31c8b41463946e7909cb606b4a77e3a6793de86195677175dd3b6c4';
const MODULE_NAME = 'crash';
const RESOURCE_ACCOUNT_ADDRESS = '0x1a4cb4bf37423429a3359a761694916d1259ba1814fc9f7e42fec17e955d3e14';
const ADMIN_ACCOUNT_PRIVATE_KEY = '0xcd49ff957f21fa2c6bbb298109e027c36607bf656f4222dbeba909ee983821ce';

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

createNewGame('house_secret', 'salt')