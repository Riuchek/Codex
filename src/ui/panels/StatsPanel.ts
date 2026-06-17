import { getRecord, resetAllStats, resetSessionStats, updateStats } from "../../data/ActorRecord"
import type { CodexAppState } from "../CodexApp"
import type { ActorRecord, CombatStats } from "../../types"

export class StatsPanel {
  static activate(root: HTMLElement, state: CodexAppState, signal: AbortSignal): void {
    root.querySelectorAll(".stat-edit").forEach(el => {
      el.addEventListener("click", (e) => {
        e.stopPropagation()
        const li      = (el as HTMLElement).closest("li")!
        const display = li.querySelector(".stat-display") as HTMLElement
        const input   = li.querySelector(".stat-input")   as HTMLInputElement
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const stat    = (el as HTMLElement).dataset.stat    ?? ""

        const editing = input.style.display === "none"
        display.style.display = editing ? "none" : ""
        input.style.display   = editing ? "" : "none"

        if (!editing) return

        input.focus()
        input.select()

        const save = async () => {
          const val   = parseInt(input.value) || 0
          const actor = game.actors?.get(actorId)
          if (!actor) return
          const current = getRecord(actor)
          await updateStats(actor, { ...current.stats, [stat]: val } as Partial<CombatStats>)
        }

        input.addEventListener("blur",    save, { once: true, signal })
        input.addEventListener("keydown", (ev) => {
          if ((ev as KeyboardEvent).key === "Enter")  input.blur()
          if ((ev as KeyboardEvent).key === "Escape") {
            input.style.display   = "none"
            display.style.display = ""
          }
        }, { once: true, signal })

      }, { signal })
    })

    root.querySelectorAll("[data-action='reset-stats']").forEach(el => {
      el.addEventListener("click", async () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const actor   = game.actors?.get(actorId)
        if (!actor) return

        const confirmed = await foundry.applications.api.DialogV2.confirm({
          window:  { title: game.i18n?.localize("CODEX.ResetConfirmTitle") || "" },
          content: game.i18n?.format("CODEX.ResetConfirmContent", { name: actor.name }) || "",
        })
        if (!confirmed) return

        await resetAllStats(actor)
        this.refresh(root, actorId)
      }, { signal })
    })

    root.querySelectorAll("[data-action='reset-session']").forEach(el => {
      el.addEventListener("click", async () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const actor   = game.actors?.get(actorId)
        if (!actor) return

        const confirmed = await foundry.applications.api.DialogV2.confirm({
          window:  { title: game.i18n?.localize("CODEX.ResetSessionTitle") || "" },
          content: game.i18n?.format("CODEX.ResetSessionContent", { name: actor.name }) || "",
        })
        if (!confirmed) return

        await resetSessionStats(actor)
        this.refresh(root, actorId)
      }, { signal })
    })
  }

  static refresh(root: HTMLElement, actorId: string, record?: ActorRecord): void {
    const data = record ?? getRecord(game.actors?.get(actorId)!)
    const detail = root.querySelector(`[data-detail="${actorId}"]`)
    if (!detail) return

    detail.querySelectorAll(".stat-edit").forEach(el => {
      const stat = (el as HTMLElement).dataset.stat as keyof CombatStats | undefined
      if (!stat) return
      const li = el.closest("li")
      const display = li?.querySelector(".stat-display")
      const session = li?.querySelector(".stat-session-value")
      const input = li?.querySelector(".stat-input") as HTMLInputElement | null
      if (display) display.textContent = String(data.stats[stat])
      if (session) session.textContent = String(data.sessionStats[stat])
      if (input && document.activeElement !== input) input.value = String(data.stats[stat])
    })
  }
}
