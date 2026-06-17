import { MODULE_ID } from "../constants"
import { getRecord, initRecord } from "../data/ActorRecord"
import { CODEX_SETTINGS_KEY, getSettings } from "../data/SettingsManager"
import { StatsPanel }    from "./panels/StatsPanel"
import { JournalPanel }  from "./panels/JournalPanel"
import { EpithetsPanel } from "./panels/EpithetsPanel"
import { SettingsPanel } from "./panels/SettingsPanel"
import { DashboardPanel } from "./panels/DashboardPanel"
import type { ActorRecord, EpithetRule, CodexSettings } from "../types"

export interface CodexAppState {
  activeActorId: string
  activeTab: string
  view: "actors" | "dashboard"
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class CodexApp extends HandlebarsApplicationMixin(ApplicationV2) {
  private _state: CodexAppState = { activeActorId: "", activeTab: "stats", view: "actors" }
  private _hookId: number = -1
  private _settingsHookId: number = -1
  private _abortController: AbortController | null = null

  static override DEFAULT_OPTIONS = {
    id: "codex-app",
    window: { title: "Codex", resizable: true },
    position: { width: 900, height: 600 },
  }

  static override PARTS = {
    main: { template: `modules/${MODULE_ID}/templates/codex.html` },
  }

  override async _prepareContext(_options?: object): Promise<any> {
    const settings    = getSettings()
    const globalRules = settings.rules.filter(r => r.scope === "global")

    const actors = (game.actors?.contents ?? [])
      .filter(a => a.hasPlayerOwner)
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
      .map(a => ({
        id:         a.id ?? "",
        record:     getRecord(a),
        actorRules: settings.rules.filter(r => r.scope === "actor" && r.actorId === a.id),
      }))

    await Promise.all(
      (game.actors?.contents ?? [])
        .filter(a => a.hasPlayerOwner)
        .map(a => initRecord(a))
    )

    return {
      actors,
      isGM: game.user?.isGM ?? false,
      settings,
      globalRules,
      dashboardHtml: DashboardPanel.render(actors),
    }
  }

  override async _onRender(context: object, options: object): Promise<void> {
    await super._onRender(context, options)

    this._abortController?.abort()
    this._abortController = new AbortController()
    const { signal } = this._abortController

    if (this._state.view === "dashboard") {
      this._showDashboard()
    } else {
      const targetId = this._state.activeActorId ||
        (this.element.querySelector(".codex-actor-item") as HTMLElement)?.dataset.actorId || ""
      this._showActors()
      this._selectActor(targetId)
    }

    this.element.querySelectorAll(".codex-actor-item").forEach(el => {
      el.addEventListener("click", () => {
        this._state.view = "actors"
        this._state.activeTab = "stats"
        this._showActors()
        this._selectActor((el as HTMLElement).dataset.actorId ?? "")
      }, { signal })
    })

    this.element.querySelector("[data-action='open-dashboard']")?.addEventListener("click", () => {
      this._state.view = "dashboard"
      DashboardPanel.refresh(this.element)
      this._showDashboard()
    }, { signal })

    this.element.addEventListener("codex-close-dashboard", () => {
      this._state.view = "actors"
      this._showActors()
      this._selectActor(this._state.activeActorId)
    }, { signal })

    this.element.querySelectorAll(".codex-tab").forEach(el => {
      el.addEventListener("click", () => {
        const tab    = (el as HTMLElement).dataset.tab ?? ""
        const detail = el.closest(".codex-detail") as HTMLElement
        if (detail) this._switchTab(detail, tab)
      }, { signal })
    })

    this.element.addEventListener("codex-import-done", () => {
      void this.render()
    }, { signal })

    StatsPanel.activate(this.element, this._state, signal)
    JournalPanel.activate(this.element, signal)
    EpithetsPanel.activate(this.element, signal)
    if (game.user?.isGM) {
      SettingsPanel.activate(this.element, signal)
      DashboardPanel.activate(this.element, signal)
    }

    if (this._hookId !== -1) Hooks.off("updateActor" as any, this._hookId)
    this._hookId = Hooks.on("updateActor" as any, (actor: Actor) => {
      if (this._state.view === "dashboard") {
        DashboardPanel.refresh(this.element)
        return
      }
      if (this._state.activeTab === "settings") {
        this._patchActorView(actor.id ?? "")
        return
      }
      void this.render()
    })

    if (this._settingsHookId !== -1) Hooks.off("clientSettingChanged" as any, this._settingsHookId)
    this._settingsHookId = Hooks.on("clientSettingChanged" as any, (module: string, key: string) => {
      if (module !== MODULE_ID || key !== CODEX_SETTINGS_KEY) return
      SettingsPanel.refresh(this.element)
    })
  }

  override async _onClose(options: object): Promise<void> {
    await super._onClose(options)
    this._abortController?.abort()
    if (this._hookId !== -1) Hooks.off("updateActor" as any, this._hookId)
    if (this._settingsHookId !== -1) Hooks.off("clientSettingChanged" as any, this._settingsHookId)
  }

  private _showDashboard(): void {
    this.element.querySelector(".codex-main")?.classList.remove("is-visible")
    this.element.querySelector(".codex-dashboard-container")?.classList.add("is-visible")
    this.element.querySelectorAll(".codex-actor-item").forEach(el => el.classList.remove("active"))
  }

  private _showActors(): void {
    this.element.querySelector(".codex-main")?.classList.add("is-visible")
    this.element.querySelector(".codex-dashboard-container")?.classList.remove("is-visible")
  }

  private _patchActorView(actorId: string): void {
    if (!actorId) return
    const actor = game.actors?.get(actorId)
    if (!actor) return

    const record = getRecord(actor)
    StatsPanel.refresh(this.element, actorId, record)
    JournalPanel.refresh(this.element, actorId, record)
    EpithetsPanel.refresh(this.element, actorId, record)
    this._patchSidebarActor(actorId, record)
  }

  private _patchSidebarActor(actorId: string, record: ActorRecord): void {
    const item = this.element.querySelector(`.codex-actor-item[data-actor-id="${actorId}"]`)
    if (!item) return

    const img = item.querySelector("img")
    const name = item.querySelector("span")
    if (img) img.src = record.img
    if (name) name.textContent = record.name
  }

  private _selectActor(actorId: string): void {
    this._state.activeActorId = actorId

    this.element.querySelectorAll(".codex-actor-item")
      .forEach(el => el.classList.remove("active"))
    this.element.querySelector(`[data-actor-id="${actorId}"]`)
      ?.classList.add("active")

    this.element.querySelectorAll(".codex-detail")
      .forEach(el => el.classList.remove("is-active"))
    const detail = this.element.querySelector(`[data-detail="${actorId}"]`) as HTMLElement
    if (detail) {
      detail.classList.add("is-active")
      this._switchTab(detail, this._state.activeTab)
    }
  }

  private _switchTab(detail: HTMLElement, tab: string): void {
    this._state.activeTab = tab

    detail.querySelectorAll(".codex-tab")
      .forEach(el => el.classList.remove("active"))
    detail.querySelector(`[data-tab="${tab}"]`)?.classList.add("active")

    detail.querySelectorAll(".codex-panel")
      .forEach(el => el.classList.remove("is-active"))
    const panel = detail.querySelector(`[data-panel="${tab}"]`) as HTMLElement
    if (panel) panel.classList.add("is-active")
  }
}
