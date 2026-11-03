/**
 * Immutable Constitution — product-layer locks that cannot be cleared by allocate/respec/agent.
 */
export declare const CONSTITUTION_RULES: readonly ["agent_cannot_grant_skill_points", "agent_cannot_unlock_danger", "agent_cannot_disable_approval", "agent_cannot_clear_audit", "agent_cannot_raise_sandbox_to_danger_full_access", "agent_cannot_disable_strict_path_mode", "policy_changes_require_human_operator"];
export type ConstitutionRule = (typeof CONSTITUTION_RULES)[number];
/** Always-on flags baked into every compiled AgentPolicy. */
export declare const CONSTITUTION_LOCKS: Readonly<{
    constitutionLocked: true;
    agentMaySelfUnlockDanger: false;
    agentMayGrantPoints: false;
}>;
