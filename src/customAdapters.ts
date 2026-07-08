import { Address } from "viem";

export const POPPIE_EULER_ADAPTER_CONTRACT_NAME = "PoppieEulerAdapter";
export const POPPIE_CUSTOM_ADAPTER_DISPLAY_NAME = "Poppie Custom Adaptor";
export const POPPIE_EULER_ADAPTER_METADATA_HASH =
  "0x12201a101ae06de263c4508922a47b3a3cbfaf700bf7950cc2d5c57b827174f21c97";

export type PoppieEulerAdapter = {
  address: Address;
  chainId: number;
  name: typeof POPPIE_EULER_ADAPTER_CONTRACT_NAME;
};
