import { MODULE_ID } from "../constants"
import { getRecord, updateRecord, updateStats } from "../data/ActorRecord"
import type { ActorRecord, JournalEntry, Epithet } from "../types"

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class CodexApp extends HandlebarsApplicationMixin(ApplicationV2) {
  private _hookId: number = -1
  private _activeActorId: string = ""
  private _activeTab: string = "stats"

  static override DEFAULT_OPTIONS = {
    id: "codex-app",
    window: { title: "Codex", resizable: true },
    position: { width: 720, height: 560 },
  }

  static override PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/codex.html`,
    },
  }

  override async _prepareContext(_options?: object): Promise<any> {
    const actors = (game.actors?.contents ?? [])
      .filter(a => a.hasPlayerOwner)
      .map(a => ({ id: a.id ?? "", record: getRecord(a) }))
  
    return { actors, isGM: game.user?.isGM ?? false }
  }

  override async _onRender(context: object, options: object): Promise<void> {
    await super._onRender(context, options)
  
    // restaura ator e tab anteriores, ou seleciona o primeiro
    const targetId = this._activeActorId ||
      (this.element.querySelector(".codex-actor-item") as HTMLElement)?.dataset.actorId || ""
    this._selectActor(targetId)
  


    this.element.querySelectorAll("[data-action='reset-stats']").forEach(el => {
      el.addEventListener("click", async () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const actor = game.actors?.get(actorId)
        if (!actor) return
    
        const confirmed = await foundry.applications.api.DialogV2.confirm({
          window: { title: "Resetar estatísticas" },
          content: `<p>Tem certeza? Todas as estatísticas de <strong>${actor.name}</strong> serão zeradas. Alcunhas automáticas também serão removidas.</p>`,
        })
    
        if (!confirmed) return
    
        const record = getRecord(actor)
        await updateRecord(actor, {
          stats: {
            damageDealt: 0,
            damageTaken: 0,
            criticals: 0,
            criticalFails: 0,
            killCount: 0,
          },
          epithets: record.epithets.filter(e => !e.auto)
        })
      })
    })


    // clique nos atores
    this.element.querySelectorAll(".codex-actor-item").forEach(el => {
      el.addEventListener("click", () => {
        const id = (el as HTMLElement).dataset.actorId ?? ""
        this._activeTab = "stats" // reset tab ao trocar de ator
        this._selectActor(id)
      })
    })
  
    // clique nas tabs
    this.element.querySelectorAll(".codex-tab").forEach(el => {
      el.addEventListener("click", () => {
        const tab = (el as HTMLElement).dataset.tab ?? ""
        const detail = el.closest(".codex-detail") as HTMLElement
        if (detail) this._switchTab(detail, tab)
      })
    })
  
    // nova entrada de diário
    this.element.querySelectorAll("[data-action='new-entry']").forEach(el => {
      el.addEventListener("click", () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        void this._newJournalEntry(actorId)
      })
    })
  
    // editar entrada
    this.element.querySelectorAll("[data-action='edit-entry']").forEach(el => {
      el.addEventListener("click", () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const entryId = (el as HTMLElement).dataset.entryId ?? ""
        void this._editJournalEntry(actorId, entryId)
      })
    })
  
    // deletar entrada
    this.element.querySelectorAll("[data-action='delete-entry']").forEach(el => {
      el.addEventListener("click", () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const entryId = (el as HTMLElement).dataset.entryId ?? ""
        void this._deleteJournalEntry(actorId, entryId)
      })
    })
  
    // adicionar alcunha manual
    this.element.querySelectorAll("[data-action='add-epithet']").forEach(el => {
      el.addEventListener("click", () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const input = this.element.querySelector(
          `.codex-input[data-actor-id="${actorId}"]`
        ) as HTMLInputElement
        if (input?.value.trim()) {
          void this._addEpithet(actorId, input.value.trim())
          input.value = ""
        }
      })
    })
  
    // remover alcunha manual
    this.element.querySelectorAll("[data-action='remove-epithet']").forEach(el => {
      el.addEventListener("click", () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const label = (el as HTMLElement).dataset.label ?? ""
        void this._removeEpithet(actorId, label)
      })
    })

    this.element.querySelectorAll(".stat-edit").forEach(el => {
      el.addEventListener("click", (e) => {
        e.stopPropagation()
        const li = (el as HTMLElement).closest("li")!
        const display = li.querySelector(".stat-display") as HTMLElement
        const input   = li.querySelector(".stat-input") as HTMLInputElement
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const stat    = (el as HTMLElement).dataset.stat ?? ""
    
        // toggle entre display e input
        const editing = input.style.display === "none"
        display.style.display = editing ? "none" : ""
        input.style.display   = editing ? "" : "none"
    
        if (editing) {
          input.focus()
          input.select()
    
          const save = async () => {
            const val = parseInt(input.value) || 0
            const actor = game.actors?.get(actorId)
            if (!actor) return
            const current = getRecord(actor)
            await updateStats(actor, { ...current.stats, [stat]: val })
            // render vai restaurar o display
          }
    
          input.addEventListener("blur", save, { once: true })
          input.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") input.blur()
            if (ev.key === "Escape") {
              input.style.display = "none"
              display.style.display = ""
            }
          }, { once: true })
        }
      })
    })
  
    // limpa hook anterior antes de registrar novo
    if (this._hookId !== -1) Hooks.off("updateActor" as any, this._hookId)
    this._hookId = Hooks.on("updateActor" as any, () => {
      void this.render()
    })
  }

  override async _onClose(options: object): Promise<void> {
    await super._onClose(options)
    if (this._hookId !== -1) Hooks.off("updateActor" as any, this._hookId)
  }

  // ── Seleção de ator ──────────────────────────────────────────────
  private _selectActor(actorId: string, tab?: string): void {
    this._activeActorId = actorId
  
    this.element.querySelectorAll(".codex-actor-item")
      .forEach(el => el.classList.remove("active"))
    this.element.querySelector(`[data-actor-id="${actorId}"]`)
      ?.classList.add("active")
  
    this.element.querySelectorAll(".codex-detail")
      .forEach(el => ((el as HTMLElement).style.display = "none"))
    const detail = this.element.querySelector(`[data-detail="${actorId}"]`) as HTMLElement
    if (detail) {
      detail.style.display = "flex"
      this._switchTab(detail, tab ?? this._activeTab)
    }
  }

  // ── Tabs ─────────────────────────────────────────────────────────
  private _switchTab(detail: HTMLElement, tab: string): void {
    this._activeTab = tab
  
    detail.querySelectorAll(".codex-tab")
      .forEach(el => el.classList.remove("active"))
    detail.querySelector(`[data-tab="${tab}"]`)?.classList.add("active")
  
    detail.querySelectorAll(".codex-panel")
      .forEach(el => ((el as HTMLElement).style.display = "none"))
    const panel = detail.querySelector(`[data-panel="${tab}"]`) as HTMLElement
    if (panel) panel.style.display = "block"
  }

  // ── Diário ───────────────────────────────────────────────────────
  private async _newJournalEntry(actorId: string): Promise<void> {
    const actor = game.actors?.get(actorId)
    if (!actor) return

    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title: "Nova entrada no diário" },
      content: `
        <div style="display:flex;flex-direction:column;gap:8px;padding:8px">
          <input id="entry-title" type="text" placeholder="Título (ex: Sessão 3, Dia do Eclipse...)" style="width:100%"/>
          <textarea id="entry-content" rows="6" placeholder="O que aconteceu..." style="width:100%;resize:vertical"></textarea>
          <div>
            <label style="font-size:12px;color:#aaa">Tags (separadas por vírgula)</label>
            <input id="entry-tags" type="text" placeholder="combate, npc, segredo..." style="width:100%"/>
          </div>
        </div>
      `,
      ok: {
        label: "Salvar",
        callback: (_event: Event, _btn: HTMLButtonElement, dialog: any) => {
          const el = dialog.element as HTMLElement
          const title   = (el.querySelector("#entry-title")   as HTMLInputElement).value.trim()
          const content = (el.querySelector("#entry-content") as HTMLTextAreaElement).value.trim()
          const tagsRaw = (el.querySelector("#entry-tags")    as HTMLInputElement).value
          const tags    = tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean)
          return { title, content, tags }
        }
      }
    }) as { title: string; content: string; tags: string[] } | null

    if (!result?.title && !result?.content) return

    const record = getRecord(actor)
    const entry: JournalEntry = {
      id: foundry.utils.randomID(),
      title: result.title || "Sem título",
      content: result.content,
      createdAt: Date.now(),
      tags: result.tags,
    }

    await updateRecord(actor, { journal: [...record.journal, entry] })
    void this.render()
  }

  private async _editJournalEntry(actorId: string, entryId: string): Promise<void> {
    const actor = game.actors?.get(actorId)
    if (!actor) return

    const record = getRecord(actor)
    const entry = record.journal.find(e => e.id === entryId)
    if (!entry) return

    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title: "Editar entrada" },
      content: `
        <div style="display:flex;flex-direction:column;gap:8px;padding:8px">
          <input id="entry-title" type="text" value="${entry.title}" style="width:100%"/>
          <textarea id="entry-content" rows="6" style="width:100%;resize:vertical">${entry.content}</textarea>
          <input id="entry-tags" type="text" value="${entry.tags.join(", ")}" style="width:100%"/>
        </div>
      `,
      ok: {
        label: "Salvar",
        callback: (_event: Event, _btn: HTMLButtonElement, dialog: any) => {
          const el = dialog.element as HTMLElement
          const title   = (el.querySelector("#entry-title")   as HTMLInputElement).value.trim()
          const content = (el.querySelector("#entry-content") as HTMLTextAreaElement).value.trim()
          const tagsRaw = (el.querySelector("#entry-tags")    as HTMLInputElement).value
          const tags    = tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean)
          return { title, content, tags }
        }
      }
    }) as { title: string; content: string; tags: string[] } | null

    if (!result) return

    await updateRecord(actor, {
      journal: record.journal.map(e => e.id === entryId ? { ...e, ...result } : e)
    })
    void this.render()
  }

  private async _deleteJournalEntry(actorId: string, entryId: string): Promise<void> {
    const actor = game.actors?.get(actorId)
    if (!actor) return

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Deletar entrada" },
      content: "<p>Tem certeza? Esta entrada será apagada permanentemente.</p>",
    })

    if (!confirmed) return

    const record = getRecord(actor)
    await updateRecord(actor, {
      journal: record.journal.filter(e => e.id !== entryId)
    })
    void this.render()
  }

  // ── Alcunhas ─────────────────────────────────────────────────────
  private async _addEpithet(actorId: string, label: string): Promise<void> {
    const actor = game.actors?.get(actorId)
    if (!actor) return

    const record = getRecord(actor)
    if (record.epithets.some(e => e.label === label)) return

    await updateRecord(actor, {
      epithets: [...record.epithets, { label, auto: false }]
    })
    void this.render()
  }

  private async _removeEpithet(actorId: string, label: string): Promise<void> {
    const actor = game.actors?.get(actorId)
    if (!actor) return

    const record = getRecord(actor)
    await updateRecord(actor, {
      epithets: record.epithets.filter(e => e.label !== label)
    })
    void this.render()
  }
}