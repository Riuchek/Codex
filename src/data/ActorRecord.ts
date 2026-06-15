import { MODULE_ID, EPITHET_RULES } from "../constants"
import type { ActorRecord, Epithet } from "../types"

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
  const current = getRecord(actor)
  const updated = { ...current, ...patch }
  await actor.setFlag(MODULE_ID as any, "record", updated)
}

export async function updateStats(
  actor: Actor,
  patch: Partial<ActorRecord["stats"]>
): Promise<void> {
  const current = getRecord(actor)
  const updatedStats = { ...current.stats, ...patch }
  const newEpithets = checkEpithetRules(updatedStats, current.epithets)

  await actor.setFlag(MODULE_ID as any, "record", {
    ...current,
    stats: updatedStats,
    epithets: newEpithets,
  })
}

function checkEpithetRules(
  stats: ActorRecord["stats"],
  current: Epithet[]
): Epithet[] {
  const epithets = [...current]
  const existingLabels = new Set(epithets.map(e => e.label))

  for (const rule of EPITHET_RULES) {
    const value = stats[rule.stat as keyof ActorRecord["stats"]]
    if (value >= rule.threshold && !existingLabels.has(rule.label)) {
      epithets.push({ label: rule.label, auto: true })
      ui.notifications?.info(`Codex | ${rule.label} desbloqueada!`)
    }
  }

  return epithets
}