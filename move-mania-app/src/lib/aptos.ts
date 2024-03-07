import { AptosAccount, AptosClient, FaucetClient, HexString, Provider } from "aptos";
import { BetData } from "./types";
import { User } from "./schema";

const MODULE_ADDRESS = '0x84b53c89b31c8b41463946e7909cb606b4a77e3a6793de86195677175dd3b6c4';
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

export async function createAptosKeyPair(): Promise<{
  public_address: string;
  private_key: string;
}> {
  const wallet = new AptosAccount();
  const privateKey = wallet.toPrivateKeyObject().privateKeyHex;
  const publicKey = wallet.address();

  await faucetClient.fundAccount(publicKey, 10_0000_0000, 5)
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
