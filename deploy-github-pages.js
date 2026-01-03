/**
 * GitHub Pages 手动部署脚本
 * Manual deployment script for GitHub Pages
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始准备GitHub Pages部署...');

// 创建部署目录
const deployDir = 'github-pages-deploy';
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir);
  console.log('✅ 创建部署目录');
}

// 复制必要文件
const filesToCopy = [
  'index-github.html',
  'main-github.js',
  'github-loader.js'
];

filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    // 如果是index-github.html，重命名为index.html
    const targetName = file === 'index-github.html' ? 'index.html' : file;
    const targetPath = path.join(deployDir, targetName);
    
    fs.writeFileSync(targetPath, content);
    console.log(`✅ 复制 ${file} -> ${targetName}`);
  } else {
    console.log(`⚠️ 文件不存在: ${file}`);
  }
});

// 创建.nojekyll文件
fs.writeFileSync(path.join(deployDir, '.nojekyll'), '');
console.log('✅ 创建 .nojekyll 文件');

// 创建简单的package.json
const packageJson = {
  "type": "module",
  "dependencies": {
    "three": "^0.182.0"
  }
};

fs.writeFileSync(
  path.join(deployDir, 'package.json'), 
  JSON.stringify(packageJson, null, 2)
);
console.log('✅ 创建 package.json');

console.log('🎉 GitHub Pages部署文件准备完成！');
console.log('📁 部署文件位于:', deployDir);
console.log('');
console.log('📋 接下来的步骤:');
console.log('1. 将 github-pages-deploy 目录中的所有文件复制到你的GitHub仓库根目录');
console.log('2. 提交并推送到GitHub');
console.log('3. 在GitHub仓库设置中启用GitHub Pages');
console.log('4. 访问 https://chi121381.github.io/sophicar-3d-platform');