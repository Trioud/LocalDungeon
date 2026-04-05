export type ReadyTrigger = string;

export interface ReadyAction {
  combatantId: string;
  trigger: ReadyTrigger;
  actionDescription: string;
  expiresOnTurn: number;
  used: boolean;
}

export interface OpportunityAttack {
  attackerId: string;
  targetId: string;
  sessionId: string;
  timestamp: number;
}
