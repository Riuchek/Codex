import type { EpithetRule } from "./types"

export const MODULE_ID = "codex"

export const DEFAULT_TAGS = [
  "combate",
  "npc",
  "segredo",
  "lembrete",
] as const

export const DEFAULT_RULES: EpithetRule[] = [
  // Kill Count
  { id: "kc-25",  label: "Cabeça quente",      color: "#e8b84b", icon: "⚔️", scope: "global", conditionMode: "all", conditions: [{ stat: "killCount", operator: ">=", threshold: 25  }] },
  { id: "kc-50",  label: "Assassino",           color: "#c9922a", icon: "⚔️", scope: "global", conditionMode: "all", conditions: [{ stat: "killCount", operator: ">=", threshold: 50  }] },
  { id: "kc-75",  label: "Carniceiro",          color: "#8b1a1a", icon: "💀", scope: "global", conditionMode: "all", conditions: [{ stat: "killCount", operator: ">=", threshold: 75  }] },
  { id: "kc-100", label: "Sedento por sangue",  color: "#8b1a1a", icon: "💀", scope: "global", conditionMode: "all", conditions: [{ stat: "killCount", operator: ">=", threshold: 100 }] },
  // Criticals
  { id: "cr-10",  label: "Sortudo",             color: "#4a9e4a", icon: "🍀", scope: "global", conditionMode: "all", conditions: [{ stat: "criticals", operator: ">=", threshold: 10  }] },
  { id: "cr-25",  label: "Abençoado pelo Caio", color: "#4a9e4a", icon: "✨", scope: "global", conditionMode: "all", conditions: [{ stat: "criticals", operator: ">=", threshold: 25  }] },
  { id: "cr-50",  label: "Roda da fortuna",     color: "#4a9e4a", icon: "🎡", scope: "global", conditionMode: "all", conditions: [{ stat: "criticals", operator: ">=", threshold: 50  }] },
  // Critical Fails
  { id: "cf-10",  label: "Aqui travou",         color: "#666",    icon: "💥", scope: "global", conditionMode: "all", conditions: [{ stat: "criticalFails", operator: ">=", threshold: 10 }] },
  { id: "cf-25",  label: "Fã do duo bigode",    color: "#666",    icon: "💥", scope: "global", conditionMode: "all", conditions: [{ stat: "criticalFails", operator: ">=", threshold: 25 }] },
  { id: "cf-50",  label: "Atomizado pelo dado", color: "#666",    icon: "💥", scope: "global", conditionMode: "all", conditions: [{ stat: "criticalFails", operator: ">=", threshold: 50 }] },
  // Damage Taken
  { id: "dt-75",  label: "Amigo da onça",       color: "#8b4513", icon: "🐆", scope: "global", conditionMode: "all", conditions: [{ stat: "damageTaken", operator: ">=", threshold: 75  }] },
  { id: "dt-250", label: "Amigo do dano",       color: "#8b4513", icon: "🛡️", scope: "global", conditionMode: "all", conditions: [{ stat: "damageTaken", operator: ">=", threshold: 250 }] },
  { id: "dt-500", label: "Amigo do roteiro",    color: "#8b4513", icon: "📜", scope: "global", conditionMode: "all", conditions: [{ stat: "damageTaken", operator: ">=", threshold: 500 }] },
  // Damage Dealt
  { id: "dd-100",  label: "Bate forte",         color: "#c9922a", icon: "💪", scope: "global", conditionMode: "all", conditions: [{ stat: "damageDealt", operator: ">=", threshold: 100  }] },
  { id: "dd-250",  label: "Lamina afiada",      color: "#c9922a", icon: "🗡️", scope: "global", conditionMode: "all", conditions: [{ stat: "damageDealt", operator: ">=", threshold: 250  }] },
  { id: "dd-500",  label: "Vingador",           color: "#c9922a", icon: "⚡", scope: "global", conditionMode: "all", conditions: [{ stat: "damageDealt", operator: ">=", threshold: 500  }] },
  { id: "dd-1000", label: "O Catiço",           color: "#e8b84b", icon: "👑", scope: "global", conditionMode: "all", conditions: [{ stat: "damageDealt", operator: ">=", threshold: 1000 }] },
]

export function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => acc?.[key], obj)
}