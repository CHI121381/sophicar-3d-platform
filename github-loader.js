/**
 * GitHub Pages 专用加载器
 * GitHub Pages specific loader
 */

console.log('🚀 GitHub Pages 加载器启动...');

async function loadGitHubApplication() {
  try {
    console.log('📦 加载 Three.js 从 CDN...');
    
    // 使用CDN版本的Three.js
    const THREE = await import('https://unpkg.com/three@0.182.0/build/three.module.js');
    window.THREE = THREE;
    console.log('✅ Three.js 加载成功');
    
    // 加载GitHub专用版本
    console.log('📱 加载GitHub专用应用版本...');
    await import('./main-github.js');
    console.log('✅ GitHub专用版本加载成功');
    
  } catch (error) {
    console.error('❌ 应用加载失败:', error);
    
    // 显示错误信息
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        text-align: center;
        color: #ff6666;
        padding: 40px;
      `;
      
      const title = document.createElement('h2');
      title.textContent = '⚠️ 应用加载失败';
      title.style.color = '#ff6666';
      
      const message = document.createElement('p');
      message.textContent = '错误信息: ' + error.message;
      
      const buttonContainer = document.createElement('div');
      buttonContainer.style.marginTop = '30px';
      
      const reloadButton = document.createElement('button');
      reloadButton.textContent = '🔄 刷新页面';
      reloadButton.style.cssText = `
        background: #00ffff;
        color: #000;
        border: none;
        padding: 12px 24px;
        border-radius: 5px;
        cursor: pointer;
        margin: 5px;
        font-size: 14px;
      `;
      reloadButton.onclick = () => location.reload();
      
      const testButton = document.createElement('button');
      testButton.textContent = '🧪 测试版本';
      testButton.style.cssText = `
        background: #4CAF50;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 5px;
        cursor: pointer;
        margin: 5px;
        font-size: 14px;
      `;
      testButton.onclick = () => window.open('./test-simple.html', '_self');
      
      buttonContainer.appendChild(reloadButton);
      buttonContainer.appendChild(testButton);
      
      errorDiv.appendChild(title);
      errorDiv.appendChild(message);
      errorDiv.appendChild(buttonContainer);
      
      loadingContainer.innerHTML = '';
      loadingContainer.appendChild(errorDiv);
    }
  }
}

// 启动应用加载
loadGitHubApplication();