import type { PythMetadata } from "@objectivelabs/oracle-sdk";

const PYTH_HERMES_ENDPOINT = "https://hermes.pyth.network";

function getPythApiKey(): string {
  const apiKey = process.env.PYTH_API_KEY;
  if (!apiKey) {
    throw new Error("PYTH_API_KEY is required to fetch Pyth metadata");
  }

  return apiKey;
}

export async function fetchPythMetadata(): Promise<PythMetadata> {
  const response = await fetch(`${PYTH_HERMES_ENDPOINT}/v2/price_feeds`, {
    headers: {
      Authorization: `Bearer ${getPythApiKey()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Pyth metadata: HTTP ${response.status}`);
  }

  const data = (await response.json()) as PythMetadata;
  return data.map((feed) => ({ ...feed, id: `0x${feed.id}` }));
}
