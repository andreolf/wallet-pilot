import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";
import type { TxLog, TxIntent, GuardResult, AgentAction, TxOutcome } from "./types.js";

const LOGS_DIR = join(homedir(), ".wallet-pilot", "logs");

function ensureLogsDir(): void {
  if (!existsSync(LOGS_DIR)) {
    mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function getLogFilePath(date: Date = new Date()): string {
  const dateStr = date.toISOString().split("T")[0];
  return join(LOGS_DIR, `${dateStr}.json`);
}

function loadDayLogs(date: Date = new Date()): TxLog[] {
  const path = getLogFilePath(date);
  if (!existsSync(path)) {
    return [];
  }
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw);
}

function saveDayLogs(logs: TxLog[], date: Date = new Date()): void {
  ensureLogsDir();
  const path = getLogFilePath(date);
  writeFileSync(path, JSON.stringify(logs, null, 2));
}

export function logTransaction(
  action: AgentAction,
  intent: TxIntent,
  guardResult: GuardResult,
  outcome: TxOutcome,
  txHash?: string,
  error?: string
): TxLog {
  const log: TxLog = {
    id: randomUUID(),
    timestamp: Date.now(),
    action,
    intent: {
      ...intent,
      value: intent.value,
    },
    guardResult,
    outcome,
    txHash,
    error,
  };

  const logs = loadDayLogs();
  logs.push(log);
  saveDayLogs(logs);

  return log;
}

export function getRecentLogs(count: number = 10): TxLog[] {
  ensureLogsDir();

  const files = readdirSync(LOGS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();

  const allLogs: TxLog[] = [];

  for (const file of files) {
    if (allLogs.length >= count) break;

    const path = join(LOGS_DIR, file);
    const raw = readFileSync(path, "utf-8");
    const dayLogs: TxLog[] = JSON.parse(raw);

    allLogs.push(...dayLogs.reverse());
  }

  return allLogs.slice(0, count);
}

export function getDailySpent(chainId?: number): bigint {
  const logs = loadDayLogs();

  let total = 0n;

  for (const log of logs) {
    if (log.outcome !== "confirmed") continue;
    if (chainId && log.intent.chainId !== chainId) continue;

    if (log.guardResult.estimatedValueUsd) {
      total += log.guardResult.estimatedValueUsd;
    }
  }

  return total;
}

export function formatLogEntry(log: TxLog): string {
  const date = new Date(log.timestamp).toISOString();
  const status = log.outcome === "confirmed" ? "✓" : log.outcome === "pending_approval" ? "⏳" : "✗";
  const value = log.guardResult.estimatedValueUsd
    ? `$${(Number(log.guardResult.estimatedValueUsd) / 1e6).toFixed(2)}`
    : "?";

  let line = `${status} [${date}] ${log.action} ${value}`;

  if (log.txHash) {
    line += ` tx:${log.txHash.slice(0, 10)}...`;
  }

  if (log.error) {
    line += ` error:${log.error}`;
  }

  if (log.guardResult.reason) {
    line += ` (${log.guardResult.reason})`;
  }

  return line;
}

export function printRecentLogs(count: number = 10): void {
  const logs = getRecentLogs(count);

  if (logs.length === 0) {
    console.log("No transaction history.");
    return;
  }

  console.log("\n--- Transaction History ---\n");
  for (const log of logs) {
    console.log(formatLogEntry(log));
  }
  console.log("");
}

export function serializeTxLog(log: TxLog): object {
  return {
    ...log,
    intent: {
      ...log.intent,
      value: log.intent.value.toString(),
      gasLimit: log.intent.gasLimit?.toString(),
    },
    guardResult: {
      ...log.guardResult,
      estimatedValueUsd: log.guardResult.estimatedValueUsd?.toString(),
    },
    gasUsed: log.gasUsed?.toString(),
    effectiveGasPrice: log.effectiveGasPrice?.toString(),
  };
}
