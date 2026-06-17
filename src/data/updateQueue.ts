export class UpdateQueue {
  private readonly chains = new Map<string, Promise<void>>()

  enqueue(id: string, fn: () => Promise<void>): Promise<void> {
    const current = this.chains.get(id) ?? Promise.resolve()
    const next = current.then(fn)
    this.chains.set(id, next)
    return next
  }

  getChain(id: string): Promise<void> | undefined {
    return this.chains.get(id)
  }

  clear(): void {
    this.chains.clear()
  }
}

export const actorUpdateQueue = new UpdateQueue()
