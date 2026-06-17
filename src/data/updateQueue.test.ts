import { describe, it, expect } from "vitest"
import { UpdateQueue } from "./updateQueue"

describe("UpdateQueue", () => {
  it("serializes operations per id", async () => {
    const queue = new UpdateQueue()
    const order: number[] = []

    const first = queue.enqueue("a", async () => {
      await new Promise(r => setTimeout(r, 20))
      order.push(1)
    })

    const second = queue.enqueue("a", async () => {
      order.push(2)
    })

    await Promise.all([first, second])
    expect(order).toEqual([1, 2])
  })

  it("runs different ids in parallel", async () => {
    const queue = new UpdateQueue()
    let aDone = false
    let bDone = false

    const pa = queue.enqueue("a", async () => {
      await new Promise(r => setTimeout(r, 30))
      aDone = true
    })

    const pb = queue.enqueue("b", async () => {
      bDone = true
    })

    await pb
    expect(bDone).toBe(true)
    expect(aDone).toBe(false)
    await pa
    expect(aDone).toBe(true)
  })
})
