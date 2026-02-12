//

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/', // Main nginx strips /nexus before forwarding
  plugins: [react()],
})
