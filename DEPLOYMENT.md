# 🚀 Sophicar 3D平台部署指南

## 📋 部署选项

### 1. GitHub Pages 部署（推荐）

#### 步骤 1: 创建GitHub仓库
1. 访问 [GitHub](https://github.com)
2. 点击 "New repository"
3. 仓库名称：`sophicar-3d-platform`
4. 设置为 Public（GitHub Pages 免费版需要公开仓库）
5. 点击 "Create repository"

#### 步骤 2: 上传代码
```bash
# 添加远程仓库（替换 yourusername 为你的GitHub用户名）
git remote add origin https://github.com/yourusername/sophicar-3d-platform.git

# 推送代码
git branch -M main
git push -u origin main
```

#### 步骤 3: 启用GitHub Pages
1. 进入仓库设置页面
2. 滚动到 "Pages" 部分
3. Source 选择 "GitHub Actions"
4. 代码推送后会自动触发部署

#### 访问地址
- `https://yourusername.github.io/sophicar-3d-platform`

---

### 2. Vercel 部署（最简单）

#### 方法 A: 通过GitHub连接
1. 访问 [Vercel](https://vercel.com)
2. 使用GitHub账号登录
3. 点击 "New Project"
4. 导入你的 `sophicar-3d-platform` 仓库
5. 框架预设选择 "Vite"
6. 点击 "Deploy"

#### 方法 B: 使用Vercel CLI
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署项目
vercel

# 部署到生产环境
vercel --prod
```

#### 访问地址
- `https://sophicar-3d-platform.vercel.app`（或Vercel分配的域名）

---

### 3. Netlify 部署

#### 方法 A: 拖拽部署
1. 运行 `npm run build` 构建项目
2. 访问 [Netlify](https://netlify.com)
3. 将 `dist` 文件夹拖拽到部署区域

#### 方法 B: GitHub连接
1. 在Netlify连接GitHub仓库
2. 构建命令：`npm run build`
3. 发布目录：`dist`

---

## 🔧 部署前检查清单

- [ ] 项目构建成功 (`npm run build`)
- [ ] 所有测试通过 (`npm test`)
- [ ] 3D模型文件已放置在 `public/models/` 目录
- [ ] 更新README中的演示链接
- [ ] 检查.gitignore文件是否正确

## 📁 重要文件说明

- `vercel.json` - Vercel部署配置
- `.github/workflows/deploy.yml` - GitHub Pages自动部署
- `dist/` - 构建输出目录（部署文件）
- `public/` - 静态资源目录

## 🌐 自定义域名（可选）

### GitHub Pages
1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容为你的域名：`your-domain.com`
3. 在域名DNS设置中添加CNAME记录指向 `yourusername.github.io`

### Vercel
1. 在Vercel项目设置中添加自定义域名
2. 按照提示配置DNS记录

## 🔍 故障排除

### 常见问题
1. **3D模型不显示**：检查模型文件路径和格式
2. **页面空白**：查看浏览器控制台错误信息
3. **构建失败**：检查依赖项和Node.js版本

### 调试命令
```bash
# 本地预览构建结果
npm run preview

# 检查构建输出
npm run build && ls -la dist/

# 运行测试
npm test
```

## 📞 技术支持

如果遇到部署问题，请检查：
1. Node.js版本 >= 16
2. 网络连接是否正常
3. GitHub/Vercel账号权限
4. 构建日志中的错误信息

---

**🎉 部署完成后，你的Sophicar 3D平台就可以通过网址访问了！**