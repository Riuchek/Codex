import { describe, it, expect } from "vitest"
import { getNestedValue } from "./constants"

describe("getNestedValue", () => {
  it("reads nested path", () => {
    const obj = { system: { attributes: { hp: { value: 12 } } } }
    expect(getNestedValue(obj, "system.attributes.hp.value")).toBe(12)
  })

  it("returns undefined for missing path", () => {
    expect(getNestedValue({}, "a.b.c")).toBeUndefined()
  })

  it("returns undefined for null intermediate", () => {
    expect(getNestedValue({ a: null }, "a.b")).toBeUndefined()
  })
})
