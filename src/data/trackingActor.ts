let trackingActorId = ""

export function setTrackingActorId(id: string): void {
  trackingActorId = id
}

export function getTrackingActor(): Actor | null {
  if (!trackingActorId) return null
  return game.actors?.get(trackingActorId) ?? null
}
