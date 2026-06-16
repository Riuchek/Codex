export interface ActorRecord {
  name: string
  img: string
  stats: {
    damageDealt: number
    damageTaken: number
    criticals: number
    criticalFails: number
    killCount: number
  }
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

export type StatKey = "killCount" | "criticals" | "criticalFails" | "damageDealt" | "damageTaken"
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