/**
 * Sophicar 3D数字交互平台 - 简化测试版本
 * Simplified test version for debugging
 */
import * as THREE from 'three';

console.log('🚀 开始加载简化版本...');

// 简化的应用类
class SimpleSophicarApp {
  constructor() {
    console.log('📱 初始化简化应用...');
    this.init();
  }

  async init() {
    try {
      console.log('🔧 开始初始化...');
      
      // 等待加载动画完成
      await this.waitForLoadingComplete();
      
      // 创建简单的3D场景
      this.createSimpleScene();
      
      console.log('✅ 简化版本初始化完成！');
      
    } catch (error) {
      console.error('❌ 初始化失败:', error);
      this.showError(error.message);
    }
  }

  async waitForLoadingComplete() {
    return new Promise((resolve) => {
      console.log('⏳ 等待加载动画...');
      
      // 简单的超时机制
      setTimeout(() => {
        console.log('⚠️ 跳过加载动画，直接启动');
        this.hideLoadingScreen();
        resolve();
      }, 3000); // 3秒后强制继续
    });
  }

  hideLoadingScreen() {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
      console.log('🎯 加载界面已隐藏');
    }
    
    // 显示控制面板
    const controls = document.getElementById('controls');
    if (controls) {
      controls.style.display = 'block';
    }
  }

  createSimpleScene() {
    console.log('🎨 创建简单3D场景...');
    
    // 创建容器
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 10;
    `;
    document.body.appendChild(container);

    // 创建Three.js场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    // 创建相机
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 添加简单的立方体
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff,
      wireframe: true 
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // 添加光源
    const light = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(light);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // 处理窗口大小变化
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    console.log('✅ 简单场景创建完成');
  }

  showError(message) {
    console.error('显示错误:', message);
    
    // 隐藏加载界面
    this.hideLoadingScreen();
    
    // 显示错误信息
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      z-index: 9999;
    `;
    errorDiv.innerHTML = `
      <h3>⚠️ 加载失败</h3>
      <p>${message}</p>
      <button onclick="location.reload()" style="
        background: #fff;
        color: #000;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 10px;
      ">刷新页面</button>
    `;
    document.body.appendChild(errorDiv);
  }
}

// 创建应用实例
console.log('🎯 启动简化版本应用...');
window.simpleSophicarApp = new SimpleSophicarApp();

export { SimpleSophicarApp };