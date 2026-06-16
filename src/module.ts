import { MODULE_ID } from "./constants"
import { registerHooks } from "./data/hooks"
import { CodexApp } from "./ui/CodexApp"

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`)

  game.settings?.register(MODULE_ID as any, "hpPath" as any, {
    name: "Caminho do HP",
    hint: "Path do atributo de HP no sistema atual. Ex: system.attributes.hp.value",
    scope: "world",
    config: true,
    type: String,
    default: "system.attributes.hp.value",
  })

  game.settings?.register(MODULE_ID as any, "attackFlavor" as any, {
    name: "Texto de ataque no chat",
    hint: "Palavra que identifica mensagens de ataque no chat. Ex: 'attacking' para Shadowdark, 'attack' para D&D 5e.",
    scope: "world",
    config: true,
    type: String,
    default: "attacking",
  })
})

Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | ready`)
  registerHooks()
})

Hooks.on("renderSceneControls" as any, (_app: any, html: HTMLElement) => {
  const menu = html.querySelector("menu[data-application-part='layers']")
  if (!menu) return

  if (menu.querySelector("[data-control='codex']")) return

  const li = document.createElement("li")
  const btn = document.createElement("button")
  btn.type = "button"
  btn.classList.add("control", "ui-control", "layer", "icon", "fa-solid", "fa-book")
  btn.dataset.control = "codex"
  btn.setAttribute("aria-label", "Codex")
  btn.setAttribute("data-tooltip", "Codex")
  btn.addEventListener("click", () => new CodexApp().render(true))

  li.appendChild(btn)
  menu.appendChild(li)
})