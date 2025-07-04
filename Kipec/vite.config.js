import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: 'onnx-resources' 
        },
        {
          src: 'node_modules/onnxruntime-web/dist/*.jsep.mjs', // Add this target
          dest: 'onnx-resources'
        }
      ]
    })
  ],
})

