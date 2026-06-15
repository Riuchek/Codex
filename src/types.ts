export interface ActorRecord {
    name: string
    img: string
    stats: {
      damageDealt: number
      damageTaken: number
      criticals: number
      criticalFails: number
      killCount: number
    }
    epithets: Epithet[]
    journal: JournalEntry[]
  }
  
  export interface Epithet {
    label: string
    auto: boolean
  }
  
  export interface JournalEntry {
    id: string
    title: string
    content: string
    createdAt: number
    tags: string[]
  }