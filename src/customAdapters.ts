import { Address } from "viem";

export const POPPIE_EULER_ADAPTER_CONTRACT_NAME = "PoppieEulerAdapter";
export const POPPIE_CUSTOM_ADAPTER_DISPLAY_NAME = "Poppie Custom Adaptor";
export const POPPIE_EULER_ADAPTER_METADATA_HASH =
  "0x1220f08e26cc788c11f264f8f458d360eb51bcc65c10bb93c47189ba89b830707d60";

export type PoppieEulerAdapter = {
  address: Address;
  chainId: number;
  name: typeof POPPIE_EULER_ADAPTER_CONTRACT_NAME;
};
