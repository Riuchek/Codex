import { getRecord, updateRecord } from "../../data/ActorRecord"
import type { ActorRecord, Epithet } from "../../types"

const escapeHtml = (value: string): string =>
  foundry.utils.escapeHTML(value)

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

  static refresh(root: HTMLElement, actorId: string, record?: ActorRecord): void {
    const epithets = record?.epithets ?? getRecord(game.actors?.get(actorId)!).epithets
    const list = root.querySelector(
      `[data-detail="${actorId}"] [data-panel="epithets"] .codex-epithets-list`
    )
    if (!list) return

    if (!epithets.length) {
      list.innerHTML = `<p class="codex-empty">${escapeHtml(game.i18n?.localize("CODEX.EpithetEmpty") ?? "")}</p>`
      return
    }

    list.innerHTML = epithets.map(e => this._renderRow(e, actorId)).join("")
  }

  private static _renderRow(e: Epithet, actorId: string): string {
    const icon = e.icon
      ? escapeHtml(e.icon)
      : (e.auto ? "🎲" : "✍️")
    const colorAttr = e.color ? ` data-color="${escapeHtml(e.color)}"` : ""
    const removeBtn = e.auto ? "" : `
      <button class="codex-btn-icon" data-action="remove-epithet" data-label="${escapeHtml(e.label)}" data-actor-id="${escapeHtml(actorId)}">🗑️</button>`

    return `
      <div class="codex-epithet-row">
        <span class="epithet ${e.auto ? "auto" : ""}"${colorAttr}>
          ${icon} ${escapeHtml(e.label)}
        </span>
        ${removeBtn}
      </div>`
  }
}