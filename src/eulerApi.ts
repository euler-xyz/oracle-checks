import { Address } from "viem";

const DEFAULT_PAGE_SIZE = 100;

export type DeployedRouter = {
  router: Address;
  chainId?: number;
  deployer?: Address;
  deployedAt?: string;
  configs?: unknown[];
  vaults?: unknown[];
};

type HistoricalAdapter = {
  chainId: number;
  adapter: Address;
  firstSeenTimestamp: string;
  lastSeenTimestamp: string;
};

type EulerApiPaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    offset: number;
    limit: number;
    chainId: string;
  };
};

function getEulerApiMetadata(): {
  url: string;
} {
  const url = process.env.EULER_DATA_API_URL;
  if (!url) {
    throw new Error("EULER_DATA_API_URL is not set");
  }

  return { url };
}

async function fetchEulerApi<T>(path: string): Promise<T | null> {
  const { url } = getEulerApiMetadata();

  return fetch(`${url}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(5000),
  })
    .then(async (res) => {
      if (res.status === 200) {
        return res.json() as T;
      }

      throw new Error(`Got response [${res.status}] ${await res.text()}`);
    })
    .catch((error) => {
      console.error(`Error fetching Euler API ${path}: ${error.message}`);
      return null;
    });
}

async function fetchEulerApiPages<T>(path: string, chainId: number): Promise<T[]> {
  const items: T[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      chainId: String(chainId),
      limit: String(DEFAULT_PAGE_SIZE),
      offset: String(offset),
    });

    const data = await fetchEulerApi<EulerApiPaginatedResponse<T>>(`${path}?${params}`);
    if (!data || !Array.isArray(data.data)) {
      return items;
    }

    items.push(...data.data);

    const { total, offset: returnedOffset, limit } = data.meta;
    const nextOffset = returnedOffset + data.data.length;
    if (items.length >= total || data.data.length === 0 || nextOffset <= offset || limit <= 0) {
      hasMore = false;
    } else {
      offset = nextOffset;
    }
  }

  return items;
}

export async function fetchEulerApiHistoricalAdapters(chainId: number): Promise<Address[]> {
  const adapters = await fetchEulerApiPages<HistoricalAdapter>(
    "/v3/oracles/historical-adapters",
    chainId,
  );

  return adapters.map(({ adapter }) => adapter);
}

export async function fetchEulerApiDeployedRouters(chainId: number): Promise<DeployedRouter[]> {
  return fetchEulerApiPages<DeployedRouter>("/v3/oracles/routers", chainId);
}
