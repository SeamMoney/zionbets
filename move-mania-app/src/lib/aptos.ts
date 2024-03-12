import { AptosAccount, AptosClient, FaucetClient, HexString, Provider } from "aptos";
import { BetData, CashOutData } from "./types";
import { User } from "./schema";

const MODULE_ADDRESS = '0xead58f20349f8dacf71fe47722a6f14b4f9204c74e078cda7567456a506cd70f';
const MODULE_NAME = 'crash';

const RPC_URL = 'https://fullnode.random.aptoslabs.com';
const FAUCET_URL = 'https://faucet.random.aptoslabs.com';

const client = new AptosClient(RPC_URL);
const provider = new Provider({
  fullnodeUrl: RPC_URL,
  indexerUrl: 'https://indexer.random.aptoslabs.com',
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

async function getUserAccount(userPrivateKey: string) {
  return new AptosAccount(
    new HexString(userPrivateKey).toUint8Array()
  );
}

export async function getBalance(userPrivateKey: string, type: string) {
  const userAccount = await getUserAccount(userPrivateKey);
  console.log('userAccount: ', userAccount.address().toString());
  const res = await provider.view({
    function: `0x1::coin::balance`,
    type_arguments: [type],
    arguments: [userAccount.address().toString()],
  })
  console.log('res: ', res);

  return parseInt(res[0].toString()) / APT;

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
  };
}
