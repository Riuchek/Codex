import type { EpithetRule, Condition } from "../../types"

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

    const conditionsHTML = current.conditions.map((c, i) => `
      <div class="rule-condition-row" data-index="${i}">
        <select class="cond-stat">
          ${["killCount","criticals","criticalFails","damageDealt","damageTaken"].map(s =>
            `<option value="${s}" ${c.stat === s ? "selected" : ""}>${s}</option>`
          ).join("")}
        </select>
        <select class="cond-op">
          ${[">=","<=","==",">","<"].map(op =>
            `<option value="${op}" ${c.operator === op ? "selected" : ""}>${op}</option>`
          ).join("")}
        </select>
        <input class="cond-threshold codex-input" type="number"
          value="${c.threshold}" style="width:70px"/>
        <button class="codex-btn-icon remove-condition" data-index="${i}">🗑️</button>
      </div>
    `).join("")

    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title: isNew ? "New Epithet Rule" : "Edit Epithet Rule" },
      content: `
        <div style="display:flex;flex-direction:column;gap:10px;padding:8px">
          <div style="display:flex;gap:8px;align-items:center">
            <input id="rule-icon"  type="text"  value="${current.icon}"
              style="width:50px;text-align:center" placeholder="⚔️"/>
            <input id="rule-label" type="text"  value="${current.label}"
              style="flex:1" placeholder="Epithet name"/>
            <input id="rule-color" type="color" value="${current.color}"
              style="width:40px;height:32px;padding:2px"/>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <label style="font-size:12px">Conditions match:</label>
            <select id="rule-mode">
              <option value="all" ${current.conditionMode === "all" ? "selected" : ""}>ALL (AND)</option>
              <option value="any" ${current.conditionMode === "any" ? "selected" : ""}>ANY (OR)</option>
            </select>
          </div>
          <div id="rule-conditions">${conditionsHTML}</div>
          <button id="add-condition" class="codex-btn" style="align-self:flex-start">
            + Add Condition
          </button>
        </div>
      `,
      ok: {
        label: "Save",
        callback: (_e: Event, _btn: HTMLButtonElement, dialog: any) => {
          const el = dialog.element as HTMLElement

          // wire up add/remove condition buttons before reading
          el.querySelector("#add-condition")?.addEventListener("click", () => {
            const container = el.querySelector("#rule-conditions")!
            const idx = container.querySelectorAll(".rule-condition-row").length
            const row = document.createElement("div")
            row.className = "rule-condition-row"
            row.dataset.index = String(idx)
            row.innerHTML = `
              <select class="cond-stat">
                ${["killCount","criticals","criticalFails","damageDealt","damageTaken"]
                  .map(s => `<option value="${s}">${s}</option>`).join("")}
              </select>
              <select class="cond-op">
                ${[">=","<=","==",">","<"].map(op => `<option value="${op}">${op}</option>`).join("")}
              </select>
              <input class="cond-threshold codex-input" type="number" value="1" style="width:70px"/>
              <button class="codex-btn-icon remove-condition">🗑️</button>
            `
            row.querySelector(".remove-condition")?.addEventListener("click", () => row.remove())
            container.appendChild(row)
          })

          el.querySelectorAll(".remove-condition").forEach(btn => {
            btn.addEventListener("click", () => (btn as HTMLElement).closest(".rule-condition-row")?.remove())
          })

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
    }) as { label: string; color: string; icon: string; conditionMode: "all"|"any"; conditions: Condition[] } | null

    if (!result?.label) return null
    return { ...current, ...result }
  }
}