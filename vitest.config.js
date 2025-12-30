/**
 * Vitest 配置文件
 * Vitest configuration file
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 测试环境配置
    environment: 'jsdom',
    
    // 全局设置
    globals: true,
    
    // 环境变量
    env: {
      NODE_ENV: 'test'
    },
    
    // 测试文件匹配模式
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // 排除文件
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.config.js',
        '**/*.test.js',
        '**/*.spec.js'
      ]
    },
    
    // 测试超时设置
    testTimeout: 10000,
    
    // 设置测试环境
    setupFiles: ['./test/setup.js']
  },
  
  // Vite 配置
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});