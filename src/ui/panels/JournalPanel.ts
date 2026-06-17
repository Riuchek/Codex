import { getRecord, updateRecord } from "../../data/ActorRecord"
import { renderMarkdown } from "../../utils/markdown"
import { JournalEntryDialog } from "../dialogs/JournalEntryDialog"
import type { ActorRecord, JournalEntry } from "../../types"

const escapeHtml = (value: string): string =>
  foundry.utils.escapeHTML(value)

export class JournalPanel {
  static activate(root: HTMLElement, signal: AbortSignal): void {
    root.addEventListener("click", (e) => void this._handleClick(root, e), { signal })

    root.querySelectorAll(".journal-search").forEach(el => {
      el.addEventListener("input", () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        this._applyFilter(root, actorId)
      }, { signal })
    })

    root.querySelectorAll(".codex-detail").forEach(detail => {
      const actorId = (detail as HTMLElement).dataset.detail ?? ""
      if (actorId) this._applyFilter(root, actorId)
    })
  }

  private static async _handleClick(root: HTMLElement, e: Event): Promise<void> {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-action]")
    if (!target) return

    switch (target.dataset.action) {
      case "journal-filter-all": {
        const actorId = target.dataset.actorId ?? ""
        const toolbar = root.querySelector(`[data-journal-toolbar="${actorId}"]`)
        toolbar?.querySelectorAll(".journal-tag-chip").forEach(chip => chip.classList.remove("active"))
        target.classList.add("active")
        this._applyFilter(root, actorId)
        break
      }
      case "journal-tag-filter": {
        const actorId = target.dataset.actorId ?? ""
        const toolbar = root.querySelector(`[data-journal-toolbar="${actorId}"]`)
        const isActive = target.classList.contains("active")
        toolbar?.querySelectorAll(".journal-tag-chip").forEach(chip => chip.classList.remove("active"))
        if (!isActive) target.classList.add("active")
        this._applyFilter(root, actorId)
        break
      }
      case "new-entry":
        await this._createEntry(root, target.dataset.actorId ?? "")
        break
      case "edit-entry":
        await this._editEntry(root, target.dataset.actorId ?? "", target.dataset.entryId ?? "")
        break
      case "delete-entry":
        await this._deleteEntry(root, target.dataset.actorId ?? "", target.dataset.entryId ?? "")
        break
    }
  }

  private static _applyFilter(root: HTMLElement, actorId: string): void {
    const actor = game.actors?.get(actorId)
    if (!actor) return
    const record = getRecord(actor)
    const search = (
      root.querySelector(`.journal-search[data-actor-id="${actorId}"]`) as HTMLInputElement | null
    )?.value.trim().toLowerCase() ?? ""
    const activeTag = root.querySelector(
      `[data-journal-toolbar="${actorId}"] .journal-tag-chip.active`
    ) as HTMLElement | null
    const tagFilter = activeTag?.dataset.tag?.toLowerCase() ?? ""

    const filtered = record.journal.filter(entry => {
      const matchesSearch = !search ||
        entry.title.toLowerCase().includes(search) ||
        entry.content.toLowerCase().includes(search) ||
        entry.tags.some(t => t.toLowerCase().includes(search))
      const matchesTag = !tagFilter ||
        entry.tags.some(t => t.toLowerCase() === tagFilter)
      return matchesSearch && matchesTag
    })

    this._renderEntries(root, actorId, filtered)
  }

  private static async _createEntry(root: HTMLElement, actorId: string): Promise<void> {
    const actor = game.actors?.get(actorId)
    if (!actor) return

    const result = await JournalEntryDialog.create()
    if (!result) return

    const record = getRecord(actor)
    const entry: JournalEntry = {
      id: foundry.utils.randomID(),
      createdAt: Date.now(),
      ...result,
    }
    await updateRecord(actor, { journal: [...record.journal, entry] })
    this.refresh(root, actorId, { ...record, journal: [...record.journal, entry] })
    this._applyFilter(root, actorId)
  }

  private static async _editEntry(root: HTMLElement, actorId: string, entryId: string): Promise<void> {
    const actor = game.actors?.get(actorId)
    if (!actor) return

    const record = getRecord(actor)
    const entry = record.journal.find(e => e.id === entryId)
    if (!entry) return

    const result = await JournalEntryDialog.edit(entry)
    if (!result) return

    const journal = record.journal.map(e => e.id === entryId ? { ...e, ...result } : e)
    await updateRecord(actor, { journal })
    this.refresh(root, actorId, { ...record, journal })
    this._applyFilter(root, actorId)
  }

  private static async _deleteEntry(root: HTMLElement, actorId: string, entryId: string): Promise<void> {
    const actor = game.actors?.get(actorId)
    if (!actor) return

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window:  { title: game.i18n?.localize("CODEX.DeleteEntryTitle") || "" },
      content: game.i18n?.localize("CODEX.DeleteEntryContent") || "",
    })
    if (!confirmed) return

    const record = getRecord(actor)
    const journal = record.journal.filter(e => e.id !== entryId)
    await updateRecord(actor, { journal })
    this.refresh(root, actorId, { ...record, journal })
    this._applyFilter(root, actorId)
  }

  static refresh(root: HTMLElement, actorId: string, record?: ActorRecord): void {
    const actor = game.actors?.get(actorId)
    if (!actor) return
    const data = record ?? getRecord(actor)
    this._applyFilter(root, actorId)
    void data
  }

  private static _renderEntries(root: HTMLElement, actorId: string, journal: JournalEntry[]): void {
    const container = root.querySelector(
      `[data-detail="${actorId}"] [data-panel="journal"] .codex-entries`
    )
    if (!container) return

    if (!journal.length) {
      container.innerHTML = `<p class="codex-empty">${escapeHtml(game.i18n?.localize("CODEX.EntryEmpty") ?? "")}</p>`
      return
    }

    container.innerHTML = journal
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(entry => this._renderEntry(entry, actorId))
      .join("")
  }

  private static _renderEntry(entry: JournalEntry, actorId: string): string {
    return `
      <div class="codex-entry" data-entry-id="${escapeHtml(entry.id)}">
        <div class="codex-entry-header">
          <span class="codex-entry-title">${escapeHtml(entry.title)}</span>
          <div class="codex-entry-actions">
            <button class="codex-btn-icon" data-action="edit-entry" data-entry-id="${escapeHtml(entry.id)}" data-actor-id="${escapeHtml(actorId)}">✏️</button>
            <button class="codex-btn-icon" data-action="delete-entry" data-entry-id="${escapeHtml(entry.id)}" data-actor-id="${escapeHtml(actorId)}">🗑️</button>
          </div>
        </div>
        <div class="codex-entry-content">${renderMarkdown(entry.content)}</div>
        <div class="codex-entry-tags">
          ${entry.tags.map(tag => `<span class="codex-tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>`
  }
}
