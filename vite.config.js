/**
 * Vite 配置文件
 * Vite configuration file
 */
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages部署路径配置
  base: process.env.NODE_ENV === 'production' ? '/sophicar-3d-platform/' : '/',
  
  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    
    // 确保所有资源都被正确处理
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three']
        },
        // 确保文件名一致性
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // 资源处理
    assetsInlineLimit: 4096,
    
    // 目标浏览器
    target: 'es2015',
    
    // 确保模块正确处理
    commonjsOptions: {
      include: [/node_modules/]
    }
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