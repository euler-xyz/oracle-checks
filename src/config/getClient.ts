import { config } from "dotenv";
import { Chain, createPublicClient, http, PublicClient } from "viem";

config();

const clientCache = new Map<number, PublicClient>();

export function getClient(chain: Chain): PublicClient {
  if (!clientCache.has(chain.id)) {
    const rpcUrl = process.env[`RPC_URL_${chain.id}`];
    if (!rpcUrl) {
      throw new Error(`RPC_URL_${chain.id} is not set`);
    }
    clientCache.set(
      chain.id,
      createPublicClient({ chain, transport: http(rpcUrl) })
    )
  }
  return clientCache.get(chain.id)!;
}
