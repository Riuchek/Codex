import { localizeStat } from "../../constants"
import { getRecord } from "../../data/ActorRecord"
import { STAT_KEYS } from "../../types"
import type { ActorRecord } from "../../types"

const escapeHtml = (value: string): string =>
  foundry.utils.escapeHTML(value)

export class DashboardPanel {
  static activate(root: HTMLElement, signal: AbortSignal): void {
    root.querySelector("[data-action='close-dashboard']")?.addEventListener("click", () => {
      root.dispatchEvent(new CustomEvent("codex-close-dashboard", { bubbles: true }))
    }, { signal })
  }

  static render(actors: { id: string; record: ActorRecord }[]): string {
    const sessionLabel = game.i18n?.localize("CODEX.StatSession") ?? "Session"
    const totalLabel = game.i18n?.localize("CODEX.StatTotal") ?? "Total"
    const epithetsLabel = game.i18n?.localize("CODEX.TabEpithets") ?? "Epithets"

    const headers = STAT_KEYS.map(stat =>
      `<th colspan="2">${escapeHtml(localizeStat(stat))}</th>`
    ).join("")

    const subHeaders = STAT_KEYS.map(() =>
      `<th>${escapeHtml(sessionLabel)}</th><th>${escapeHtml(totalLabel)}</th>`
    ).join("")

    const rows = actors.map(({ id, record }) => `
      <tr data-actor-id="${escapeHtml(id)}">
        <td class="dashboard-actor">
          <img src="${escapeHtml(record.img)}" alt=""/>
          <span>${escapeHtml(record.name)}</span>
        </td>
        ${STAT_KEYS.map(stat => `
          <td>${record.sessionStats[stat]}</td>
          <td><strong>${record.stats[stat]}</strong></td>
        `).join("")}
        <td>${record.epithets.length}</td>
      </tr>
    `).join("")

    return `
      <div class="codex-dashboard">
        <div class="dashboard-header">
          <h2>${escapeHtml(game.i18n?.localize("CODEX.TabDashboard") ?? "Dashboard")}</h2>
          <button type="button" class="codex-btn" data-action="close-dashboard">
            ${escapeHtml(game.i18n?.localize("CODEX.DashboardBack") ?? "Back")}
          </button>
        </div>
        <div class="dashboard-table-wrap">
          <table class="codex-dashboard-table">
            <thead>
              <tr>
                <th rowspan="2">${escapeHtml(game.i18n?.localize("CODEX.DashboardCharacter") ?? "Character")}</th>
                ${headers}
                <th rowspan="2">${escapeHtml(epithetsLabel)}</th>
              </tr>
              <tr>${subHeaders}</tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`
  }

  static refresh(root: HTMLElement): void {
    const actors = (game.actors?.contents ?? [])
      .filter(a => a.hasPlayerOwner)
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
      .map(a => ({ id: a.id ?? "", record: getRecord(a) }))

    const container = root.querySelector(".codex-dashboard-container")
    if (container) container.innerHTML = this.render(actors)
  }
}
