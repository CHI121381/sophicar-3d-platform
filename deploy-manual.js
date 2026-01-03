#!/usr/bin/env node

/**
 * 手动部署脚本 - 用于GitHub Pages部署
 * Manual deployment script for GitHub Pages
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 开始手动部署到GitHub Pages...');

try {
  // 1. 备份原始index.html
  console.log('📋 备份原始文件...');
  if (fs.existsSync('index.html')) {
    fs.copyFileSync('index.html', 'index-backup.html');
  }

  // 2. 使用GitHub Pages版本
  console.log('🔄 切换到GitHub Pages版本...');
  if (fs.existsSync('index-github.html')) {
    fs.copyFileSync('index-github.html', 'index.html');
  }

  // 3. 构建项目
  console.log('🔨 构建项目...');
  execSync('npm run build', { stdio: 'inherit' });

  // 4. 复制必要文件到dist
  console.log('📁 复制源文件...');
  const filesToCopy = [
    { src: 'src', dest: 'dist/src', isDir: true },
    { src: 'main.js', dest: 'dist/main.js' },
    { src: 'main-simple.js', dest: 'dist/main-simple.js' },
    { src: 'test-simple.html', dest: 'dist/test-simple.html' }
  ];

  filesToCopy.forEach(file => {
    try {
      if (file.isDir && fs.existsSync(file.src)) {
        execSync(`cp -r ${file.src} ${file.dest}`, { stdio: 'inherit' });
      } else if (fs.existsSync(file.src)) {
        fs.copyFileSync(file.src, file.dest);
      }
      console.log(`✅ 复制: ${file.src} -> ${file.dest}`);
    } catch (error) {
      console.log(`⚠️ 跳过: ${file.src} (文件不存在)`);
    }
  });

  // 5. 创建.nojekyll文件
  console.log('📝 创建.nojekyll文件...');
  fs.writeFileSync('dist/.nojekyll', '');

  // 6. 恢复原始index.html
  console.log('🔄 恢复原始文件...');
  if (fs.existsSync('index-backup.html')) {
    fs.copyFileSync('index-backup.html', 'index.html');
    fs.unlinkSync('index-backup.html');
  }

  console.log('✅ 手动部署准备完成！');
  console.log('📁 dist目录已准备好，可以上传到GitHub Pages');
  console.log('🌐 或者运行: git add . && git commit -m "Deploy" && git push');

} catch (error) {
  console.error('❌ 部署失败:', error.message);
  
  // 恢复原始文件
  if (fs.existsSync('index-backup.html')) {
    fs.copyFileSync('index-backup.html', 'index.html');
    fs.unlinkSync('index-backup.html');
  }
  
  process.exit(1);
}