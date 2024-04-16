import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        port: 3000,
        proxy: {
            '/uploaded-audio': {
                target: 'http://localhost:5555',
                changeOrigin: true,
                secure: false,
            }
        }
    },
    build: {
        target: 'esnext'
    },
})