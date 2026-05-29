import { randomUUID } from "node:crypto";

export function createRunId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 8);
}

export function createRunTimestamp(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-");
}
