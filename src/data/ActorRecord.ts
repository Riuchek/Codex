import { MODULE_ID } from "../constants"
import { getRules } from "./SettingsManager"
import { RuleEngine } from "../engine/RuleEngine"
import { actorUpdateQueue } from "./updateQueue"
import type { ActorRecord, CombatStats } from "../types"

export const EMPTY_STATS = (): CombatStats => ({
  damageDealt: 0,
  damageTaken: 0,
  criticals: 0,
  criticalFails: 0,
  killCount: 0,
})

export const EMPTY_RECORD = (): ActorRecord => ({
  name: "",
  img: "",
  stats: EMPTY_STATS(),
  epithets: [],
  journal: [],
})

export function normalizeRecord(raw: Partial<ActorRecord>): ActorRecord {
  const base = { ...EMPTY_RECORD(), ...raw }
  return {
    ...base,
    stats: { ...EMPTY_STATS(), ...raw.stats },
    epithets: raw.epithets ?? [],
    journal: raw.journal ?? [],
  }
}

export function getRecord(actor: Actor): ActorRecord {
  const raw = actor.getFlag(MODULE_ID as any, "record") as Partial<ActorRecord> | undefined
  if (!raw) return EMPTY_RECORD()
  return normalizeRecord(raw)
}

export async function initRecord(actor: Actor): Promise<void> {
  const existing = actor.getFlag(MODULE_ID as any, "record")
  if (existing) return

  await actor.setFlag(MODULE_ID as any, "record", {
    ...EMPTY_RECORD(),
    name: actor.name ?? "",
    img:  actor.img  ?? "",
  })
}

export async function updateRecord(
  actor: Actor,
  patch: Partial<ActorRecord>
): Promise<void> {
  return enqueue(actor, async () => {
    const current = getRecord(actor)
    await actor.setFlag(MODULE_ID as any, "record", normalizeRecord({ ...current, ...patch }))
  })
}

export async function updateStats(
  actor: Actor,
  patch: Partial<CombatStats>
): Promise<void> {
  return enqueue(actor, async () => {
    const current = getRecord(actor)
    const updatedStats = { ...current.stats, ...patch }
    await writeStats(actor, current, updatedStats)
  })
}

export async function incrementStats(
  actor: Actor,
  delta: Partial<CombatStats>
): Promise<void> {
  return enqueue(actor, async () => {
    const current = getRecord(actor)
    const updatedStats = { ...current.stats }
    for (const [key, value] of Object.entries(delta) as [keyof CombatStats, number][]) {
      if (value === undefined) continue
      updatedStats[key] += value
    }
    await writeStats(actor, current, updatedStats)
  })
}

export async function resetAllStats(actor: Actor): Promise<void> {
  const current = getRecord(actor)
  await updateRecord(actor, {
    stats: EMPTY_STATS(),
    epithets: current.epithets.filter(e => !e.auto),
  })
}

async function writeStats(
  actor: Actor,
  current: ActorRecord,
  updatedStats: CombatStats
): Promise<void> {
  const rules = getRules(actor.id ?? "")
  const { epithets, newlyUnlocked } = RuleEngine.apply(updatedStats, rules, current.epithets)

  for (const epithet of newlyUnlocked) {
    ui.notifications?.info(
      `Codex | ${game.i18n?.format("CODEX.NotifEpithet", { label: epithet.label })}`
    )
  }

  await actor.setFlag(MODULE_ID as any, "record", {
    ...current,
    stats: updatedStats,
    epithets,
  })
}

function enqueue(actor: Actor, fn: () => Promise<void>): Promise<void> {
  const id = actor.id ?? ""
  return actorUpdateQueue.enqueue(id, fn).catch(err => {
    console.error(`Codex | failed to update ${actor.name}:`, err)
    ui.notifications?.error(`Codex | ${game.i18n?.format("CODEX.UpdateError", { name: actor.name ?? "" })}`)
  })
}
