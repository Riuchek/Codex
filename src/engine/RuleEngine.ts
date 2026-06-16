import type { ActorRecord, Epithet, EpithetRule, Condition, StatKey } from "../types"

export class RuleEngine {
  static evaluateCondition(stats: ActorRecord["stats"], condition: Condition): boolean {
    const value = stats[condition.stat as StatKey]
    switch (condition.operator) {
      case ">=": return value >= condition.threshold
      case "<=": return value <= condition.threshold
      case "==": return value === condition.threshold
      case ">":  return value >  condition.threshold
      case "<":  return value <  condition.threshold
      default:   return false
    }
  }

  static evaluateRule(stats: ActorRecord["stats"], rule: EpithetRule): boolean {
    if (rule.conditions.length === 0) return false
    if (rule.conditionMode === "all") {
      return rule.conditions.every(c => this.evaluateCondition(stats, c))
    }
    return rule.conditions.some(c => this.evaluateCondition(stats, c))
  }

  static apply(
    stats: ActorRecord["stats"],
    rules: EpithetRule[],
    current: Epithet[]
  ): { epithets: Epithet[]; newlyUnlocked: Epithet[] } {
    const manual = current.filter(e => !e.auto)
    const previousRuleIds = new Set(current.filter(e => e.auto).map(e => e.ruleId))

    const auto: Epithet[] = []
    const newlyUnlocked: Epithet[] = []

    for (const rule of rules) {
      if (!this.evaluateRule(stats, rule)) continue

      const epithet: Epithet = {
        label:  rule.label,
        color:  rule.color,
        icon:   rule.icon,
        auto:   true,
        ruleId: rule.id,
      }

      auto.push(epithet)

      if (!previousRuleIds.has(rule.id)) {
        newlyUnlocked.push(epithet)
      }
    }

    return { epithets: [...manual, ...auto], newlyUnlocked }
  }
}