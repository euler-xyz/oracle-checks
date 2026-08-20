import { Address } from "viem";

export const POPPIE_EULER_ADAPTER_CONTRACT_NAME = "PoppieEulerAdapter";
export const POPPIE_CUSTOM_ADAPTER_DISPLAY_NAME = "Poppie Custom Adaptor";
export const POPPIE_EULER_ADAPTER_METADATA_HASH =
  "0x1220fc8e0ecc29a1ce0659055e968dfae362c42c436e53586f6c311d3f327018c513";

export type PoppieEulerAdapter = {
  address: Address;
  chainId: number;
  name: typeof POPPIE_EULER_ADAPTER_CONTRACT_NAME;
};
