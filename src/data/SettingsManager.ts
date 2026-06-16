import { MODULE_ID, DEFAULT_RULES } from "../constants"
import type { CodexSettings, EpithetRule } from "../types"

const SETTINGS_KEY = "codexSettings"

const DEFAULT_SETTINGS: CodexSettings = {
  hpPath: "system.attributes.hp.value",
  attackFlavor: "attacking",
  rules: DEFAULT_RULES,
}

export function registerSettings(): void {
  game.settings?.register(MODULE_ID as any, SETTINGS_KEY as any, {
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_SETTINGS as unknown as Record<string, boolean>,
  })
}

export function getSettings(): CodexSettings {
  const saved = game.settings?.get(MODULE_ID as any, SETTINGS_KEY as any) as Partial<CodexSettings> | undefined
  return { ...DEFAULT_SETTINGS, ...saved }
}

export async function saveSettings(patch: Partial<CodexSettings>): Promise<void> {
  const current = getSettings()
  await game.settings?.set(MODULE_ID as any, SETTINGS_KEY as any, { ...current, ...patch } as any)
}

export function getRules(actorId?: string): EpithetRule[] {
  const { rules } = getSettings()
  if (!actorId) return rules.filter(r => r.scope === "global")
  return rules.filter(r => r.scope === "global" || (r.scope === "actor" && r.actorId === actorId))
}

export async function saveRule(rule: EpithetRule): Promise<void> {
  const { rules } = getSettings()
  const exists = rules.findIndex(r => r.id === rule.id)
  const updated = exists >= 0
    ? rules.map(r => r.id === rule.id ? rule : r)
    : [...rules, rule]
  await saveSettings({ rules: updated })
}

export async function deleteRule(ruleId: string): Promise<void> {
  const { rules } = getSettings()
  await saveSettings({ rules: rules.filter(r => r.id !== ruleId) })
}