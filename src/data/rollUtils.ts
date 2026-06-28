function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

export function getMessageFlavor(message: ChatMessage): string {
  const raw = (message as any).flavor
  if (typeof raw !== "string" || !raw) return ""
  return stripHtml(raw).toLowerCase()
}

function parseRoll(data: unknown): Roll<any> | null {
  if (data instanceof Roll) return data
  try {
    if (typeof data === "string") return Roll.fromJSON(data) as Roll<any>
    if (typeof data === "object" && data !== null) return Roll.fromData(data as Roll.Data) as Roll<any>
  } catch {
    return null
  }
  return null
}

export function getMessageRolls(message: ChatMessage): Roll<any>[] {
  const source = (message as any)._source?.rolls ?? message.rolls ?? []
  if (!source?.length) return []
  return source.map(parseRoll).filter((roll: Roll<any> | null): roll is Roll<any> => roll !== null)
}

function getRollDice(roll: Roll<any>): any[] {
  const dice = roll.dice
  if (dice?.length) return dice
  const terms = (roll as any).terms ?? []
  return terms.filter((term: any) => typeof term?.faces === "number")
}

function dieResults(die: any): number[] {
  if (die.results?.length) return die.results.map((r: any) => r.result ?? r)
  if (typeof die.total === "number") return [die.total]
  return []
}

export function findDieByFaces(roll: Roll<any> | undefined, faces: number): any | undefined {
  if (!roll || !faces) return undefined
  return getRollDice(roll).find((d: any) => d.faces === faces)
}

export function isCriticalOnDie(roll: Roll<any> | undefined, faces: number): boolean {
  const die = findDieByFaces(roll, faces)
  if (!die) return false
  return dieResults(die).some(r => r === faces)
}

export function isCritFailOnDie(roll: Roll<any> | undefined, faces: number): boolean {
  const die = findDieByFaces(roll, faces)
  if (!die) return false
  return dieResults(die).some(r => r === 1)
}

export function isD20Critical(roll: Roll<any> | undefined): boolean {
  return isCriticalOnDie(roll, 20)
}

export function isD20CritFail(roll: Roll<any> | undefined): boolean {
  return isCritFailOnDie(roll, 20)
}

export function isMaxOnMainDie(roll: Roll<any> | undefined): boolean {
  if (!roll) return false
  const die = getRollDice(roll)[0]
  if (!die) return false
  const faces = die.faces ?? 20
  return dieResults(die).some(r => r === faces)
}

export function isNatural1OnMainDie(roll: Roll<any> | undefined): boolean {
  if (!roll) return false
  const die = getRollDice(roll)[0]
  if (!die) return false
  return dieResults(die).some(r => r === 1)
}

export function matchesAttackFlavor(message: ChatMessage, attackFlavor: string): boolean {
  const needle = attackFlavor.trim().toLowerCase()
  if (!needle) return false
  const flavor = getMessageFlavor(message)
  if (flavor.includes(needle)) return true
  return getMessageRolls(message).some(roll => {
    const rollFlavor = typeof (roll as any).options?.flavor === "string"
      ? stripHtml((roll as any).options.flavor).toLowerCase()
      : ""
    return rollFlavor.includes(needle)
  })
}

export function getHpDelta(actor: Actor, diff: any, hpPath: string): number | undefined {
  const newHp = getNestedValueFromDiff(diff, hpPath)
  if (newHp === undefined) return undefined

  const oldHp = getNestedValueFromDiff(actor, hpPath)
  if (typeof oldHp !== "number" || typeof newHp !== "number") return undefined

  const delta = oldHp - newHp
  return delta > 0 ? delta : undefined
}

function getNestedValueFromDiff(obj: any, path: string): any {
  const nested = path.split(".").reduce((acc, key) => acc?.[key], obj)
  if (nested !== undefined) return nested
  if (obj?.[path] !== undefined) return obj[path]
  return undefined
}
