/**
 * Sophicar 3D数字交互平台 - GitHub Pages版本
 * Sophicar 3D Digital Interactive Platform - GitHub Pages Version
 */

// 使用全局的THREE对象（从CDN加载）
const THREE = window.THREE;

console.log('🚀 开始初始化GitHub Pages版本...');

/**
 * 完整的场景管理器 - GitHub Pages版本
 */
class GitHubSceneManager {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.objects = new Map();
    this.lights = new Map();
    
    this.initializeScene();
  }

  initializeScene() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    this.scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(15, 8, 15);
    this.camera.lookAt(0, 0, 0);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // 添加光照
    this.setupLighting();
    
    // 开始渲染循环
    this.animate();
  }

  setupLighting() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);
    this.lights.set('ambient', ambientLight);

    // 主光源 - 模拟太阳光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(20, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.bias = -0.0001;
    this.scene.add(directionalLight);
    this.lights.set('main', directionalLight);

    // 赛博朋克风格的彩色光源
    const cyberLight1 = new THREE.PointLight(0x00ffff, 1.5, 30);
    cyberLight1.position.set(-10, 3, 8);
    cyberLight1.castShadow = true;
    this.scene.add(cyberLight1);
    this.lights.set('cyber1', cyberLight1);

    const cyberLight2 = new THREE.PointLight(0x0080ff, 1.2, 25);
    cyberLight2.position.set(10, 3, -8);
    cyberLight2.castShadow = true;
    this.scene.add(cyberLight2);
    this.lights.set('cyber2', cyberLight2);

    // 补充光源
    const fillLight = new THREE.DirectionalLight(0x4080ff, 0.6);
    fillLight.position.set(-10, 10, -10);
    this.scene.add(fillLight);
    this.lights.set('fill', fillLight);
  }

  addObject(object, id) {
    this.objects.set(id, object);
    this.scene.add(object);
  }

  getObject(id) {
    return this.objects.get(id);
  }

  removeObject(id) {
    const object = this.objects.get(id);
    if (object) {
      this.scene.remove(object);
      this.objects.delete(id);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // 动态光照效果
    const time = performance.now() * 0.001;
    const cyberLight1 = this.lights.get('cyber1');
    const cyberLight2 = this.lights.get('cyber2');
    
    if (cyberLight1) {
      cyberLight1.intensity = 1.5 + Math.sin(time * 2) * 0.3;
    }
    if (cyberLight2) {
      cyberLight2.intensity = 1.2 + Math.cos(time * 1.5) * 0.2;
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }
}

/**
 * 高级交互控制器 - GitHub Pages版本
 */
class GitHubInteractionController {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.domElement = renderer.domElement;
    
    // 控制状态
    this.isMouseDown = false;
    this.mouseButton = -1;
    this.mouseX = 0;
    this.mouseY = 0;
    this.cameraDistance = 20;
    this.cameraTheta = 0;
    this.cameraPhi = Math.PI / 3;
    
    // 相机控制参数
    this.minDistance = 5;
    this.maxDistance = 100;
    this.rotationSpeed = 0.005;
    this.zoomSpeed = 0.1;
    this.panSpeed = 0.002;
    
    // 相机目标点
    this.target = new THREE.Vector3(0, 0, 0);
    
    this.setupControls();
    this.updateCameraPosition();
  }

  setupControls() {
    // 鼠标事件
    this.domElement.addEventListener('mousedown', (event) => {
      this.isMouseDown = true;
      this.mouseButton = event.button;
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
      event.preventDefault();
    });

    this.domElement.addEventListener('mousemove', (event) => {
      if (!this.isMouseDown) return;

      const deltaX = event.clientX - this.mouseX;
      const deltaY = event.clientY - this.mouseY;

      if (this.mouseButton === 0) { // 左键 - 旋转
        this.cameraTheta -= deltaX * this.rotationSpeed;
        this.cameraPhi += deltaY * this.rotationSpeed;
        this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi));
        this.updateCameraPosition();
      } else if (this.mouseButton === 2) { // 右键 - 平移
        const panX = -deltaX * this.panSpeed * this.cameraDistance;
        const panY = deltaY * this.panSpeed * this.cameraDistance;
        
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        
        right.setFromMatrixColumn(this.camera.matrix, 0);
        up.setFromMatrixColumn(this.camera.matrix, 1);
        
        this.target.addScaledVector(right, panX);
        this.target.addScaledVector(up, panY);
        
        this.updateCameraPosition();
      }

      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
      event.preventDefault();
    });

    this.domElement.addEventListener('mouseup', (event) => {
      this.isMouseDown = false;
      this.mouseButton = -1;
      event.preventDefault();
    });

    // 滚轮缩放
    this.domElement.addEventListener('wheel', (event) => {
      this.cameraDistance += event.deltaY * this.zoomSpeed;
      this.cameraDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.cameraDistance));
      this.updateCameraPosition();
      event.preventDefault();
    });

    // 键盘事件
    document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'KeyR':
          this.resetCamera();
          break;
        case 'Escape':
          // 取消选择等操作
          break;
      }
    });

    // 禁用右键菜单
    this.domElement.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
  }

  updateCameraPosition() {
    const x = this.target.x + this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.target.y + this.cameraDistance * Math.cos(this.cameraPhi);
    const z = this.target.z + this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }

  resetCamera() {
    this.cameraDistance = 20;
    this.cameraTheta = 0;
    this.cameraPhi = Math.PI / 3;
    this.target.set(0, 0, 0);
    this.updateCameraPosition();
  }

  updateInteractions() {
    // 可以在这里添加持续的交互更新逻辑
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
    this.carAnimationActive = true;
    
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
      
      // 加载完整的3D内容
      await this.loadCompleteContent();
      
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
      }, 3000); // 给更多时间展示加载动画
    });
  }

  hideLoadingScreen() {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      loadingContainer.classList.add('fade-out');
      setTimeout(() => {
        loadingContainer.style.display = 'none';
      }, 1000);
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
    this.sceneManager = new GitHubSceneManager(this.container);
    window.sophicarApp = this; // 全局引用
  }

  setupInteractions() {
    this.interactionController = new GitHubInteractionController(
      this.sceneManager.scene,
      this.sceneManager.camera,
      this.sceneManager.renderer
    );
  }

  async loadCompleteContent() {
    // 添加高质量地面
    this.addAdvancedGround();
    
    // 添加完整的SOPHICAR车辆模型
    this.addAdvancedCarModel();
    
    // 添加环境装饰
    this.addEnvironmentDecorations();
    
    // 设置赛博朋克风格场景
    this.setupAdvancedCyberpunkScene();
  }

  addAdvancedGround() {
    // 主地面
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x001122,
      transparent: true,
      opacity: 0.9
    });
    
    // 添加地面纹理效果
    const vertices = groundGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 2] += Math.random() * 0.1 - 0.05; // 轻微的高度变化
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'advanced_ground';
    
    this.sceneManager.addObject(ground, 'ground');
    
    // 添加网格线效果
    const gridHelper = new THREE.GridHelper(100, 50, 0x00ffff, 0x004466);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    this.sceneManager.addObject(gridHelper, 'grid');
  }

  addAdvancedCarModel() {
    const carGroup = new THREE.Group();
    carGroup.name = 'SophicarAdvancedVehicle';
    
    // 主车身 - 更详细的设计
    const bodyGeometry = new THREE.BoxGeometry(4.5, 1.8, 9);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x0066cc,
      emissive: new THREE.Color(0x001133),
      emissiveIntensity: 0.4,
      shininess: 100,
      specular: 0x4488ff
    });
    const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    carBody.position.set(0, 0.9, 0);
    carBody.castShadow = true;
    carBody.receiveShadow = true;
    carGroup.add(carBody);
    
    // 车顶
    const roofGeometry = new THREE.BoxGeometry(3.5, 1.2, 6);
    const roofMaterial = new THREE.MeshPhongMaterial({
      color: 0x004499,
      emissive: new THREE.Color(0x000022),
      emissiveIntensity: 0.2
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 2.4, -0.5);
    roof.castShadow = true;
    carGroup.add(roof);
    
    // SOPHICAR 发光标识
    const logoGeometry = new THREE.BoxGeometry(3.5, 0.3, 0.1);
    const logoMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      emissive: new THREE.Color(0x00ffff),
      emissiveIntensity: 1.0
    });
    const logo = new THREE.Mesh(logoGeometry, logoMaterial);
    logo.position.set(0, 1.8, 4.6);
    carGroup.add(logo);
    
    // 前大灯
    const headlightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const headlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.8
    });
    
    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(1.5, 1.2, 4.2);
    carGroup.add(leftHeadlight);
    
    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(-1.5, 1.2, 4.2);
    carGroup.add(rightHeadlight);
    
    // 尾灯
    const taillightGeometry = new THREE.SphereGeometry(0.2, 12, 12);
    const taillightMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      emissive: new THREE.Color(0xff0000),
      emissiveIntensity: 0.6
    });
    
    const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
    leftTaillight.position.set(1.3, 1.0, -4.2);
    carGroup.add(leftTaillight);
    
    const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
    rightTaillight.position.set(-1.3, 1.0, -4.2);
    carGroup.add(rightTaillight);
    
    // 高质量轮子
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 24);
    const wheelMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x222222,
      shininess: 50
    });
    
    // 轮毂
    const rimGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.32, 24);
    const rimMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      shininess: 100,
      specular: 0xffffff
    });
    
    const wheelPositions = [
      { x: 1.8, z: 2.8 },   // 前左
      { x: -1.8, z: 2.8 },  // 前右
      { x: 1.8, z: -2.8 },  // 后左
      { x: -1.8, z: -2.8 }  // 后右
    ];
    
    wheelPositions.forEach((pos, index) => {
      const wheelGroup = new THREE.Group();
      
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      wheelGroup.add(wheel);
      
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);
      
      wheelGroup.position.set(pos.x, 0.4, pos.z);
      wheelGroup.name = `wheel_${index}`;
      carGroup.add(wheelGroup);
    });
    
    // 底盘细节
    const chassisGeometry = new THREE.BoxGeometry(3.8, 0.3, 8);
    const chassisMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
    chassis.position.set(0, 0.15, 0);
    chassis.castShadow = true;
    carGroup.add(chassis);
    
    // 设置车辆位置和朝向
    carGroup.position.set(0, 0, 0);
    carGroup.rotation.y = Math.PI; // 车头朝向观察者
    
    // 保存动画数据
    carGroup.userData = {
      baseHeight: 0,
      baseRotation: Math.PI,
      wheelRotation: 0
    };
    
    this.sceneManager.addObject(carGroup, 'sophicar_vehicle');
    
    // 开始高级车辆动画
    this.startAdvancedCarAnimation();
  }

  startAdvancedCarAnimation() {
    const animate = () => {
      const carModel = this.sceneManager.getObject('sophicar_vehicle');
      if (carModel && this.carAnimationActive && !this.tunnelDriveActive) {
        const time = performance.now() * 0.001;
        
        // 轻微的悬浮效果
        carModel.position.y = carModel.userData.baseHeight + Math.sin(time * 0.8) * 0.03;
        
        // 轻微的摇摆
        carModel.rotation.z = Math.sin(time * 0.6) * 0.005;
        
        // 车轮旋转
        carModel.traverse((child) => {
          if (child.name && child.name.startsWith('wheel_')) {
            child.rotation.x += 0.01;
          }
        });
        
        // 发光效果变化
        carModel.traverse((child) => {
          if (child.isMesh && child.material) {
            if (child.material.emissiveIntensity !== undefined) {
              const baseIntensity = child.material.emissiveIntensity;
              if (baseIntensity > 0) {
                child.material.emissiveIntensity = baseIntensity + Math.sin(time * 3) * 0.1;
              }
            }
          }
        });
      }
      
      requestAnimationFrame(animate);
    };
    animate();
  }

  addEnvironmentDecorations() {
    // 添加一些装饰性的建筑物轮廓
    const buildingGeometry = new THREE.BoxGeometry(2, 8, 2);
    const buildingMaterial = new THREE.MeshLambertMaterial({
      color: 0x001133,
      transparent: true,
      opacity: 0.7
    });
    
    const buildingPositions = [
      { x: -15, z: -15 },
      { x: 15, z: -15 },
      { x: -15, z: 15 },
      { x: 15, z: 15 },
      { x: -25, z: 0 },
      { x: 25, z: 0 }
    ];
    
    buildingPositions.forEach((pos, index) => {
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.set(pos.x, 4, pos.z);
      building.castShadow = true;
      building.receiveShadow = true;
      this.sceneManager.addObject(building, `building_${index}`);
    });
  }

  setupAdvancedCyberpunkScene() {
    // 添加粒子效果（简化版）
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;     // x
      positions[i + 1] = Math.random() * 20;          // y
      positions[i + 2] = (Math.random() - 0.5) * 100; // z
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.1,
      transparent: true,
      opacity: 0.6
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    this.sceneManager.addObject(particles, 'particles');
    
    // 粒子动画
    const animateParticles = () => {
      const positions = particles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.01; // 向上移动
        if (positions[i] > 20) {
          positions[i] = 0; // 重置到底部
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
      requestAnimationFrame(animateParticles);
    };
    animateParticles();
  }

  createUIControls() {
    // 创建隧道驾驶按钮
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      gap: 15px;
    `;
    
    // 隧道驾驶按钮
    const tunnelDriveButton = document.createElement('button');
    tunnelDriveButton.innerHTML = `
      <span style="font-size: 18px;">🚀</span>
      <span>隧道驾驶</span>
    `;
    tunnelDriveButton.style.cssText = `
      background: linear-gradient(135deg, #0066cc 0%, #0080ff 100%);
      border: 2px solid #00ffff;
      border-radius: 15px;
      color: white;
      padding: 15px 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 6px 20px rgba(0, 255, 255, 0.4);
      transition: all 0.3s ease;
      font-family: 'Microsoft YaHei', sans-serif;
      min-width: 140px;
      justify-content: center;
    `;
    
    tunnelDriveButton.addEventListener('mouseenter', () => {
      tunnelDriveButton.style.transform = 'translateY(-2px)';
      tunnelDriveButton.style.boxShadow = '0 8px 25px rgba(0, 255, 255, 0.6)';
    });
    
    tunnelDriveButton.addEventListener('mouseleave', () => {
      tunnelDriveButton.style.transform = 'translateY(0)';
      tunnelDriveButton.style.boxShadow = '0 6px 20px rgba(0, 255, 255, 0.4)';
    });
    
    tunnelDriveButton.addEventListener('click', () => {
      this.startTunnelDrive();
    });
    
    // 重置视角按钮
    const resetButton = document.createElement('button');
    resetButton.innerHTML = `
      <span style="font-size: 16px;">🔄</span>
      <span>重置视角</span>
    `;
    resetButton.style.cssText = `
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      border: 2px solid #66ff66;
      border-radius: 15px;
      color: white;
      padding: 15px 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 6px 20px rgba(102, 255, 102, 0.4);
      transition: all 0.3s ease;
      font-family: 'Microsoft YaHei', sans-serif;
      min-width: 140px;
      justify-content: center;
    `;
    
    resetButton.addEventListener('mouseenter', () => {
      resetButton.style.transform = 'translateY(-2px)';
      resetButton.style.boxShadow = '0 8px 25px rgba(102, 255, 102, 0.6)';
    });
    
    resetButton.addEventListener('mouseleave', () => {
      resetButton.style.transform = 'translateY(0)';
      resetButton.style.boxShadow = '0 6px 20px rgba(102, 255, 102, 0.4)';
    });
    
    resetButton.addEventListener('click', () => {
      if (this.interactionController) {
        this.interactionController.resetCamera();
      }
    });
    
    buttonContainer.appendChild(tunnelDriveButton);
    buttonContainer.appendChild(resetButton);
    document.body.appendChild(buttonContainer);
    
    // 添加状态指示器
    this.createStatusIndicator();
  }

  createStatusIndicator() {
    const statusContainer = document.createElement('div');
    statusContainer.style.cssText = `
      position: fixed;
      top: 80px;
      left: 20px;
      background: rgba(0, 20, 40, 0.95);
      padding: 15px;
      border-radius: 10px;
      border: 1px solid #00ffff;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
      z-index: 100;
      font-size: 14px;
      backdrop-filter: blur(10px);
      color: #40e0d0;
      font-family: 'Microsoft YaHei', sans-serif;
      min-width: 200px;
    `;
    
    statusContainer.innerHTML = `
      <div style="color: #00ffff; font-weight: bold; margin-bottom: 10px;">
        🚗 SOPHICAR 状态
      </div>
      <div id="carStatus">✅ 车辆就绪</div>
      <div id="systemStatus">✅ 系统正常</div>
      <div id="driveStatus">⏸️ 待机模式</div>
    `;
    
    document.body.appendChild(statusContainer);
    this.statusContainer = statusContainer;
  }

  updateStatus(type, message, icon = '✅') {
    const statusElement = document.getElementById(type + 'Status');
    if (statusElement) {
      statusElement.innerHTML = `${icon} ${message}`;
    }
  }

  startTunnelDrive() {
    if (this.tunnelDriveActive) return;
    
    console.log('🚀 启动隧道驾驶效果...');
    this.tunnelDriveActive = true;
    this.carAnimationActive = false;
    
    this.updateStatus('drive', '隧道驾驶中...', '🚀');
    
    const carModel = this.sceneManager.getObject('sophicar_vehicle');
    if (!carModel) return;
    
    // 创建隧道效果
    this.createAdvancedTunnelEffect();
    
    // 高级车辆驾驶动画
    const startPosition = carModel.position.clone();
    const startRotation = carModel.rotation.clone();
    const duration = 10000; // 10秒的驾驶体验
    const startTime = performance.now();
    
    const animateTunnel = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = this.easeInOutCubic(progress);
      
      if (progress < 1) {
        // 车辆向前加速移动
        const speed = easeProgress * 80;
        carModel.position.z = startPosition.z - speed;
        
        // 车辆轻微摇摆模拟驾驶感
        carModel.position.x = Math.sin(elapsed * 0.003) * 0.2;
        carModel.position.y = startPosition.y + Math.sin(elapsed * 0.005) * 0.1;
        carModel.rotation.z = Math.sin(elapsed * 0.003) * 0.02;
        
        // 相机跟随并提供驾驶视角
        const cameraOffset = new THREE.Vector3(0, 3, 8);
        const cameraPosition = carModel.position.clone().add(cameraOffset);
        this.sceneManager.camera.position.copy(cameraPosition);
        this.sceneManager.camera.lookAt(carModel.position);
        
        // 更新隧道环位置
        this.updateTunnelRings(elapsed);
        
        requestAnimationFrame(animateTunnel);
      } else {
        // 驾驶完成，重置状态
        this.completeTunnelDrive(carModel, startPosition, startRotation);
      }
    };
    
    animateTunnel();
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  createAdvancedTunnelEffect() {
    // 创建更多的隧道环，形成完整的隧道
    for (let i = 0; i < 30; i++) {
      const ringGeometry = new THREE.RingGeometry(4, 5.5, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.4 - (i * 0.01), // 远处的环更透明
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.z = -i * 6;
      ring.name = `tunnel_ring_${i}`;
      
      // 添加发光效果
      const glowGeometry = new THREE.RingGeometry(5.5, 6, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x0080ff,
        transparent: true,
        opacity: 0.2 - (i * 0.005),
        side: THREE.DoubleSide
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(ring.position);
      glow.name = `tunnel_glow_${i}`;
      
      this.sceneManager.addObject(ring, `tunnel_ring_${i}`);
      this.sceneManager.addObject(glow, `tunnel_glow_${i}`);
    }
    
    // 添加隧道内的光线效果
    for (let i = 0; i < 10; i++) {
      const lightBeam = new THREE.ConeGeometry(0.1, 8, 8);
      const lightMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3
      });
      const beam = new THREE.Mesh(lightBeam, lightMaterial);
      beam.position.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 2 + 1,
        -i * 15
      );
      beam.rotation.x = Math.PI / 2;
      beam.name = `light_beam_${i}`;
      
      this.sceneManager.addObject(beam, `light_beam_${i}`);
    }
  }

  updateTunnelRings(elapsed) {
    // 让隧道环旋转，增加动感
    for (let i = 0; i < 30; i++) {
      const ring = this.sceneManager.getObject(`tunnel_ring_${i}`);
      const glow = this.sceneManager.getObject(`tunnel_glow_${i}`);
      
      if (ring) {
        ring.rotation.z = elapsed * 0.001 * (i % 2 === 0 ? 1 : -1);
      }
      if (glow) {
        glow.rotation.z = elapsed * 0.0008 * (i % 2 === 0 ? -1 : 1);
      }
    }
  }

  completeTunnelDrive(carModel, startPosition, startRotation) {
    console.log('✅ 隧道驾驶完成');
    
    // 重置车辆位置
    carModel.position.copy(startPosition);
    carModel.rotation.copy(startRotation);
    
    // 重置相机
    if (this.interactionController) {
      this.interactionController.resetCamera();
    }
    
    // 清理隧道效果
    this.clearAdvancedTunnelEffect();
    
    // 重置状态
    this.tunnelDriveActive = false;
    this.carAnimationActive = true;
    
    this.updateStatus('drive', '待机模式', '⏸️');
    
    // 显示完成消息
    this.showCompletionMessage();
  }

  clearAdvancedTunnelEffect() {
    // 清理隧道环和光效
    for (let i = 0; i < 30; i++) {
      const ring = this.sceneManager.getObject(`tunnel_ring_${i}`);
      const glow = this.sceneManager.getObject(`tunnel_glow_${i}`);
      
      if (ring) {
        this.sceneManager.scene.remove(ring);
      }
      if (glow) {
        this.sceneManager.scene.remove(glow);
      }
    }
    
    // 清理光束
    for (let i = 0; i < 10; i++) {
      const beam = this.sceneManager.getObject(`light_beam_${i}`);
      if (beam) {
        this.sceneManager.scene.remove(beam);
      }
    }
  }

  showCompletionMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #0066cc 0%, #0080ff 100%);
      color: white;
      padding: 30px;
      border-radius: 15px;
      text-align: center;
      z-index: 9999;
      font-family: 'Microsoft YaHei', sans-serif;
      box-shadow: 0 10px 30px rgba(0, 255, 255, 0.5);
      border: 2px solid #00ffff;
    `;
    
    messageDiv.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 15px;">🎉</div>
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
        隧道驾驶完成！
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        感谢体验 SOPHICAR 3D 数字交互平台
      </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 3000);
  }

  showErrorMessage(message) {
    console.error('显示错误:', message);
    
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 30px;
      border-radius: 10px;
      text-align: center;
      z-index: 9999;
      max-width: 500px;
      font-family: 'Microsoft YaHei', Arial, sans-serif;
    `;
    
    errorDiv.innerHTML = `
      <h3>⚠️ 错误</h3>
      <p>${message}</p>
      <button onclick="location.reload()" style="
        background: #fff;
        color: #000;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin: 5px;
        font-size: 14px;
      ">刷新页面</button>
    `;
    
    document.body.appendChild(errorDiv);
  }
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