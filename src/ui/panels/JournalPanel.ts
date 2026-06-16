import { getRecord, updateRecord } from "../../data/ActorRecord"
import { JournalEntryDialog } from "../dialogs/JournalEntryDialog"
import type { ActorRecord, JournalEntry } from "../../types"

const escapeHtml = (value: string): string =>
  foundry.utils.escapeHTML(value)

export class JournalPanel {
  static activate(root: HTMLElement, signal: AbortSignal): void {
    root.querySelectorAll("[data-action='new-entry']").forEach(el => {
      el.addEventListener("click", async () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const actor   = game.actors?.get(actorId)
        if (!actor) return

        const result = await JournalEntryDialog.create(actorId)
        if (!result) return

        const record = getRecord(actor)
        const entry: JournalEntry = {
          id: foundry.utils.randomID(),
          createdAt: Date.now(),
          ...result,
        }
        await updateRecord(actor, { journal: [...record.journal, entry] })
      }, { signal })
    })

    root.querySelectorAll("[data-action='edit-entry']").forEach(el => {
      el.addEventListener("click", async () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const entryId = (el as HTMLElement).dataset.entryId ?? ""
        const actor   = game.actors?.get(actorId)
        if (!actor) return

        const record = getRecord(actor)
        const entry  = record.journal.find(e => e.id === entryId)
        if (!entry) return

        const result = await JournalEntryDialog.edit(entry)
        if (!result) return

        await updateRecord(actor, {
          journal: record.journal.map(e => e.id === entryId ? { ...e, ...result } : e)
        })
      }, { signal })
    })

    root.querySelectorAll("[data-action='delete-entry']").forEach(el => {
      el.addEventListener("click", async () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const entryId = (el as HTMLElement).dataset.entryId ?? ""
        const actor   = game.actors?.get(actorId)
        if (!actor) return

        const confirmed = await foundry.applications.api.DialogV2.confirm({
          window:  { title: game.i18n?.localize("CODEX.DeleteEntryTitle") || "" },
          content: game.i18n?.localize("CODEX.DeleteEntryContent") || "",
        })
        if (!confirmed) return

        const record = getRecord(actor)
        await updateRecord(actor, {
          journal: record.journal.filter(e => e.id !== entryId)
        })
      }, { signal })
    })
  }

  static refresh(root: HTMLElement, actorId: string, record?: ActorRecord): void {
    const journal = record?.journal ?? getRecord(game.actors?.get(actorId)!).journal
    const container = root.querySelector(
      `[data-detail="${actorId}"] [data-panel="journal"] .codex-entries`
    )
    if (!container) return

    if (!journal.length) {
      container.innerHTML = `<p class="codex-empty">${escapeHtml(game.i18n?.localize("CODEX.EntryEmpty") ?? "")}</p>`
      return
    }

    container.innerHTML = journal.map(entry => `
      <div class="codex-entry" data-entry-id="${escapeHtml(entry.id)}">
        <div class="codex-entry-header">
          <span class="codex-entry-title">${escapeHtml(entry.title)}</span>
          <div class="codex-entry-actions">
            <button class="codex-btn-icon" data-action="edit-entry" data-entry-id="${escapeHtml(entry.id)}" data-actor-id="${escapeHtml(actorId)}">✏️</button>
            <button class="codex-btn-icon" data-action="delete-entry" data-entry-id="${escapeHtml(entry.id)}" data-actor-id="${escapeHtml(actorId)}">🗑️</button>
          </div>
        </div>
        <p class="codex-entry-content">${escapeHtml(entry.content)}</p>
        <div class="codex-entry-tags">
          ${entry.tags.map(tag => `<span class="codex-tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
    `).join("")
  }
}