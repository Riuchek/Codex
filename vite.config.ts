import { defineConfig } from "vite"
import { resolve } from "path"
import { viteStaticCopy } from "vite-plugin-static-copy"

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/module.ts"),
      name: "codex",
      fileName: "module",
      formats: ["es"]
    },
    outDir: "dist",
    sourcemap: true,
    minify: false
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: "module.json",          dest: ".",         rename: { stripBase: 1 } },
        { src: "styles/codex.css",     dest: "styles",    rename: { stripBase: 1 } },
        { src: "templates/codex.html", dest: "templates", rename: { stripBase: 1 } },
      ]
    })
  ]
})