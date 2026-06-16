import type { Condition, EpithetRule, Operator, StatKey } from "../../types"

const STATS: StatKey[] = ["killCount", "criticals", "criticalFails", "damageDealt", "damageTaken"]
const OPS: Operator[] = [">=", "<=", "==", ">", "<"]

const escapeHtml = (value: string): string =>
  foundry.utils.escapeHTML(value)

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
      window: { title: isNew ? "New Epithet Rule" : "Edit Epithet Rule" },
      content: `
        <div class="codex-rule-editor">
          <div class="rule-main-row">
            <input id="rule-icon" class="codex-rule-input" type="text"
              value="${escapeHtml(current.icon)}" placeholder="⚔️"/>
            <input id="rule-label" class="codex-rule-input" type="text"
              value="${escapeHtml(current.label)}" placeholder="Epithet name"/>
            <input id="rule-color" type="color" value="${escapeHtml(current.color)}"/>
          </div>
          <div class="rule-mode-row">
            <label>Conditions match:</label>
            <select id="rule-mode" class="codex-rule-input">
              <option value="all" ${current.conditionMode === "all" ? "selected" : ""}>ALL (AND)</option>
              <option value="any" ${current.conditionMode === "any" ? "selected" : ""}>ANY (OR)</option>
            </select>
          </div>
          <div id="rule-conditions">
            ${current.conditions.map((c, i) => this._conditionRowHTML(c, i)).join("")}
          </div>
          <button type="button" id="add-condition" class="codex-btn codex-btn-dialog">
            + Add Condition
          </button>
        </div>
      `,
      render: (_event: Event, dialog: { element: HTMLElement }) => {
        this._wireDialog(dialog.element)
      },
      ok: {
        label: "Save",
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

  private static _wireDialog(el: HTMLElement): void {
    el.querySelector("#add-condition")?.addEventListener("click", (e) => {
      e.preventDefault()
      this._addConditionRow(el)
    })

    el.querySelectorAll(".remove-condition").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault()
        btn.closest(".rule-condition-row")?.remove()
      })
    })
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
          ${STATS.map(s =>
            `<option value="${s}" ${c.stat === s ? "selected" : ""}>${s}</option>`
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
