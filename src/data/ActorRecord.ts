import { MODULE_ID } from "../constants"
import { getRules } from "./SettingsManager"
import type { ActorRecord, Epithet, EpithetRule, Condition, StatKey } from "../types"

const updateQueue: Map<string, Promise<void>> = new Map()

const EMPTY_RECORD = (): ActorRecord => ({
  name: "",
  img: "",
  stats: {
    damageDealt: 0,
    damageTaken: 0,
    criticals: 0,
    criticalFails: 0,
    killCount: 0,
  },
  epithets: [],
  journal: [],
})

export function getRecord(actor: Actor): ActorRecord {
  const existing = actor.getFlag(MODULE_ID as any, "record") as ActorRecord | undefined

  if (!existing) {
    const fresh = {
      ...EMPTY_RECORD(),
      name: actor.name ?? "",
      img:  actor.img  ?? "",
    }
    void actor.setFlag(MODULE_ID as any, "record", fresh)
    return fresh
  }

  return existing
}

export async function updateRecord(
  actor: Actor,
  patch: Partial<ActorRecord>
): Promise<void> {
  return enqueue(actor, async () => {
    const current = getRecord(actor)
    await actor.setFlag(MODULE_ID as any, "record", { ...current, ...patch })
  })
}

export async function updateStats(
  actor: Actor,
  patch: Partial<ActorRecord["stats"]>
): Promise<void> {
  return enqueue(actor, async () => {
    const current = getRecord(actor)
    const updatedStats = { ...current.stats, ...patch }
    const newEpithets = checkEpithetRules(updatedStats, current.epithets, actor.id ?? "")

    await actor.setFlag(MODULE_ID as any, "record", {
      ...current,
      stats: updatedStats,
      epithets: newEpithets,
    })
  })
}

export async function incrementStats(
  actor: Actor,
  delta: Partial<ActorRecord["stats"]>
): Promise<void> {
  return enqueue(actor, async () => {
    const current = getRecord(actor)
    const updatedStats = { ...current.stats }

    for (const key of Object.keys(delta) as StatKey[]) {
      const amount = delta[key]
      if (typeof amount === "number" && amount !== 0) {
        updatedStats[key] += amount
      }
    }

    const newEpithets = checkEpithetRules(updatedStats, current.epithets, actor.id ?? "")

    await actor.setFlag(MODULE_ID as any, "record", {
      ...current,
      stats: updatedStats,
      epithets: newEpithets,
    })
  })
}

export async function refreshEpithets(actor: Actor): Promise<void> {
  return enqueue(actor, async () => {
    const current = getRecord(actor)
    const newEpithets = checkEpithetRules(current.stats, current.epithets, actor.id ?? "")

    await actor.setFlag(MODULE_ID as any, "record", {
      ...current,
      epithets: newEpithets,
    })
  })
}

function enqueue(actor: Actor, fn: () => Promise<void>): Promise<void> {
  const id = actor.id ?? ""
  const current = updateQueue.get(id) ?? Promise.resolve()
  const next = current.then(fn).catch(err => {
    console.error(`Codex | erro ao atualizar ${actor.name}:`, err)
  })
  updateQueue.set(id, next)
  return next
}

function evaluateCondition(stats: ActorRecord["stats"], condition: Condition): boolean {
  const value = stats[condition.stat as StatKey]
  switch (condition.operator) {
    case ">=": return value >= condition.threshold
    case "<=": return value <= condition.threshold
    case "==": return value === condition.threshold
    case ">":  return value >  condition.threshold
    case "<":  return value <  condition.threshold
    default:   return false
  }
}

function evaluateRule(stats: ActorRecord["stats"], rule: EpithetRule): boolean {
  if (rule.conditions.length === 0) return false
  if (rule.conditionMode === "all") {
    return rule.conditions.every(c => evaluateCondition(stats, c))
  }
  return rule.conditions.some(c => evaluateCondition(stats, c))
}

function checkEpithetRules(
  stats: ActorRecord["stats"],
  current: Epithet[],
  actorId: string
): Epithet[] {
  const rules = getRules(actorId)

  const auto: Epithet[] = []
  for (const rule of rules) {
    if (evaluateRule(stats, rule)) {
      auto.push({
        label:  rule.label,
        color:  rule.color,
        icon:   rule.icon,
        auto:   true,
        ruleId: rule.id,
      })
    }
  }

  const autoLabels = new Set(auto.map(e => e.label))
  const manual = current.filter(e => !e.auto && !autoLabels.has(e.label))

  const previous = new Set(current.filter(e => e.auto).map(e => e.ruleId))
  for (const epithet of auto) {
    if (!previous.has(epithet.ruleId)) {
      ui.notifications?.info(`Codex | ${game.i18n?.format("CODEX.NotifEpithet", { label: epithet.label })}`)
    }
  }

  return [...manual, ...auto]
}