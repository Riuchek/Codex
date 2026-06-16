import { MODULE_ID } from "../constants"
import { getRecord, initRecord } from "../data/ActorRecord"
import { getSettings } from "../data/SettingsManager"
import { StatsPanel }    from "./panels/StatsPanel"
import { JournalPanel }  from "./panels/JournalPanel"
import { EpithetsPanel } from "./panels/EpithetsPanel"
import { SettingsPanel } from "./panels/SettingsPanel"
import type { ActorRecord, EpithetRule, CodexSettings } from "../types"

export interface CodexAppState {
  activeActorId: string
  activeTab: string
}

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class CodexApp extends HandlebarsApplicationMixin(ApplicationV2) {
  private _state: CodexAppState = { activeActorId: "", activeTab: "stats" }
  private _hookId: number = -1
  private _abortController: AbortController | null = null

  static override DEFAULT_OPTIONS = {
    id: "codex-app",
    window: { title: "Codex", resizable: true },
    position: { width: 720, height: 560 },
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

    // ensure all actors have a record initialized
    await Promise.all(
      (game.actors?.contents ?? [])
        .filter(a => a.hasPlayerOwner)
        .map(a => initRecord(a))
    )

    return { actors, isGM: game.user?.isGM ?? false, settings, globalRules }
  }

  override async _onRender(context: object, options: object): Promise<void> {
    await super._onRender(context, options)

    // abort previous listeners cleanly
    this._abortController?.abort()
    this._abortController = new AbortController()
    const { signal } = this._abortController

    // restore or select first actor
    const targetId = this._state.activeActorId ||
      (this.element.querySelector(".codex-actor-item") as HTMLElement)?.dataset.actorId || ""
    this._selectActor(targetId)

    // actor selection
    this.element.querySelectorAll(".codex-actor-item").forEach(el => {
      el.addEventListener("click", () => {
        this._state.activeTab = "stats"
        this._selectActor((el as HTMLElement).dataset.actorId ?? "")
      }, { signal })
    })

    // tab switching
    this.element.querySelectorAll(".codex-tab").forEach(el => {
      el.addEventListener("click", () => {
        const tab    = (el as HTMLElement).dataset.tab ?? ""
        const detail = el.closest(".codex-detail") as HTMLElement
        if (detail) this._switchTab(detail, tab)
      }, { signal })
    })

    // activate panels
    StatsPanel.activate(this.element, this._state, signal)
    JournalPanel.activate(this.element, signal)
    EpithetsPanel.activate(this.element, signal)
    if (game.user?.isGM) SettingsPanel.activate(this.element, signal)

    // re-render on actor updates
    if (this._hookId !== -1) Hooks.off("updateActor" as any, this._hookId)
    this._hookId = Hooks.on("updateActor" as any, () => void this.render())
  }

  override async _onClose(options: object): Promise<void> {
    await super._onClose(options)
    this._abortController?.abort()
    if (this._hookId !== -1) Hooks.off("updateActor" as any, this._hookId)
  }

  private _selectActor(actorId: string): void {
    this._state.activeActorId = actorId

    this.element.querySelectorAll(".codex-actor-item")
      .forEach(el => el.classList.remove("active"))
    this.element.querySelector(`[data-actor-id="${actorId}"]`)
      ?.classList.add("active")

    this.element.querySelectorAll(".codex-detail")
      .forEach(el => ((el as HTMLElement).style.display = "none"))
    const detail = this.element.querySelector(`[data-detail="${actorId}"]`) as HTMLElement
    if (detail) {
      detail.style.display = "flex"
      this._switchTab(detail, this._state.activeTab)
    }
  }

  private _switchTab(detail: HTMLElement, tab: string): void {
    this._state.activeTab = tab

    detail.querySelectorAll(".codex-tab")
      .forEach(el => el.classList.remove("active"))
    detail.querySelector(`[data-tab="${tab}"]`)?.classList.add("active")

    detail.querySelectorAll(".codex-panel")
      .forEach(el => ((el as HTMLElement).style.display = "none"))
    const panel = detail.querySelector(`[data-panel="${tab}"]`) as HTMLElement
    if (panel) panel.style.display = "block"
  }
}