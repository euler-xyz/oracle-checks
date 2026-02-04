import { Asset } from "@objectivelabs/oracle-sdk";

export const fallbackAssets: Asset[] = [
  {
    address: "0x0000000000000000000000000000000000000348",
    chainId: 999,
    name: "U.S. Dollar",
    symbol: "USD",
    decimals: 18,
  },
  {
    address: "0x00000000000000000000000000000000000003d2",
    chainId: 999,
    name: "Euro",
    symbol: "EUR",
    decimals: 18,
  },
  {
    address: "0x00000000000000000000000000000000000003B5",
    chainId: 999,
    name: "Turkish Lira",
    symbol: "TRY",
    decimals: 18,
  },
  // Chain 999 pooled assets
  {
    address: "0xfDD22Ce6D1F66bc0Ec89b20BF16CcB6670F55A5a",
    chainId: 999,
    name: "thBILL",
    symbol: "thBILL",
    decimals: 6,
  },
  {
    address: "0xf4D9235269a96aaDaFc9aDAe454a0618eBE37949",
    chainId: 999,
    name: "Tether Gold",
    symbol: "XAUt0",
    decimals: 6,
  },
  {
    address: "0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2",
    chainId: 999,
    name: "Staked USDe",
    symbol: "sUSDe",
    decimals: 18,
  },
  {
    address: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
    chainId: 999,
    name: "USDe",
    symbol: "USDe",
    decimals: 18,
  },
  {
    address: "0x02c6a2fA58cC01A18B8D9E00eA48d65E4dF26c70",
    chainId: 999,
    name: "Felix USD",
    symbol: "feUSD",
    decimals: 18,
  },
  {
    address: "0xb50A96253aBDF803D85efcDce07Ad8becBc52BD5",
    chainId: 999,
    name: "USDHL",
    symbol: "USDHL",
    decimals: 6,
  },
  {
    address: "0x068f321Fa8Fb9f0D135f290Ef6a3e2813e1c8A29",
    chainId: 999,
    name: "Unit SOL",
    symbol: "USOL",
    decimals: 9,
  },
];
