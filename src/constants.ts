export const MODULE_ID = "codex"

export const DEFAULT_TAGS = [
  "combate",
  "npc",
  "segredo",
  "lembrete",
] as const

export const EPITHET_RULES = [
  // Kill Count - npcs, pcs, monsters, etc.
  { threshold: 25,  label: "Cabeça quente",         stat: "killCount" },
  { threshold: 50,  label: "Assassino",             stat: "killCount" },
  { threshold: 75,  label: "Carniceiro",            stat: "killCount" },
  { threshold: 100, label: "Sedento por sangue",    stat: "killCount" },
  // Critical Success
  { threshold: 10,  label: "Sortudo",               stat: "criticals" },
  { threshold: 25,  label: "Abençoado pelo Caio",   stat: "criticals" },
  { threshold: 50,  label: "Roda da fortuna",       stat: "criticals" },

  // Critical Failure - failed to hit, failed to crit, etc.
  { threshold: 10,  label: "Aqui travou",           stat: "criticalFails" },
  { threshold: 25,  label: "Fã do duo bigode",      stat: "criticalFails" },
  { threshold: 50,  label: "Atomizado pelo dado",   stat: "criticalFails" },

  // Damage Taken - damage taken by the actor
  { threshold: 75,  label: "Amigo da onça",         stat: "damageTaken" },
  { threshold: 250,  label: "Amigo do dano",        stat: "damageTaken" },
  { threshold: 500,  label: "Amigo do roteiro",     stat: "damageTaken" },

  // Damage Dealt - damage dealt by the actor
  { threshold: 100,  label: "Bate forte",           stat: "damageDealt" },
  { threshold: 250,  label: "Lamina afiada",        stat: "damageDealt" },
  { threshold: 500,  label: "Vingador",             stat: "damageDealt" },
  { threshold: 1000,  label: "O Catiço",            stat: "damageDealt" },
] as const