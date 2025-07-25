export type CheckSeverity = "High" | "Med" | "Low" | "Info";

export type CheckRule<T> = {
  severity: CheckSeverity;
  check: (t: T) => CheckResult;
};

export type CheckResult = {
  pass: boolean;
  message: string;
};

export type CheckDefinition = {
  id: string;
  severity: CheckSeverity;
};

export type CheckResultWithId = CheckDefinition & CheckResult;
