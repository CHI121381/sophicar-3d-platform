@echo off
echo 🚀 开始部署到GitHub Pages...
echo.

echo 📦 添加文件到Git...
git add .

echo 📝 提交更改...
git commit -m "更新GitHub Pages版本 - 完整功能部署"

echo 🌐 推送到GitHub...
git push origin main

echo.
echo ✅ 部署完成！
echo 🔗 请访问: https://chi121381.github.io/sophicar-3d-platform
echo.
echo 📋 如果网站没有立即更新，请等待1-2分钟让GitHub Pages重新构建
pause