import type { Condition, EpithetRule, Operator, StatKey } from "../../types"
import { STAT_KEYS } from "../../types"
import { getRecord } from "../../data/ActorRecord"
import { RuleEngine } from "../../engine/RuleEngine"
import { localizeStat } from "../../constants"

const OPS: Operator[] = [">=", "<=", "==", ">", "<"]

const escapeHtml = (value: string): string =>
  foundry.utils.escapeHTML(value)

const t = (key: string) => game.i18n?.localize(key) ?? key

export class RuleEditorDialog {
  static async open(rule: EpithetRule | null, actorId?: string): Promise<EpithetRule | null> {
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

    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title: isNew ? t("CODEX.RuleNewTitle") : t("CODEX.RuleEditTitle") },
      content: `
        <div class="codex-rule-editor">
          <div class="rule-main-row">
            <input id="rule-icon" class="codex-rule-input" type="text"
              value="${escapeHtml(current.icon)}" placeholder="⚔️"/>
            <input id="rule-label" class="codex-rule-input" type="text"
              value="${escapeHtml(current.label)}" placeholder="${escapeHtml(t("CODEX.RuleLabelPlaceholder"))}"/>
            <input id="rule-color" type="color" value="${escapeHtml(current.color)}"/>
          </div>
          <div class="rule-mode-row">
            <label>${escapeHtml(t("CODEX.RuleConditionsMatch"))}</label>
            <select id="rule-mode" class="codex-rule-input">
              <option value="all" ${current.conditionMode === "all" ? "selected" : ""}>${escapeHtml(t("CODEX.RuleModeAll"))}</option>
              <option value="any" ${current.conditionMode === "any" ? "selected" : ""}>${escapeHtml(t("CODEX.RuleModeAny"))}</option>
            </select>
          </div>
          <div id="rule-conditions">
            ${current.conditions.map((c, i) => this._conditionRowHTML(c, i)).join("")}
          </div>
          <button type="button" id="add-condition" class="codex-btn codex-btn-dialog">
            ${escapeHtml(t("CODEX.RuleAddCondition"))}
          </button>
          <div class="rule-preview">
            <label>${escapeHtml(t("CODEX.RulePreview"))}</label>
            <div id="rule-preview-list" class="rule-preview-list"></div>
          </div>
        </div>
      `,
      render: (_event: Event, dialog: { element: HTMLElement }) => {
        this._wireDialog(dialog.element, current)
      },
      ok: {
        label: t("CODEX.Save"),
        callback: (_e: Event, _btn: HTMLButtonElement, dialog: { element: HTMLElement }) =>
          this._readForm(dialog.element),
      },
    } as any) as {
      label: string
      color: string
      icon: string
      conditionMode: "all" | "any"
      conditions: Condition[]
    } | null

    if (!result?.label) return null
    return { ...current, ...result }
  }

  private static _wireDialog(el: HTMLElement, current: EpithetRule): void {
    const refreshPreview = () => {
      const draft = { ...current, ...this._readForm(el) }
      this._updatePreview(el, draft)
    }

    el.querySelector("#add-condition")?.addEventListener("click", (e) => {
      e.preventDefault()
      this._addConditionRow(el)
      refreshPreview()
    })

    el.querySelectorAll(".remove-condition").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        btn.closest(".rule-condition-row")?.remove()
        refreshPreview()
      })
    })

    el.querySelectorAll("input, select").forEach(input => {
      input.addEventListener("change", refreshPreview)
      input.addEventListener("input", refreshPreview)
    })

    refreshPreview()
  }

  private static _updatePreview(el: HTMLElement, rule: EpithetRule): void {
    const container = el.querySelector("#rule-preview-list")
    if (!container) return

    const actors = (game.actors?.contents ?? []).filter(a => a.hasPlayerOwner)
    const matches: string[] = []

    for (const actor of actors) {
      if (rule.scope === "actor" && rule.actorId && actor.id !== rule.actorId) continue
      const record = getRecord(actor)
      if (RuleEngine.evaluateRule(record.stats, rule)) {
        matches.push(actor.name ?? actor.id ?? "")
      }
    }

    container.innerHTML = matches.length
      ? matches.map(name => `<span class="rule-preview-chip">${escapeHtml(name)}</span>`).join("")
      : `<span class="rule-preview-empty">${escapeHtml(t("CODEX.RulePreviewNone"))}</span>`
  }

  private static _addConditionRow(el: HTMLElement): void {
    const container = el.querySelector("#rule-conditions")
    if (!container) return

    const row = document.createElement("div")
    row.innerHTML = this._conditionRowHTML({ stat: "killCount", operator: ">=", threshold: 1 }, 0)
    const element = row.firstElementChild as HTMLElement
    element.querySelector(".remove-condition")?.addEventListener("click", (e) => {
      e.preventDefault()
      element.remove()
    })
    container.appendChild(element)
  }

  private static _conditionRowHTML(c: Condition, _i: number): string {
    return `
      <div class="rule-condition-row">
        <select class="cond-stat codex-rule-input">
          ${STAT_KEYS.map(s =>
            `<option value="${s}" ${c.stat === s ? "selected" : ""}>${escapeHtml(localizeStat(s))}</option>`
          ).join("")}
        </select>
        <select class="cond-op codex-rule-input">
          ${OPS.map(op =>
            `<option value="${op}" ${c.operator === op ? "selected" : ""}>${op}</option>`
          ).join("")}
        </select>
        <input class="cond-threshold codex-rule-input" type="number"
          value="${c.threshold}" min="0"/>
        <button type="button" class="codex-btn-icon remove-condition">🗑️</button>
      </div>`
  }

  private static _readForm(el: HTMLElement): {
    label: string
    color: string
    icon: string
    conditionMode: "all" | "any"
    conditions: Condition[]
  } {
    const label = (el.querySelector("#rule-label") as HTMLInputElement).value.trim()
    const color = (el.querySelector("#rule-color") as HTMLInputElement).value
    const icon  = (el.querySelector("#rule-icon")  as HTMLInputElement).value.trim()
    const conditionMode = (el.querySelector("#rule-mode") as HTMLSelectElement).value as "all" | "any"

    const conditions: Condition[] = []
    el.querySelectorAll(".rule-condition-row").forEach(row => {
      const stat      = (row.querySelector(".cond-stat")       as HTMLSelectElement).value
      const operator  = (row.querySelector(".cond-op")         as HTMLSelectElement).value
      const threshold = parseInt((row.querySelector(".cond-threshold") as HTMLInputElement).value) || 0
      conditions.push({ stat: stat as StatKey, operator: operator as Operator, threshold })
    })

    return { label, color, icon, conditionMode, conditions }
  }
}
