/**
 * Vite 配置文件
 * Vite configuration file
 */
import { defineConfig } from 'vite';

export default defineConfig({
  // 基础路径配置
  base: '/sophicar-3d-platform/',
  
  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    
    // 优化配置
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three']
        }
      }
    },
    
    // 资源处理
    assetsInlineLimit: 4096,
    
    // 目标浏览器
    target: 'es2015'
  },
  
  // 开发服务器配置
  server: {
    port: 5173,
    open: true,
    cors: true
  },
  
  // 预览服务器配置
  preview: {
    port: 4173,
    open: true
  },
  
  // 路径解析
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  
  // 优化依赖
  optimizeDeps: {
    include: ['three']
  }
});