import type {
  TxIntent,
  Permissions,
  GuardResult,
  GuardRejectReason,
  AgentAction,
} from "./types.js";
import { KNOWN_METHODS } from "./types.js";
import { estimateTxValueUsd, formatUsd } from "./price.js";
import { getDailySpent } from "./logger.js";

export class Guard {
  private permissions: Permissions;

  constructor(permissions: Permissions) {
    this.permissions = permissions;
  }

  async checkAction(action: AgentAction): Promise<GuardResult> {
    if (this.permissions.revoked) {
      return { allowed: false, reason: "revoked" };
    }

    if (this.permissions.expiry) {
      const expiry = new Date(this.permissions.expiry);
      if (Date.now() > expiry.getTime()) {
        return { allowed: false, reason: "expired" };
      }
    }

    if (!this.permissions.constraints.allowedActions.includes(action)) {
      return { allowed: false, reason: "action_not_allowed" };
    }

    return { allowed: true };
  }

  async checkTransaction(intent: TxIntent): Promise<GuardResult> {
    const { constraints } = this.permissions;

    if (this.permissions.revoked) {
      return { allowed: false, reason: "revoked" };
    }

    if (this.permissions.expiry) {
      const expiry = new Date(this.permissions.expiry);
      if (Date.now() > expiry.getTime()) {
        return { allowed: false, reason: "expired" };
      }
    }

    if (!constraints.allowedChains.includes(intent.chainId)) {
      return { allowed: false, reason: "chain_not_allowed" };
    }

    const targetAddress = intent.to.toLowerCase();
    const isAllowedProtocol = constraints.allowedProtocols.some(
      (p) => p.toLowerCase() === targetAddress
    );

    if (!isAllowedProtocol) {
      return { allowed: false, reason: "protocol_not_allowed" };
    }

    const selector = intent.data.slice(0, 10);
    const methodName = KNOWN_METHODS[selector] || selector;

    for (const blocked of constraints.blockedMethods) {
      if (methodName.includes(blocked) || selector === blocked) {
        return { allowed: false, reason: "method_blocked" };
      }
    }

    const estimatedValueUsd = await estimateTxValueUsd(intent.value, intent.chainId);

    const perTxLimit = BigInt(constraints.spendLimit.perTx);
    if (estimatedValueUsd > perTxLimit) {
      return {
        allowed: false,
        reason: "exceeds_per_tx_limit",
        estimatedValueUsd,
      };
    }

    const dailySpent = getDailySpent(intent.chainId);
    const dailyLimit = BigInt(constraints.spendLimit.daily);
    if (dailySpent + estimatedValueUsd > dailyLimit) {
      return {
        allowed: false,
        reason: "exceeds_daily_limit",
        estimatedValueUsd,
      };
    }

    const approvalThreshold = BigInt(constraints.requireApproval.above);
    const requiresApprovalMethod = constraints.requireApproval.methods.some(
      (m) => methodName.includes(m)
    );

    if (estimatedValueUsd > approvalThreshold || requiresApprovalMethod) {
      return {
        allowed: true,
        requiresApproval: true,
        estimatedValueUsd,
      };
    }

    return { allowed: true, estimatedValueUsd };
  }

  formatRejection(result: GuardResult): string {
    const reasons: Record<GuardRejectReason, string> = {
      revoked: "Agent wallet permissions have been revoked",
      expired: "Agent wallet permissions have expired",
      chain_not_allowed: "Chain is not in the allowlist",
      protocol_not_allowed: "Target contract is not in the protocol allowlist",
      action_not_allowed: "This action is not permitted",
      method_blocked: "This method is blocked by policy",
      exceeds_per_tx_limit: `Transaction value (${formatUsd(result.estimatedValueUsd || 0n)}) exceeds per-transaction limit`,
      exceeds_daily_limit: `Transaction would exceed daily spending limit`,
      simulation_failed: "Transaction simulation failed",
    };

    return reasons[result.reason!] || `Transaction rejected: ${result.reason}`;
  }

  getPermissions(): Permissions {
    return this.permissions;
  }

  updatePermissions(permissions: Permissions): void {
    this.permissions = permissions;
  }
}

export function decodeMethodSelector(data: string): {
  selector: string;
  methodName: string;
} {
  const selector = data.slice(0, 10);
  const methodName = KNOWN_METHODS[selector] || "unknown";
  return { selector, methodName };
}

export function isAllowedProtocol(
  address: string,
  allowedProtocols: string[]
): boolean {
  return allowedProtocols.some(
    (p) => p.toLowerCase() === address.toLowerCase()
  );
}
