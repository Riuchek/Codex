import { getRecord, updateRecord } from "../../data/ActorRecord"
import type { Epithet } from "../../types"

export class EpithetsPanel {
  static activate(root: HTMLElement, signal: AbortSignal): void {
    root.querySelectorAll("[data-action='add-epithet']").forEach(el => {
      el.addEventListener("click", async () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const input   = root.querySelector(
          `.codex-input[data-actor-id="${actorId}"]`
        ) as HTMLInputElement
        const label = input?.value.trim()
        if (!label) return

        const actor = game.actors?.get(actorId)
        if (!actor) return

        const record = getRecord(actor)
        if (record.epithets.some(e => e.label === label)) return

        const epithet: Epithet = { label, auto: false }
        await updateRecord(actor, { epithets: [...record.epithets, epithet] })
        input.value = ""
      }, { signal })
    })

    root.querySelectorAll("[data-action='remove-epithet']").forEach(el => {
      el.addEventListener("click", async () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const label   = (el as HTMLElement).dataset.label   ?? ""
        const actor   = game.actors?.get(actorId)
        if (!actor) return

        const record = getRecord(actor)
        await updateRecord(actor, {
          epithets: record.epithets.filter(e => e.label !== label)
        })
      }, { signal })
    })
  }
}