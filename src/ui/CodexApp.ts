import { MODULE_ID } from "../constants"
import { getRecord, refreshEpithets, updateRecord, updateStats } from "../data/ActorRecord"
import { setTrackingActorId } from "../data/trackingActor"
import { getSettings, saveSettings, saveRule, deleteRule } from "../data/SettingsManager"
import type { JournalEntry, EpithetRule, Condition } from "../types"

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
    const settings = getSettings()
    const globalRules = settings.rules.filter((r: EpithetRule) => r.scope === "global")
  
    const actors = (game.actors?.contents ?? [])
      .filter(a => a.hasPlayerOwner)
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
      .map(a => ({
        id: a.id ?? "",
        record: getRecord(a),
        actorRules: settings.rules.filter((r: EpithetRule) => r.scope === "actor" && r.actorId === a.id)
      }))
  
    return { actors, isGM: game.user?.isGM ?? false, settings, globalRules }
  }

  override async _onRender(context: object, options: object): Promise<void> {
    await super._onRender(context, options)
  
    const targetId = this._activeActorId ||
      (this.element.querySelector(".codex-actor-item") as HTMLElement)?.dataset.actorId || ""
    this._selectActor(targetId)

    this.element.querySelectorAll<HTMLElement>(".rule-label[data-color]").forEach(el => {
      const color = el.dataset.color
      if (color) el.style.color = color
    })

    this.element.querySelectorAll<HTMLElement>(".epithet[data-color]").forEach(el => {
      const color = el.dataset.color
      if (!color) return
      el.style.color = color
      el.style.borderColor = color
    })
  


    this.element.querySelectorAll("[data-action='reset-stats']").forEach(el => {
      el.addEventListener("click", async () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const actor = game.actors?.get(actorId)
        if (!actor) return
    
        const confirmed = await foundry.applications.api.DialogV2.confirm({
          window: { title: game.i18n?.localize("CODEX.ResetConfirmTitle") },
          content: game.i18n?.format("CODEX.ResetConfirmContent", { name: actor.name }),
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


        
    this.element.querySelectorAll("[data-action='save-system-settings']").forEach(el => {
      el.addEventListener("click", async () => {
        const settingsPanel = (el as HTMLElement).closest("[data-panel='settings']") as HTMLElement | null
        const hpPath = settingsPanel?.querySelector<HTMLInputElement>("[data-setting='hpPath']")?.value.trim() ?? ""
        const attackFlavor = settingsPanel?.querySelector<HTMLInputElement>("[data-setting='attackFlavor']")?.value.trim() ?? ""
        if (hpPath) await saveSettings({ hpPath, attackFlavor })
        ui.notifications?.info("Codex | Settings saved.")
      })
    })

    
    this.element.querySelectorAll("[data-action='new-global-rule'], [data-action='new-actor-rule']").forEach(el => {
      el.addEventListener("click", () => {
        const actorId = (el as HTMLElement).dataset.actorId
        void this._openRuleEditor(null, actorId || undefined)
      })
    })

   
    this.element.querySelectorAll("[data-action='edit-rule']").forEach(el => {
      el.addEventListener("click", () => {
        const ruleId = (el as HTMLElement).dataset.ruleId ?? ""
        const settings = getSettings()
        const rule = settings.rules.find(r => r.id === ruleId) ?? null
        void this._openRuleEditor(rule)
      })
    })

    this.element.querySelectorAll("[data-action='delete-rule']").forEach(el => {
      el.addEventListener("click", async () => {
        const ruleId = (el as HTMLElement).dataset.ruleId ?? ""
        const settings = getSettings()
        const rule = settings.rules.find(r => r.id === ruleId)
        const confirmed = await foundry.applications.api.DialogV2.confirm({
          window: { title: "Delete Rule" },
          content: "<p>Delete this epithet rule? Characters who earned it will keep their epithet.</p>",
        })
        if (!confirmed) return
        await deleteRule(ruleId)
        await this._refreshRuleActors(rule?.scope === "actor" ? rule.actorId : undefined)
        void this.render()
      })
    })


    this.element.querySelectorAll(".codex-actor-item").forEach(el => {
      el.addEventListener("click", () => {
        const id = (el as HTMLElement).dataset.actorId ?? ""
        this._activeTab = "stats"
        this._selectActor(id)
      })
    })
  
    this.element.querySelectorAll(".codex-tab").forEach(el => {
      el.addEventListener("click", () => {
        const tab = (el as HTMLElement).dataset.tab ?? ""
        const detail = el.closest(".codex-detail") as HTMLElement
        if (detail) this._switchTab(detail, tab)
      })
    })
  
    this.element.querySelectorAll("[data-action='new-entry']").forEach(el => {
      el.addEventListener("click", () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        void this._newJournalEntry(actorId)
      })
    })
  
    this.element.querySelectorAll("[data-action='edit-entry']").forEach(el => {
      el.addEventListener("click", () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const entryId = (el as HTMLElement).dataset.entryId ?? ""
        void this._editJournalEntry(actorId, entryId)
      })
    })
  
    this.element.querySelectorAll("[data-action='delete-entry']").forEach(el => {
      el.addEventListener("click", () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const entryId = (el as HTMLElement).dataset.entryId ?? ""
        void this._deleteJournalEntry(actorId, entryId)
      })
    })
  
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
  
    if (this._hookId !== -1) Hooks.off("updateActor" as any, this._hookId)
    this._hookId = Hooks.on("updateActor" as any, () => {
      void this.render()
    })
  }

  override async _onClose(options: object): Promise<void> {
    await super._onClose(options)
    if (this._hookId !== -1) Hooks.off("updateActor" as any, this._hookId)
  }

  private async _openRuleEditor(rule: EpithetRule | null, actorId?: string): Promise<void> {
    const isNew = !rule
    const current: EpithetRule = rule ?? {
      id: foundry.utils.randomID(),
      label: "",
      color: "#c9922a",
      icon: "⚔️",
      scope: actorId ? "actor" : "global",
      actorId,
      conditionMode: "all",
      conditions: [{ stat: "killCount", operator: ">=", threshold: 1 }],
    }
  
    const conditionHTML = (c: Condition, i: number) => `
      <div class="rule-condition-row" data-index="${i}">
        <select class="cond-stat" data-index="${i}">
          ${["killCount","criticals","criticalFails","damageDealt","damageTaken"].map(s =>
            `<option value="${s}" ${c.stat === s ? "selected" : ""}>${s}</option>`
          ).join("")}
        </select>
        <select class="cond-op" data-index="${i}">
          ${[">=","<=","==",">","<"].map(op =>
            `<option value="${op}" ${c.operator === op ? "selected" : ""}>${op}</option>`
          ).join("")}
        </select>
        <input class="cond-threshold codex-input" type="number" min="0" step="1" value="${c.threshold}" data-index="${i}"/>
        <button class="codex-btn-icon remove-condition" type="button" data-index="${i}">🗑️</button>
      </div>
    `

    const onRuleEditorClick = (event: MouseEvent) => {
      if (!(event.target instanceof HTMLElement)) return

      const addButton = event.target.closest("#add-condition")
      if (addButton) {
        event.preventDefault()
        event.stopPropagation()
        const editor = addButton.closest(".codex-rule-editor")
        const conditions = editor?.querySelector("#rule-conditions")
        const index = conditions?.querySelectorAll(".rule-condition-row").length ?? 0
        conditions?.insertAdjacentHTML("beforeend", conditionHTML({
          stat: "killCount",
          operator: ">=",
          threshold: 1
        }, index))
        return
      }

      const removeButton = event.target.closest(".remove-condition")
      if (removeButton) {
        event.preventDefault()
        event.stopPropagation()
        removeButton.closest(".rule-condition-row")?.remove()
      }
    }

    const conditionsHTML = current.conditions.map(conditionHTML).join("")
  
    document.addEventListener("click", onRuleEditorClick, true)

    let result: { label: string; color: string; icon: string; conditionMode: "all" | "any"; conditions: Condition[] } | null = null
    try {
      result = await foundry.applications.api.DialogV2.prompt({
        window: { title: isNew ? "New Epithet Rule" : "Edit Epithet Rule" },
        content: `
          <div class="codex-rule-editor">
            <div class="rule-main-row">
              <input id="rule-icon"  type="text"  value="${current.icon}" placeholder="⚔️"/>
              <input id="rule-label" type="text"  value="${current.label}" placeholder="Epithet name"/>
              <input id="rule-color" type="color" value="${current.color}"/>
            </div>
            <div class="rule-mode-row">
              <label>Conditions match:</label>
              <select id="rule-mode">
                <option value="all" ${current.conditionMode === "all" ? "selected" : ""}>ALL (AND)</option>
                <option value="any" ${current.conditionMode === "any" ? "selected" : ""}>ANY (OR)</option>
              </select>
            </div>
            <div id="rule-conditions">${conditionsHTML}</div>
            <button id="add-condition" class="codex-btn" type="button">+ Add Condition</button>
          </div>
        `,
        ok: {
          label: "Save",
          callback: (_event: Event, _btn: HTMLButtonElement, dialog: any) => {
            const el = dialog.element as HTMLElement
            const label = (el.querySelector("#rule-label") as HTMLInputElement).value.trim()
            const color = (el.querySelector("#rule-color") as HTMLInputElement).value
            const icon  = (el.querySelector("#rule-icon")  as HTMLInputElement).value.trim()
            const conditionMode = (el.querySelector("#rule-mode") as HTMLSelectElement).value as "all" | "any"
    
            const conditions: Condition[] = []
            el.querySelectorAll(".rule-condition-row").forEach(row => {
              const stat      = (row.querySelector(".cond-stat")       as HTMLSelectElement).value
              const operator  = (row.querySelector(".cond-op")         as HTMLSelectElement).value
              const threshold = parseInt((row.querySelector(".cond-threshold") as HTMLInputElement).value) || 0
              conditions.push({ stat: stat as any, operator: operator as any, threshold })
            })
    
            return { label, color, icon, conditionMode, conditions }
          }
        }
      }) as { label: string; color: string; icon: string; conditionMode: "all" | "any"; conditions: Condition[] } | null
    } finally {
      document.removeEventListener("click", onRuleEditorClick, true)
    }
  
    if (!result?.label) return
  
    const savedRule = { ...current, ...result }
    await saveRule(savedRule)
    await this._refreshRuleActors(savedRule.scope === "actor" ? savedRule.actorId : undefined)
    void this.render()
  }

  private async _refreshRuleActors(actorId?: string): Promise<void> {
    if (actorId) {
      const actor = game.actors?.get(actorId)
      if (actor) await refreshEpithets(actor)
      return
    }

    const actors = (game.actors?.contents ?? []).filter(actor => actor.hasPlayerOwner)
    await Promise.all(actors.map(actor => refreshEpithets(actor)))
  }


  private _selectActor(actorId: string, tab?: string): void {
    this._activeActorId = actorId
    setTrackingActorId(actorId)
  
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

  private async _newJournalEntry(actorId: string): Promise<void> {
    const actor = game.actors?.get(actorId)
    if (!actor) return

    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n?.localize("CODEX.NewEntryTitle") },
      content: `
        <div style="display:flex;flex-direction:column;gap:8px;padding:8px">
          <input id="entry-title" type="text" placeholder="${game.i18n?.localize("CODEX.EntryTitlePlaceholder")}" style="width:100%"/>
          <textarea id="entry-content" rows="6" placeholder="${game.i18n?.localize("CODEX.EntryContentPlaceholder")}" style="width:100%;resize:vertical"></textarea>
          <div>
            <label style="font-size:12px;color:#aaa">${game.i18n?.localize("CODEX.EntryTagsLabel")}</label>
            <input id="entry-tags" type="text" placeholder="${game.i18n?.localize("CODEX.EntryTagsPlaceholder")}" style="width:100%"/>
          </div>
        </div>
      `,
      ok: {
        label: game.i18n?.localize("CODEX.EntrySave"),
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
      title: result.title ?? game.i18n?.localize("CODEX.EntryNoTitle") ?? "",
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
      window: { title: game.i18n?.localize("CODEX.DeleteEntryTitle") },
      content: game.i18n?.format("CODEX.DeleteEntryContent", { name: actor.name }),
    })

    if (!confirmed) return

    const record = getRecord(actor)
    await updateRecord(actor, {
      journal: record.journal.filter(e => e.id !== entryId)
    })
    void this.render()
  }

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