/**
 * 测试主入口文件 - 简化版本用于调试模块加载问题
 */

console.log('🚀 测试主入口文件开始加载...');

// 测试基本的模块加载
try {
  console.log('📦 开始导入Three.js...');
  
  // 动态导入Three.js以避免静态导入问题
  const THREE = await import('three');
  console.log('✅ Three.js导入成功:', THREE);
  
  // 创建一个简单的测试场景
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  
  console.log('✅ Three.js基础对象创建成功');
  
  // 移除加载界面
  const loadingContainer = document.getElementById('loadingContainer');
  if (loadingContainer) {
    loadingContainer.style.display = 'none';
  }
  
  // 显示成功信息
  document.body.innerHTML += `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 255, 255, 0.1);
      border: 2px solid #00ffff;
      border-radius: 10px;
      padding: 20px;
      color: #00ffff;
      font-family: 'Microsoft YaHei', Arial, sans-serif;
      text-align: center;
      z-index: 3000;
    ">
      <h2>🎉 模块加载测试成功！</h2>
      <p>Three.js版本: ${THREE.REVISION}</p>
      <p>所有基础模块都能正常加载</p>
      <button onclick="location.reload()" style="
        background: #00ffff;
        color: #000;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
      ">重新测试</button>
    </div>
  `;
  
} catch (error) {
  console.error('❌ 模块加载失败:', error);
  
  // 显示错误信息
  document.body.innerHTML += `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.1);
      border: 2px solid #ff6b6b;
      border-radius: 10px;
      padding: 20px;
      color: #ff6b6b;
      font-family: 'Microsoft YaHei', Arial, sans-serif;
      text-align: center;
      z-index: 3000;
    ">
      <h2>❌ 模块加载失败</h2>
      <p>错误信息: ${error.message}</p>
      <p>请检查网络连接和模块路径</p>
      <button onclick="location.reload()" style="
        background: #ff6b6b;
        color: #fff;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
      ">重新测试</button>
    </div>
  `;
}