import { CheckDefinition, CheckResultWithId } from "../types";

export function passCheck(check: CheckDefinition, message: string): CheckResultWithId {
  return {
    ...check,
    message,
    pass: true,
  };
}
