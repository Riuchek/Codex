import { MODULE_ID, EPITHET_RULES } from "../constants"
import type { ActorRecord, Epithet } from "../types"

// fila por ator — garante que updates sejam sequenciais
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
    const newEpithets = checkEpithetRules(updatedStats, current.epithets)

    await actor.setFlag(MODULE_ID as any, "record", {
      ...current,
      stats: updatedStats,
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

function checkEpithetRules(
  stats: ActorRecord["stats"],
  current: Epithet[]
): Epithet[] {
  const manual = current.filter(e => !e.auto)

  const auto: Epithet[] = []
  for (const rule of EPITHET_RULES) {
    const value = stats[rule.stat as keyof ActorRecord["stats"]]
    if (value >= rule.threshold) {
      auto.push({ label: rule.label, auto: true })
    }
  }

  const previous = new Set(current.filter(e => e.auto).map(e => e.label))
  for (const epithet of auto) {
    if (!previous.has(epithet.label)) {
      ui.notifications?.info(`Codex | Nova alcunha desbloqueada: ${epithet.label}!`)
    }
  }

  return [...manual, ...auto]
}