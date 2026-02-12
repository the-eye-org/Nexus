//

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/nexus/', // App expects to run at /nexus path
  plugins: [react()],
})
