import { getDefaultTags } from "../../constants"
import type { JournalEntry } from "../../types"

const escapeHtml = (value: string): string =>
  foundry.utils.escapeHTML(value)

export class JournalEntryDialog {
  static async create(): Promise<Omit<JournalEntry, "id" | "createdAt"> | null> {
    return this._open({
      title: game.i18n?.localize("CODEX.NewEntryTitle") || "",
      initialTitle: "",
      initialContent: "",
      initialTags: "",
    })
  }

  static async edit(entry: JournalEntry): Promise<Omit<JournalEntry, "id" | "createdAt"> | null> {
    return this._open({
      title: game.i18n?.localize("CODEX.EditEntryTitle") || "",
      initialTitle: entry.title,
      initialContent: entry.content,
      initialTags: entry.tags.join(", "),
    })
  }

  private static async _open(opts: {
    title: string
    initialTitle: string
    initialContent: string
    initialTags: string
  }): Promise<Omit<JournalEntry, "id" | "createdAt"> | null> {
    const tagChips = getDefaultTags().map(tag =>
      `<button type="button" class="entry-tag-suggest" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`
    ).join("")

    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title: opts.title },
      content: `
        <div class="codex-entry-editor">
          <input id="entry-title" type="text"
            value="${escapeHtml(opts.initialTitle)}"
            placeholder="${escapeHtml(game.i18n?.localize("CODEX.EntryTitlePlaceholder") || "")}"/>
          <textarea id="entry-content" rows="8"
            placeholder="${escapeHtml(game.i18n?.localize("CODEX.EntryContentPlaceholder") || "")}">${escapeHtml(opts.initialContent)}</textarea>
          <p class="entry-markdown-hint">${game.i18n?.localize("CODEX.EntryMarkdownHint") || ""}</p>
          <div>
            <label class="entry-tags-label">${game.i18n?.localize("CODEX.EntryTagsLabel") || ""}</label>
            <div class="entry-tag-suggestions">${tagChips}</div>
            <input id="entry-tags" type="text"
              value="${escapeHtml(opts.initialTags)}"
              placeholder="${escapeHtml(game.i18n?.localize("CODEX.EntryTagsPlaceholder") || "")}"/>
          </div>
        </div>
      `,
      render: (_event: Event, dialog: { element: HTMLElement }) => {
        dialog.element.querySelectorAll(".entry-tag-suggest").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.preventDefault()
            const input = dialog.element.querySelector("#entry-tags") as HTMLInputElement
            const tag = (btn as HTMLElement).dataset.tag ?? ""
            const current = input.value.split(",").map(t => t.trim()).filter(Boolean)
            if (!current.includes(tag)) current.push(tag)
            input.value = current.join(", ")
          })
        })
      },
      ok: {
        label: game.i18n?.localize("CODEX.EntrySave") || "",
        callback: (_e: Event, _btn: HTMLButtonElement, dialog: any) => {
          const el = dialog.element as HTMLElement
          const title   = (el.querySelector("#entry-title")   as HTMLInputElement).value.trim()
          const content = (el.querySelector("#entry-content") as HTMLTextAreaElement).value.trim()
          const tagsRaw = (el.querySelector("#entry-tags")    as HTMLInputElement).value
          const tags    = tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean)
          return { title, content, tags }
        }
      }
    }) as { title: string; content: string; tags: string[] } | null

    if (!result) return null
    return {
      title:   result.title || game.i18n?.localize("CODEX.EntryNoTitle") || "",
      content: result.content,
      tags:    result.tags,
    }
  }
}
