import { describe, it, expect } from "vitest"
import {
  findDieByFaces,
  isCriticalOnDie,
  isCritFailOnDie,
  isMaxOnMainDie,
} from "./rollUtils"

function mockRoll(dice: { faces: number; results: number[] }[]) {
  return {
    dice: dice.map(d => ({
      faces: d.faces,
      results: d.results.map(result => ({ result })),
    })),
  } as Roll<any>
}

describe("rollUtils critical detection", () => {
  it("detects critical only on configured test die (d20 system)", () => {
    const roll = mockRoll([
      { faces: 6, results: [6] },
      { faces: 20, results: [15] },
    ])

    expect(isCriticalOnDie(roll, 20)).toBe(false)
    expect(isMaxOnMainDie(roll)).toBe(true)
  })

  it("detects natural 20 on d20 when configured", () => {
    const roll = mockRoll([
      { faces: 6, results: [3] },
      { faces: 20, results: [20] },
    ])

    expect(isCriticalOnDie(roll, 20)).toBe(true)
    expect(findDieByFaces(roll, 20)?.faces).toBe(20)
  })

  it("ignores d12 max when test die is d20", () => {
    const roll = mockRoll([
      { faces: 12, results: [12] },
      { faces: 20, results: [10] },
    ])

    expect(isCriticalOnDie(roll, 20)).toBe(false)
  })

  it("detects critical on d6 when configured for d6 systems", () => {
    const roll = mockRoll([
      { faces: 6, results: [6] },
      { faces: 20, results: [20] },
    ])

    expect(isCriticalOnDie(roll, 6)).toBe(true)
    expect(isCriticalOnDie(roll, 20)).toBe(true)
  })

  it("detects crit fail only on configured test die", () => {
    const roll = mockRoll([
      { faces: 6, results: [1] },
      { faces: 20, results: [14] },
    ])

    expect(isCritFailOnDie(roll, 20)).toBe(false)
    expect(isCritFailOnDie(roll, 6)).toBe(true)
  })

  it("returns false when test die is not present in roll", () => {
    const roll = mockRoll([{ faces: 6, results: [6] }])

    expect(isCriticalOnDie(roll, 20)).toBe(false)
    expect(isCritFailOnDie(roll, 20)).toBe(false)
  })
})
