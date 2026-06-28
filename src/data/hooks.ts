import { getRecord, incrementStats, updateRecord } from "./ActorRecord"
import { getSettings } from "./SettingsManager"
import {
  getMessageRolls,
  getHpDelta,
  isCriticalOnDie,
  isCritFailOnDie,
  matchesAttackFlavor,
} from "./rollUtils"

export function registerHooks() {
  Hooks.on("createChatMessage", async (message: ChatMessage) => {
    if (!(message as any).isAuthor) return
    if (!message.isRoll && !message.rolls?.length) return

    const actor = getActorFromMessage(message)
    if (!actor?.hasPlayerOwner) return

    const rolls = getMessageRolls(message)
    if (!rolls.length) return

    const attackFlavor = getSettings().attackFlavor
    const testDieFaces = getSettings().testDieFaces
    const isAttack = matchesAttackFlavor(message, attackFlavor)

    if (isAttack) {
      const attackRoll     = rolls[0]
      const damageRoll     = rolls[1]
      const isCritical     = isCriticalOnDie(attackRoll, testDieFaces)
      const isCriticalFail = isCritFailOnDie(attackRoll, testDieFaces)
      const damageDealt    = damageRoll?.total ?? 0

      await incrementStats(actor, {
        criticals:     isCritical ? 1 : 0,
        criticalFails: isCriticalFail ? 1 : 0,
        damageDealt,
      })

      if (isCritical) {
        ui.notifications?.info(`Codex | ${game.i18n?.format("CODEX.NotifCritical", { name: actor.name })}`)
      }
      return
    }

    const roll       = rolls[0]
    const isCritical = isCriticalOnDie(roll, testDieFaces)
    const isCritFail = isCritFailOnDie(roll, testDieFaces)

    await incrementStats(actor, {
      criticals:     isCritical ? 1 : 0,
      criticalFails: isCritFail ? 1 : 0,
    })

    if (isCritical) {
      ui.notifications?.info(`Codex | ${game.i18n?.format("CODEX.NotifCritical", { name: actor.name })}`)
    }
  })

  Hooks.on("updateActor", async (actor: Actor, diff: any) => {
    if (!diff.name && !diff.img) return

    const current = getRecord(actor)
    await updateRecord(actor, {
      name: actor.name ?? current.name,
      img:  actor.img  ?? current.img,
    })
  })

  Hooks.on("preUpdateActor", (actor: Actor, diff: any): void => {
    if (!actor.hasPlayerOwner) return
    const delta = getHpDelta(actor, diff, getSettings().hpPath)
    if (delta === undefined) return

    void incrementStats(actor, { damageTaken: delta })
  })
}

function getActorFromMessage(message: ChatMessage): Actor | null {
  const speakerActor = (message as any).speakerActor as Actor | null | undefined
  if (speakerActor) return speakerActor

  const speakerId = message.speaker?.actor
  if (speakerId) return game.actors?.get(speakerId) ?? null

  const tokenId = message.speaker?.token
  if (tokenId) {
    const token = canvas?.tokens?.get(tokenId)
    if (token?.actor) return token.actor
  }

  const authorId = typeof message.author === "string"
    ? message.author
    : (message.author as any)?.id
  if (authorId) {
    const user = game.users?.get(authorId)
    if (user?.character) return user.character
  }

  const controlled = canvas?.tokens?.controlled ?? []
  if (controlled.length === 1 && controlled[0]?.actor) return controlled[0].actor

  return null
}