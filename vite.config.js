import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/* Virtual module `virtual:manifesto-images`: the list of image URLs found in
   public/assets/manifesto-background-images (sorted by name). Drop images in the
   folder and the carousel picks them up – no code change needed. */
const IMG_DIR = 'assets/manifesto-background-images'
function manifestoImages() {
  const id = 'virtual:manifesto-images'
  const resolved = '\0' + id
  const dir = path.resolve(__dirname, 'public', IMG_DIR)
  const list = () =>
    (fs.existsSync(dir) ? fs.readdirSync(dir) : [])
      .filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((f) => `/${IMG_DIR}/${encodeURIComponent(f)}`)
  return {
    name: 'manifesto-images',
    resolveId: (s) => (s === id ? resolved : null),
    load: (s) => (s === resolved ? `export default ${JSON.stringify(list())}` : null),
    configureServer(server) {
      server.watcher.add(dir)
      const refresh = (file) => {
        if (!file.startsWith(dir)) return
        const mod = server.moduleGraph.getModuleById(resolved)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh).on('unlink', refresh)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), manifestoImages()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
