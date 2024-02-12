import { AptosAccount } from "aptos";

export async function createAptosKeyPair(): Promise<{
  public_address: string;
  private_key: string;
}> {
  const wallet = new AptosAccount();
  const privateKey = wallet.toPrivateKeyObject().privateKeyHex;
  const publicKey = wallet.address();

  return {
    public_address: publicKey.toString(),
    private_key: privateKey,
  };
}
