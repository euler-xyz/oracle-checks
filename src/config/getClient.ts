import { config } from "dotenv";
import { Chain, createPublicClient, http, PublicClient } from "viem";

config();

export function getClient(chain: Chain): PublicClient {
  // Use a lazy transport that only resolves the RPC URL when actually making requests
  return createPublicClient({
    chain,
    transport: http(() => {
      const rpcUrl = process.env[`RPC_URL_${chain.id}`];
      if (!rpcUrl) {
        throw new Error(`RPC_URL_${chain.id} is not set`);
      }
      return rpcUrl;
    }),
  });
}
