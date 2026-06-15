import { MODULE_ID } from "./constants"
import { registerHooks } from "./data/hooks"
import { CodexApp } from "./ui/CodexApp"

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | init`)
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