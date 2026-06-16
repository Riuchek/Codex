import { MODULE_ID } from "../constants"
import { getRules } from "./SettingsManager"
import { RuleEngine } from "../engine/RuleEngine"
import type { ActorRecord } from "../types"

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
  return actor.getFlag(MODULE_ID as any, "record") as ActorRecord | undefined
    ?? EMPTY_RECORD()
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
  })
}

function enqueue(actor: Actor, fn: () => Promise<void>): Promise<void> {
  const id = actor.id ?? ""
  const current = updateQueue.get(id) ?? Promise.resolve()
  const next = current.then(fn).catch(err => {
    console.error(`Codex | erro ao atualizar ${actor.name}:`, err)
    ui.notifications?.error(`Codex | Failed to update ${actor.name}. See console for details.`)
  })
  updateQueue.set(id, next)
  return next
}