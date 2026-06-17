import { describe, it, expect } from "vitest"
import { RuleEngine } from "./RuleEngine"
import type { EpithetRule } from "../types"

const baseStats = () => ({
  damageDealt: 0,
  damageTaken: 0,
  criticals: 0,
  criticalFails: 0,
  killCount: 0,
})

describe("RuleEngine", () => {
  it("evaluates >= condition", () => {
    expect(RuleEngine.evaluateCondition(baseStats(), { stat: "killCount", operator: ">=", threshold: 5 })).toBe(false)
    expect(RuleEngine.evaluateCondition({ ...baseStats(), killCount: 5 }, { stat: "killCount", operator: ">=", threshold: 5 })).toBe(true)
  })

  it("evaluates all mode", () => {
    const rule: EpithetRule = {
      id: "r1", label: "Test", color: "#000", icon: "⚔️", scope: "global",
      conditionMode: "all",
      conditions: [
        { stat: "killCount", operator: ">=", threshold: 10 },
        { stat: "criticals", operator: ">=", threshold: 5 },
      ],
    }
    expect(RuleEngine.evaluateRule({ ...baseStats(), killCount: 10, criticals: 4 }, rule)).toBe(false)
    expect(RuleEngine.evaluateRule({ ...baseStats(), killCount: 10, criticals: 5 }, rule)).toBe(true)
  })

  it("evaluates any mode", () => {
    const rule: EpithetRule = {
      id: "r2", label: "Test", color: "#000", icon: "⚔️", scope: "global",
      conditionMode: "any",
      conditions: [
        { stat: "killCount", operator: ">=", threshold: 100 },
        { stat: "criticals", operator: ">=", threshold: 1 },
      ],
    }
    expect(RuleEngine.evaluateRule({ ...baseStats(), criticals: 1 }, rule)).toBe(true)
  })

  it("preserves manual epithets and adds auto", () => {
    const rules: EpithetRule[] = [{
      id: "r3", label: "Slayer", color: "#000", icon: "⚔️", scope: "global",
      conditionMode: "all",
      conditions: [{ stat: "killCount", operator: ">=", threshold: 1 }],
    }]
    const result = RuleEngine.apply(
      { ...baseStats(), killCount: 2 },
      rules,
      [{ label: "Manual", auto: false }]
    )
    expect(result.epithets).toHaveLength(2)
    expect(result.epithets.find(e => e.label === "Manual")).toBeTruthy()
    expect(result.epithets.find(e => e.label === "Slayer")?.auto).toBe(true)
    expect(result.newlyUnlocked).toHaveLength(1)
  })

  it("returns empty for rule with no conditions", () => {
    const rule: EpithetRule = {
      id: "r4", label: "Empty", color: "#000", icon: "⚔️", scope: "global",
      conditionMode: "all", conditions: [],
    }
    expect(RuleEngine.evaluateRule(baseStats(), rule)).toBe(false)
  })
})
