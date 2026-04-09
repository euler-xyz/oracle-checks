import { config } from "dotenv";
import { Chain, createPublicClient, defineChain, http, PublicClient } from "viem";

config();

function withMulticall3(chain: Chain): Chain {
  if (chain.contracts?.multicall3) return chain;
  return defineChain({
    ...chain,
    contracts: {
      ...chain.contracts,
      multicall3: {
        address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      },
    },
  });
}

export function getClient(chain: Chain): PublicClient {
  const rpcUrl = process.env[`RPC_URL_${chain.id}`];
  if (!rpcUrl) {
    throw new Error(`RPC_URL_${chain.id} is not set`);
  }
  return createPublicClient({
    chain: withMulticall3(chain),
    transport: http(rpcUrl),
  });
}
