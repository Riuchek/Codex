import {
  deleteRule,
  getSettings,
  saveRule,
  saveSettings,
} from "../../data/SettingsManager"
import { RuleEditorDialog } from "../dialogs/RuleEditorDialog"
import type { CodexSettings, EpithetRule } from "../../types"

const escapeHtml = (value: string): string =>
  foundry.utils.escapeHTML(value)

function formatConditions(rule: EpithetRule): string {
  return rule.conditions
    .map((c, i) => {
      const join = i < rule.conditions.length - 1 ? ` ${rule.conditionMode} ` : ""
      return `${c.stat} ${c.operator} ${c.threshold}${join}`
    })
    .join("")
}

function renderRuleRow(rule: EpithetRule): string {
  return `
    <div class="settings-rule-row" data-rule-id="${escapeHtml(rule.id)}">
      <span class="rule-icon">${escapeHtml(rule.icon ?? "")}</span>
      <span class="rule-label" data-color="${escapeHtml(rule.color ?? "")}">${escapeHtml(rule.label)}</span>
      <span class="rule-conditions">${escapeHtml(formatConditions(rule))}</span>
      <div class="rule-actions">
        <button class="codex-btn-icon" data-action="edit-rule" data-rule-id="${escapeHtml(rule.id)}">✎</button>
        <button class="codex-btn-icon" data-action="delete-rule" data-rule-id="${escapeHtml(rule.id)}">🗑️</button>
      </div>
    </div>`
}

function renderRulesList(rules: EpithetRule[], emptyMessage: string): string {
  if (!rules.length) return `<p class="codex-empty">${escapeHtml(emptyMessage)}</p>`
  return rules.map(renderRuleRow).join("")
}

export class SettingsPanel {
  static activate(root: HTMLElement, signal: AbortSignal): void {
    root.addEventListener("click", (e) => void this._handleClick(root, e), { signal })
  }

  static refresh(root: HTMLElement): void {
    const settings = getSettings()
    const globalRules = settings.rules.filter(r => r.scope === "global")

    root.querySelectorAll(".codex-settings-panel").forEach(panel => {
      const actorId = (panel.closest(".codex-detail") as HTMLElement | null)?.dataset.detail ?? ""
      const actorRules = settings.rules.filter(
        r => r.scope === "actor" && r.actorId === actorId
      )

      panel.querySelector(".settings-global-rules-list")!.innerHTML =
        renderRulesList(globalRules, "No global rules yet.")
      panel.querySelector(".settings-actor-rules-list")!.innerHTML =
        renderRulesList(actorRules, "No rules for this character yet.")

      this._syncSystemInputs(panel, settings)
    })
  }

  private static _syncSystemInputs(panel: Element, settings: CodexSettings): void {
    const hpInput = panel.querySelector('[data-setting="hpPath"]') as HTMLInputElement | null
    const flavorInput = panel.querySelector('[data-setting="attackFlavor"]') as HTMLInputElement | null
    if (hpInput && document.activeElement !== hpInput) hpInput.value = settings.hpPath
    if (flavorInput && document.activeElement !== flavorInput) flavorInput.value = settings.attackFlavor
  }

  private static async _handleClick(root: HTMLElement, e: Event): Promise<void> {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-action]")
    if (!target?.closest(".codex-settings-panel")) return

    switch (target.dataset.action) {
      case "save-system-settings":
        await this._saveSystemSettings(root)
        break
      case "new-global-rule":
        await this._saveNewRule(root, null)
        break
      case "new-actor-rule":
        await this._saveNewRule(root, target.dataset.actorId ?? "")
        break
      case "edit-rule":
        await this._editRule(root, target.dataset.ruleId ?? "")
        break
      case "delete-rule":
        await this._deleteRule(root, target.dataset.ruleId ?? "")
        break
    }
  }

  private static async _saveSystemSettings(root: HTMLElement): Promise<void> {
    const panel = root.querySelector(".codex-settings-panel")
    const hpPath = (panel?.querySelector('[data-setting="hpPath"]') as HTMLInputElement)?.value.trim()
    const attackFlavor = (panel?.querySelector('[data-setting="attackFlavor"]') as HTMLInputElement)?.value.trim()
    if (!hpPath) return

    await saveSettings({ hpPath, attackFlavor })
    this.refresh(root)
    ui.notifications?.info("Codex | Settings saved.")
  }

  private static async _saveNewRule(root: HTMLElement, actorId: string | null): Promise<void> {
    const rule = await RuleEditorDialog.open(null, actorId ?? undefined)
    if (!rule) return
    await saveRule(rule)
    this.refresh(root)
    ui.notifications?.info("Codex | Rule saved.")
  }

  private static async _editRule(root: HTMLElement, ruleId: string): Promise<void> {
    const settings = getSettings()
    const existing = settings.rules.find(r => r.id === ruleId) ?? null
    const rule = await RuleEditorDialog.open(existing)
    if (!rule) return
    await saveRule(rule)
    this.refresh(root)
    ui.notifications?.info("Codex | Rule saved.")
  }

  private static async _deleteRule(root: HTMLElement, ruleId: string): Promise<void> {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window:  { title: "Delete Rule" },
      content: "<p>Delete this epithet rule? Characters who earned it will keep their epithet.</p>",
    })
    if (!confirmed) return
    await deleteRule(ruleId)
    this.refresh(root)
    ui.notifications?.info("Codex | Rule deleted.")
  }
}
