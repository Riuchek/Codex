import type { JournalEntry } from "../../types"

export class JournalEntryDialog {
  static async create(actorId: string): Promise<Omit<JournalEntry, "id" | "createdAt"> | null> {
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
    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title: opts.title },
      content: `
        <div style="display:flex;flex-direction:column;gap:8px;padding:8px">
          <input id="entry-title" type="text"
            value="${opts.initialTitle}"
            placeholder="${game.i18n?.localize("CODEX.EntryTitlePlaceholder") || ""}"
            style="width:100%"/>
          <textarea id="entry-content" rows="6"
            placeholder="${game.i18n?.localize("CODEX.EntryContentPlaceholder") || ""}"
            style="width:100%;resize:vertical">${opts.initialContent}</textarea>
          <div>
            <label style="font-size:12px;color:#aaa">
              ${game.i18n?.localize("CODEX.EntryTagsLabel") || ""}
            </label>
            <input id="entry-tags" type="text"
              value="${opts.initialTags}"
              placeholder="${game.i18n?.localize("CODEX.EntryTagsPlaceholder") || ""}"
              style="width:100%"/>
          </div>
        </div>
      `,
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