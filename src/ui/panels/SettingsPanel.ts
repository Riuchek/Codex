import { getSettings, saveSettings, saveRule, deleteRule } from "../../data/SettingsManager"
import { RuleEditorDialog } from "../dialogs/RuleEditorDialog"

export class SettingsPanel {
  static activate(root: HTMLElement, signal: AbortSignal): void {
    root.querySelectorAll("[data-action='save-system-settings']").forEach(el => {
      el.addEventListener("click", async () => {
        const hpPath      = (root.querySelector("#setting-hpPath")      as HTMLInputElement)?.value.trim()
        const attackFlavor = (root.querySelector("#setting-attackFlavor") as HTMLInputElement)?.value.trim()
        if (!hpPath) return
        await saveSettings({ hpPath, attackFlavor })
        ui.notifications?.info("Codex | Settings saved.")
      }, { signal })
    })

    root.querySelectorAll("[data-action='new-global-rule']").forEach(el => {
      el.addEventListener("click", async () => {
        const rule = await RuleEditorDialog.open(null)
        if (!rule) return
        await saveRule(rule)
      }, { signal })
    })

    root.querySelectorAll("[data-action='new-actor-rule']").forEach(el => {
      el.addEventListener("click", async () => {
        const actorId = (el as HTMLElement).dataset.actorId ?? ""
        const rule = await RuleEditorDialog.open(null, actorId)
        if (!rule) return
        await saveRule(rule)
      }, { signal })
    })

    root.querySelectorAll("[data-action='edit-rule']").forEach(el => {
      el.addEventListener("click", async () => {
        const ruleId   = (el as HTMLElement).dataset.ruleId ?? ""
        const settings = getSettings()
        const existing = settings.rules.find(r => r.id === ruleId) ?? null
        const rule     = await RuleEditorDialog.open(existing)
        if (!rule) return
        await saveRule(rule)
      }, { signal })
    })

    root.querySelectorAll("[data-action='delete-rule']").forEach(el => {
      el.addEventListener("click", async () => {
        const ruleId = (el as HTMLElement).dataset.ruleId ?? ""
        const confirmed = await foundry.applications.api.DialogV2.confirm({
          window:  { title: "Delete Rule" },
          content: "<p>Delete this epithet rule? Characters who earned it will keep their epithet.</p>",
        })
        if (!confirmed) return
        await deleteRule(ruleId)
      }, { signal })
    })
  }
}