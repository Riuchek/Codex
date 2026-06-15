import { MODULE_ID } from "../constants"
import { getRecord, updateStats } from "./ActorRecord"

export function registerHooks() {
  Hooks.on("createChatMessage", async (message: ChatMessage) => {
    if (!message.isRoll) return
  
    const actor = getActorFromMessage(message)
    if (!actor) return
  
    const current = getRecord(actor)
    const flavor = (message as any).flavor?.toLowerCase() ?? ""
    const isAttack = flavor.includes("attacking") || flavor.includes("attack")
  
    if (isAttack) {
      const attackRoll = message.rolls?.[0]
      const damageRoll = message.rolls?.[1]
  
      const d20 = attackRoll?.dice.find((d: any) => d.faces === 20)
      const isCritical     = d20?.total === 20
      const isCriticalFail = d20?.total === 1
      const damageDealt    = damageRoll?.total ?? 0
  
      await updateStats(actor, {
        criticals:     current.stats.criticals     + (isCritical ? 1 : 0),
        criticalFails: current.stats.criticalFails + (isCriticalFail ? 1 : 0),
        damageDealt:   current.stats.damageDealt   + damageDealt,
      })
  
      if (isCritical) {
        ui.notifications?.info(`Codex | ${actor.name} acertou um crítico!`)
      }
      return
    }
  
    // fallback rolagem genérica
    const roll = message.rolls?.[0]
    if (!roll) return
  
    const mainDie      = roll.dice[0]
    const total        = mainDie?.total ?? 0
    const faces        = mainDie?.faces ?? 20
    const isCritical   = total === faces
    const isCritFail   = total === 1
  
    await updateStats(actor, {
      criticals:     current.stats.criticals     + (isCritical ? 1 : 0),
      criticalFails: current.stats.criticalFails + (isCritFail ? 1 : 0),
    })
  
    if (isCritical) {
      ui.notifications?.info(`Codex | ${actor.name} acertou um crítico!`)
    }
  })

  Hooks.on("updateActor", async (actor: Actor, diff: any) => {
    if (!diff.name && !diff.img) return
  
    const current = getRecord(actor)
    await actor.setFlag(MODULE_ID as any, "record", {
      ...current,
      name: actor.name ?? current.name,
      img:  actor.img  ?? current.img,
    })
  })

  Hooks.on("preUpdateActor", (actor: Actor, diff: any): void => {
    const newHp = diff?.system?.attributes?.hp?.value
    if (newHp === undefined) return
  
    const oldHp = (actor as any).system?.attributes?.hp?.value
    if (oldHp === undefined) return
  
    const delta = oldHp - newHp
    if (delta <= 0) return
  
    void handleDamageTaken(actor, delta)
  })
  
  async function handleDamageTaken(actor: Actor, delta: number): Promise<void> {
    const current = getRecord(actor)
    await updateStats(actor, {
      damageTaken: current.stats.damageTaken + delta,
    })
  }
}

function getActorFromMessage(message: ChatMessage): Actor | null {
  const speakerId = message.speaker?.actor
  if (speakerId) {
    return game.actors?.get(speakerId) ?? null
  }

  const tokenId = message.speaker?.token
  if (tokenId) {
    const token = canvas?.tokens?.get(tokenId)
    return token?.actor ?? null
  }

  return null
}