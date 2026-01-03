/**
 * Sophicar 3D数字交互平台 - GitHub Pages版本
 * Sophicar 3D Digital Interactive Platform - GitHub Pages Version
 */

// 使用全局的THREE对象（从CDN加载）
const THREE = window.THREE;

console.log('🚀 开始初始化GitHub Pages版本...');

/**
 * 简化的场景管理器 - 内联版本
 */
class SimpleSceneManager {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.objects = new Map();
    
    this.initializeScene();
  }

  initializeScene() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(10, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 添加光照
    this.setupLighting();
    
    // 开始渲染循环
    this.animate();
  }

  setupLighting() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);

    // 主光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // 补充光源
    const fillLight = new THREE.DirectionalLight(0x00ffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }

  addObject(object, id) {
    this.objects.set(id, object);
    this.scene.add(object);
  }

  getObject(id) {
    return this.objects.get(id);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }
}

/**
 * 简化的交互控制器
 */
class SimpleInteractionController {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.domElement = renderer.domElement;
    
    this.setupControls();
  }

  setupControls() {
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let cameraDistance = 15;

    this.domElement.addEventListener('mousedown', (event) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    this.domElement.addEventListener('mousemove', (event) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      // 旋转相机
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(this.camera.position);
      spherical.theta -= deltaX * 0.01;
      spherical.phi += deltaY * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      this.camera.position.setFromSpherical(spherical);
      this.camera.lookAt(0, 0, 0);

      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    this.domElement.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    this.domElement.addEventListener('wheel', (event) => {
      cameraDistance += event.deltaY * 0.01;
      cameraDistance = Math.max(5, Math.min(50, cameraDistance));
      
      const direction = new THREE.Vector3();
      direction.subVectors(this.camera.position, new THREE.Vector3(0, 0, 0)).normalize();
      this.camera.position.copy(direction.multiplyScalar(cameraDistance));
    });
  }

  updateInteractions() {
    // 简化版本不需要复杂的交互更新
  }
}

/**
 * GitHub Pages版本的应用程序主类
 */
class GitHubSophicarApp {
  constructor() {
    this.container = null;
    this.sceneManager = null;
    this.interactionController = null;
    this.tunnelDriveActive = false;
    
    this.createContainer();
    this.init();
  }

  async init() {
    try {
      console.log('🚀 开始初始化GitHub Pages版本...');
      
      // 等待加载动画完成
      await this.waitForLoadingComplete();
      
      // 初始化核心组件
      this.initializeCore();
      
      // 设置交互控制
      this.setupInteractions();
      
      // 加载示例内容
      await this.loadExampleContent();
      
      // 创建UI控制按钮
      this.createUIControls();
      
      console.log('🎉 GitHub Pages版本初始化完成！');
      
    } catch (error) {
      console.error('❌ 应用初始化失败:', error);
      this.showErrorMessage('应用初始化失败：' + error.message);
    }
  }

  async waitForLoadingComplete() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.hideLoadingScreen();
        resolve();
      }, 2000);
    });
  }

  hideLoadingScreen() {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }
    
    const controls = document.getElementById('controls');
    if (controls) {
      controls.style.display = 'block';
    }
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      width: 100vw;
      height: 100vh;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 30%, #16213e 70%, #0f3460 100%);
      position: relative;
      z-index: 10;
    `;
    document.body.appendChild(this.container);
  }

  initializeCore() {
    this.sceneManager = new SimpleSceneManager(this.container);
  }

  setupInteractions() {
    this.interactionController = new SimpleInteractionController(
      this.sceneManager.scene,
      this.sceneManager.camera,
      this.sceneManager.renderer
    );
  }

  async loadExampleContent() {
    // 添加地面
    this.addGround();
    
    // 添加小车模型
    this.addCarModel();
    
    // 设置赛博朋克风格
    this.setupCyberpunkScene();
  }

  addGround() {
    const groundGeometry = new THREE.PlaneGeometry(30, 30, 32, 32);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x001122,
      transparent: true,
      opacity: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground_plane';
    
    this.sceneManager.addObject(ground, 'ground');
  }

  addCarModel() {
    const carGroup = new THREE.Group();
    carGroup.name = 'SophicarVehicle';
    
    // 车身
    const bodyGeometry = new THREE.BoxGeometry(4, 1.5, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: 0x0066cc,
      emissive: new THREE.Color(0x001133),
      emissiveIntensity: 0.3
    });
    const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    carBody.position.set(0, 0.75, 0);
    carBody.castShadow = true;
    carBody.receiveShadow = true;
    carGroup.add(carBody);
    
    // SOPHICAR标识
    const textGeometry = new THREE.BoxGeometry(3, 0.2, 0.1);
    const textMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ffff,
      emissive: new THREE.Color(0x00ffff),
      emissiveIntensity: 0.8
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 1.7, 4.1);
    carGroup.add(textMesh);
    
    // 轮子
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    
    const wheelPositions = [
      { x: 1.5, z: 2.5 },   // 前左
      { x: -1.5, z: 2.5 },  // 前右
      { x: 1.5, z: -2.5 },  // 后左
      { x: -1.5, z: -2.5 }  // 后右
    ];
    
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos.x, 0.3, pos.z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      carGroup.add(wheel);
    });
    
    // 设置车辆位置
    carGroup.position.set(0, 0, 0);
    carGroup.rotation.y = Math.PI;
    
    // 保存基础高度用于动画
    carGroup.userData.baseHeight = 0;
    
    this.sceneManager.addObject(carGroup, 'sophicar_vehicle');
    
    // 开始车辆动画
    this.startCarAnimation();
  }

  startCarAnimation() {
    const animate = () => {
      const carModel = this.sceneManager.getObject('sophicar_vehicle');
      if (carModel && !this.tunnelDriveActive) {
        const time = performance.now() * 0.001;
        
        // 轻微的上下浮动
        carModel.position.y = carModel.userData.baseHeight + Math.sin(time * 0.5) * 0.02;
        
        // 发光效果变化
        carModel.traverse((child) => {
          if (child.isMesh && child.material && child.material.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.1;
          }
        });
      }
      
      requestAnimationFrame(animate);
    };
    animate();
  }

  setupCyberpunkScene() {
    // 添加赛博朋克光源
    const cyberLight1 = new THREE.PointLight(0x00ffff, 1, 20);
    cyberLight1.position.set(-5, 1, 5);
    this.sceneManager.scene.add(cyberLight1);
    
    const cyberLight2 = new THREE.PointLight(0x0080ff, 0.8, 15);
    cyberLight2.position.set(5, 1, -5);
    this.sceneManager.scene.add(cyberLight2);
  }

  createUIControls() {
    // 创建隧道驾驶按钮
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
    `;
    
    const tunnelDriveButton = document.createElement('button');
    tunnelDriveButton.innerHTML = `
      <span>🚀</span>
      <span>隧道驾驶</span>
    `;
    tunnelDriveButton.style.cssText = `
      background: linear-gradient(135deg, #0066cc 0%, #0080ff 100%);
      border: 2px solid #00ffff;
      border-radius: 12px;
      color: white;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 15px rgba(0, 255, 255, 0.3);
      transition: all 0.3s ease;
      font-family: 'Microsoft YaHei', sans-serif;
    `;
    
    tunnelDriveButton.addEventListener('click', () => {
      this.startTunnelDrive();
    });
    
    buttonContainer.appendChild(tunnelDriveButton);
    document.body.appendChild(buttonContainer);
  }

  startTunnelDrive() {
    if (this.tunnelDriveActive) return;
    
    console.log('🚀 启动隧道驾驶效果...');
    this.tunnelDriveActive = true;
    
    const carModel = this.sceneManager.getObject('sophicar_vehicle');
    if (!carModel) return;
    
    // 创建隧道效果
    this.createTunnelEffect();
    
    // 车辆前进动画
    const startPosition = carModel.position.clone();
    const duration = 8000; // 8秒
    const startTime = performance.now();
    
    const animateTunnel = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress < 1) {
        // 车辆向前移动
        carModel.position.z = startPosition.z - progress * 50;
        
        // 相机跟随
        this.sceneManager.camera.position.z = 10 - progress * 45;
        this.sceneManager.camera.lookAt(carModel.position);
        
        requestAnimationFrame(animateTunnel);
      } else {
        // 重置位置
        carModel.position.copy(startPosition);
        this.sceneManager.camera.position.set(10, 5, 10);
        this.sceneManager.camera.lookAt(0, 0, 0);
        
        // 清理隧道效果
        this.clearTunnelEffect();
        this.tunnelDriveActive = false;
        
        console.log('✅ 隧道驾驶完成');
      }
    };
    
    animateTunnel();
  }

  createTunnelEffect() {
    // 创建隧道环
    for (let i = 0; i < 20; i++) {
      const ringGeometry = new THREE.RingGeometry(3, 4, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.z = -i * 5;
      ring.name = `tunnel_ring_${i}`;
      
      this.sceneManager.addObject(ring, `tunnel_ring_${i}`);
    }
  }

  clearTunnelEffect() {
    // 清理隧道环
    for (let i = 0; i < 20; i++) {
      const ring = this.sceneManager.getObject(`tunnel_ring_${i}`);
      if (ring) {
        this.sceneManager.scene.remove(ring);
      }
    }
  }

  showErrorMessage(message) {
    console.error('显示错误:', message);
  }
}

// 等待DOM加载完成后启动应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.githubSophicarApp = new GitHubSophicarApp();
  });
} else {
  window.githubSophicarApp = new GitHubSophicarApp();
}

export { GitHubSophicarApp };