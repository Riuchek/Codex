import { MODULE_ID } from "../constants"
import { getRecord, normalizeRecord, updateRecord } from "./ActorRecord"
import type { ActorRecord, CodexExport } from "../types"

export function buildExport(): CodexExport {
  const actors: Record<string, ActorRecord> = {}
  for (const actor of game.actors?.contents ?? []) {
    if (!actor.hasPlayerOwner || !actor.id) continue
    actors[actor.id] = getRecord(actor)
  }
  return {
    version: game.modules?.get(MODULE_ID)?.version ?? "0.0.0",
    exportedAt: Date.now(),
    actors,
  }
}

export async function importData(data: CodexExport): Promise<number> {
  let count = 0
  for (const [actorId, record] of Object.entries(data.actors ?? {})) {
    const actor = game.actors?.get(actorId)
    if (!actor?.hasPlayerOwner) continue
    await updateRecord(actor, normalizeRecord(record))
    count++
  }
  return count
}

export function downloadExport(data: CodexExport): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `codex-export-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function pickAndImport(): Promise<number> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json,.json"
    input.addEventListener("change", async () => {
      const file = input.files?.[0]
      if (!file) return resolve(0)
      try {
        const text = await file.text()
        const data = JSON.parse(text) as CodexExport
        if (!data.actors) throw new Error("Invalid Codex export")
        resolve(await importData(data))
      } catch {
        ui.notifications?.error(game.i18n?.localize("CODEX.ImportError") ?? "Import failed")
        resolve(0)
      }
    }, { once: true })
    input.click()
  })
}
