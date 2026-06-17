export interface CombatStats {
  damageDealt: number
  damageTaken: number
  criticals: number
  criticalFails: number
  killCount: number
}

export interface ActorRecord {
  name: string
  img: string
  stats: CombatStats
  sessionStats: CombatStats
  epithets: Epithet[]
  journal: JournalEntry[]
}

export interface Epithet {
  label: string
  color?: string
  icon?: string
  auto: boolean
  ruleId?: string
}

export interface JournalEntry {
  id: string
  title: string
  content: string
  createdAt: number
  tags: string[]
}

export type StatKey = keyof CombatStats
export type Operator = ">=" | "<=" | "==" | ">" | "<"
export type ConditionMode = "all" | "any"

export interface Condition {
  stat: StatKey
  operator: Operator
  threshold: number
}

export interface EpithetRule {
  id: string
  label: string
  color: string
  icon: string
  scope: "global" | "actor"
  actorId?: string
  conditionMode: ConditionMode
  conditions: Condition[]
}

export interface CodexSettings {
  hpPath: string
  attackFlavor: string
  rules: EpithetRule[]
}

export interface CodexExport {
  version: string
  exportedAt: number
  actors: Record<string, ActorRecord>
}

export const STAT_KEYS: StatKey[] = [
  "killCount",
  "criticals",
  "criticalFails",
  "damageDealt",
  "damageTaken",
]
