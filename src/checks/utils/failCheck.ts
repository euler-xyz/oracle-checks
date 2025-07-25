import { CheckDefinition, CheckResultWithId } from "../types";

export function failCheck(check: CheckDefinition, message: string): CheckResultWithId {
  return {
    ...check,
    message,
    pass: false,
  };
}
