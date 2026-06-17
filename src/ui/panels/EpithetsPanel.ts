import { getRecord, updateRecord } from "../../data/ActorRecord"
import type { ActorRecord, Epithet } from "../../types"

const escapeHtml = (value: string): string =>
  foundry.utils.escapeHTML(value)

export class EpithetsPanel {
  static activate(root: HTMLElement, signal: AbortSignal): void {
    root.addEventListener("click", (e) => {
      const addBtn = (e.target as HTMLElement).closest<HTMLElement>("[data-action='add-epithet']")
      if (addBtn) {
        void this._addEpithet(root, addBtn.dataset.actorId ?? "")
        return
      }

      const removeBtn = (e.target as HTMLElement).closest<HTMLElement>("[data-action='remove-epithet']")
      if (removeBtn) {
        void this._removeEpithet(root, removeBtn.dataset.actorId ?? "", removeBtn.dataset.label ?? "")
      }
    }, { signal })
  }

  private static async _addEpithet(root: HTMLElement, actorId: string): Promise<void> {
    const input = root.querySelector(
      `[data-detail="${actorId}"] [data-panel="epithets"] .codex-epithets-header .codex-input`
    ) as HTMLInputElement | null
    const label = input?.value.trim()
    if (!label) return

    const actor = game.actors?.get(actorId)
    if (!actor) return

    const record = getRecord(actor)
    if (record.epithets.some(e => e.label === label)) return

    const epithet: Epithet = { label, auto: false }
    await updateRecord(actor, { epithets: [...record.epithets, epithet] })
    if (input) input.value = ""
    this.refresh(root, actorId)
  }

  private static async _removeEpithet(root: HTMLElement, actorId: string, label: string): Promise<void> {
    const actor = game.actors?.get(actorId)
    if (!actor) return

    const record = getRecord(actor)
    await updateRecord(actor, {
      epithets: record.epithets.filter(e => e.label !== label)
    })
    this.refresh(root, actorId)
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
