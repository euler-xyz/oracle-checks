import { Asset } from "@objectivelabs/oracle-sdk";

export const fallbackAssets: Asset[] = [
  {
    address: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
    chainId: 1,
    name: "Maker",
    symbol: "MKR",
    decimals: 18,
  },
  {
    address: "0x0000000000000000000000000000000000000348",
    chainId: 1,
    name: "U.S. Dollar",
    symbol: "USD",
    decimals: 18,
  },
  {
    address: "0x00000000000000000000000000000000000003d2",
    chainId: 1,
    name: "Euro",
    symbol: "EUR",
    decimals: 18,
  },
  {
    address: "0x00000000000000000000000000000000000003B5",
    chainId: 1,
    name: "Turkish Lira",
    symbol: "TRY",
    decimals: 18,
  },
  {
    address: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
    chainId: 1,
    name: "Bitcoin",
    symbol: "BTC",
    decimals: 18,
  },
];
