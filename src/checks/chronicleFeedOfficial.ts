import { ChronicleFeed, ChronicleOracle } from "@objectivelabs/oracle-sdk";
import { hexToString } from "viem";

import { CheckResultWithId } from "./types";
import { CHECKS, failCheck, passCheck } from "./utils";

type Params = {
  adapter: ChronicleOracle;
  chronicleFeeds: ChronicleFeed[];
};

export function chronicleFeedOfficial({ adapter, chronicleFeeds }: Params): {
  result: CheckResultWithId;
  feed: ChronicleFeed | undefined;
  label: string;
} {
  const matchingChronicleFeed = chronicleFeeds.find((feed) => feed.address === adapter.feed);
  if (matchingChronicleFeed) {
    const description = hexToString(matchingChronicleFeed.wat as `0x${string}`, {
      size: 32,
    });
    return {
      result: passCheck(
        CHECKS.OFFICIAL_CHRONICLE_FEED,
        `Adapter is connected to an official Chronicle feed: ${description}.`,
      ),
      feed: matchingChronicleFeed,
      label: description,
    };
  } else {
    return {
      result: failCheck(CHECKS.OFFICIAL_CHRONICLE_FEED, "Could not find matching Chronicle feed."),
      feed: undefined,
      label: `Unknown`,
    };
  }
}
