import { defineConfig } from 'vite'

export default defineConfig({
    root: '.',  // or 'src' if your source files are there
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
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
})