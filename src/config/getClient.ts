import { config } from "dotenv";
import { Chain, createPublicClient, http, PublicClient } from "viem";

config();

export function getClient(chain: Chain): PublicClient {
  const rpcUrl = process.env[`RPC_URL_${chain.id}`];
  if (!rpcUrl) {
    throw new Error(`RPC_URL_${chain.id} is not set`);
  }
  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}
