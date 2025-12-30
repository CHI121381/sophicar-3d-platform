/**
 * 场景管理器 - 负责3D场景的创建、更新和渲染
 * SceneManager - Responsible for 3D scene creation, updates, and rendering
 */
import * as THREE from 'three';

export class SceneManager {
  /**
   * 构造函数 - 初始化场景管理器
   * Constructor - Initialize scene manager
   * @param {HTMLElement} container - 渲染容器元素
   */
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.objects = new Map(); // 场景对象映射表
    this.animationId = null;
    this.lights = null;
    this.environment = null;
    
    // 性能监控
    this.performanceMonitor = {
      frameCount: 0,
      lastTime: performance.now(),
      fps: 60,
      targetFPS: 60
    };
    
    // 设备能力检测
    this.deviceCapabilities = this.detectDeviceCapabilities();
    
    this.initializeScene();
  }

  /**
   * 初始化3D场景 - 设置基础场景、相机和渲染器
   * Initialize 3D scene - Set up basic scene, camera and renderer
   */
  initializeScene() {
    // 检测测试环境
    const isTestEnvironment = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75, 
      this.container.clientWidth / this.container.clientHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    
    // 应用基于设备能力的性能优化
    if (!isTestEnvironment) {
      this.applyPerformanceOptimizations();
    }
    
    // 添加渲染器到容器
    this.container.appendChild(this.renderer.domElement);

    // 添加基础光照
    this.setupLighting();

    // 设置基础环境
    this.setupEnvironment();

    // 开始渲染循环（测试环境中不启动）
    if (!isTestEnvironment) {
      this.startRenderLoop();
    }

    // 处理窗口大小变化
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * 设置基础光照系统
   * Set up basic lighting system
   */
  setupLighting() {
    // 环境光 - 提供基础照明
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    ambientLight.userData.selectable = false; // 确保环境光不可选择
    this.scene.add(ambientLight);

    // 主方向光 - 模拟太阳光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.userData.selectable = false; // 确保光源不可选择
    
    // 在测试环境中禁用阴影
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    if (!isTestEnv) {
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 500;
      directionalLight.shadow.camera.left = -50;
      directionalLight.shadow.camera.right = 50;
      directionalLight.shadow.camera.top = 50;
      directionalLight.shadow.camera.bottom = -50;
    }
    
    this.scene.add(directionalLight);

    // 补充光 - 减少阴影过暗
    const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
    fillLight.position.set(-5, 5, -5);
    fillLight.userData.selectable = false; // 确保光源不可选择
    this.scene.add(fillLight);

    // 存储光照引用以便后续控制
    this.lights = {
      ambient: ambientLight,
      main: directionalLight,
      fill: fillLight
    };
  }

  /**
   * 设置基础3D环境和空间布局
   * Set up basic 3D environment and spatial layout
   */
  setupEnvironment() {
    // 初始化环境对象引用
    this.environment = {
      grid: null,
      navigationAreas: []
    };

    // 创建地面网格作为参考平面
    const gridHelper = new THREE.GridHelper(50, 50, 0x888888, 0xcccccc);
    gridHelper.name = 'gridHelper';
    gridHelper.userData.selectable = false; // 确保网格不可选择
    this.scene.add(gridHelper);
    this.environment.grid = gridHelper;

    // 创建坐标轴辅助器（仅在开发模式下显示）
    const isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
    if (isDevelopment) {
      const axesHelper = new THREE.AxesHelper(5);
      axesHelper.name = 'axesHelper';
      axesHelper.userData.selectable = false; // 确保坐标轴不可选择
      this.scene.add(axesHelper);
    }

    // 创建基础导航区域标记
    this.createNavigationAreas();

    // 设置雾效果以增强深度感
    this.scene.fog = new THREE.Fog(0xf0f0f0, 50, 200);
  }

  /**
   * 创建导航区域标记
   * Create navigation area markers
   */
  createNavigationAreas() {
    // 不再创建导航区域标记，保持场景简洁
    // 用户要求删除地面四个角的圆圈
    console.log('SceneManager: 跳过导航区域标记创建，保持场景简洁');
  }

  /**
   * 更新环境光照条件
   * Update environmental lighting conditions
   * @param {Object} conditions - 光照条件参数
   */
  updateEnvironmentalConditions(conditions = {}) {
    const {
      ambientIntensity = 0.4,
      mainLightIntensity = 0.8,
      fillLightIntensity = 0.3,
      fogNear = 50,
      fogFar = 200,
      fogColor = 0xf0f0f0
    } = conditions;

    // 更新光照强度
    if (this.lights) {
      this.lights.ambient.intensity = ambientIntensity;
      this.lights.main.intensity = mainLightIntensity;
      this.lights.fill.intensity = fillLightIntensity;
    }

    // 更新雾效果
    if (this.scene.fog) {
      this.scene.fog.near = fogNear;
      this.scene.fog.far = fogFar;
      this.scene.fog.color.setHex(fogColor);
    }
  }

  /**
   * 检测设备能力
   * Detect device capabilities
   * @returns {Object} 设备能力信息
   */
  detectDeviceCapabilities() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      return {
        webgl: false,
        maxTextureSize: 512,
        maxVertexAttribs: 8,
        performance: 'low'
      };
    }

    const capabilities = {
      webgl: true,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      extensions: gl.getSupportedExtensions() || []
    };

    // 基于设备能力评估性能等级
    if (capabilities.maxTextureSize >= 4096 && capabilities.maxVertexAttribs >= 16) {
      capabilities.performance = 'high';
    } else if (capabilities.maxTextureSize >= 2048 && capabilities.maxVertexAttribs >= 12) {
      capabilities.performance = 'medium';
    } else {
      capabilities.performance = 'low';
    }

    return capabilities;
  }

  /**
   * 应用性能优化设置
   * Apply performance optimization settings
   */
  applyPerformanceOptimizations() {
    if (!this.renderer) return;

    const performance = this.deviceCapabilities.performance;
    
    switch (performance) {
      case 'high':
        // 高性能设备 - 启用所有特效
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.antialias = true;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        break;
        
      case 'medium':
        // 中等性能设备 - 适中的设置
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.antialias = true;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        break;
        
      case 'low':
        // 低性能设备 - 最小化设置
        this.renderer.shadowMap.enabled = false;
        this.renderer.antialias = false;
        this.renderer.setPixelRatio(1);
        // 降低雾效果范围
        if (this.scene.fog) {
          this.scene.fog.near = 30;
          this.scene.fog.far = 100;
        }
        break;
    }
  }

  /**
   * 监控和调整性能
   * Monitor and adjust performance
   */
  monitorPerformance() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.performanceMonitor.lastTime;
    
    this.performanceMonitor.frameCount++;
    
    // 每秒更新一次FPS
    if (deltaTime >= 1000) {
      this.performanceMonitor.fps = (this.performanceMonitor.frameCount * 1000) / deltaTime;
      this.performanceMonitor.frameCount = 0;
      this.performanceMonitor.lastTime = currentTime;
      
      // 如果FPS过低，自动调整质量
      if (this.performanceMonitor.fps < this.performanceMonitor.targetFPS * 0.8) {
        this.adjustQualityForPerformance();
      }
    }
  }

  /**
   * 根据性能调整渲染质量
   * Adjust rendering quality based on performance
   */
  adjustQualityForPerformance() {
    if (!this.renderer) return;
    
    const currentPixelRatio = this.renderer.getPixelRatio();
    
    // 如果FPS过低，降低像素比率
    if (this.performanceMonitor.fps < 30 && currentPixelRatio > 1) {
      this.renderer.setPixelRatio(Math.max(currentPixelRatio * 0.8, 0.5));
      console.log('性能优化：降低渲染分辨率以提高帧率');
    }
    
    // 如果FPS过低且启用了阴影，考虑禁用阴影
    if (this.performanceMonitor.fps < 20 && this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.enabled = false;
      console.log('性能优化：禁用阴影以提高帧率');
    }
  }

  /**
   * 添加3D对象到场景
   * Add 3D object to scene
   * @param {THREE.Object3D} object - 要添加的3D对象
   * @param {string} id - 对象唯一标识符
   */
  addObject(object, id = null) {
    if (!object || !(object instanceof THREE.Object3D)) {
      console.warn('SceneManager: 无效的3D对象');
      return false;
    }

    const objectId = id || `object_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.scene.add(object);
    this.objects.set(objectId, object);
    
    return objectId;
  }

  /**
   * 从场景移除3D对象
   * Remove 3D object from scene
   * @param {string|THREE.Object3D} objectOrId - 对象ID或对象实例
   */
  removeObject(objectOrId) {
    let object;
    let objectId;

    if (typeof objectOrId === 'string') {
      objectId = objectOrId;
      object = this.objects.get(objectId);
    } else if (objectOrId instanceof THREE.Object3D) {
      object = objectOrId;
      // 查找对象ID
      for (const [id, obj] of this.objects.entries()) {
        if (obj === object) {
          objectId = id;
          break;
        }
      }
    }

    if (object) {
      this.scene.remove(object);
      if (objectId) {
        this.objects.delete(objectId);
      }
      return true;
    }

    return false;
  }

  /**
   * 更新场景状态
   * Update scene state
   */
  updateScene() {
    // 更新所有场景对象
    this.objects.forEach((object) => {
      if (object.update && typeof object.update === 'function') {
        object.update();
      }
    });
  }

  /**
   * 渲染场景
   * Render scene
   */
  render() {
    // 性能监控
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    if (!isTestEnv) {
      this.monitorPerformance();
    }
    
    this.updateScene();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 开始渲染循环
   * Start render loop
   */
  startRenderLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.render();
    };
    animate();
  }

  /**
   * 停止渲染循环
   * Stop render loop
   */
  stopRenderLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 处理窗口大小变化
   * Handle window resize
   */
  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * 获取场景对象
   * Get scene object
   * @param {string} id - 对象ID
   * @returns {THREE.Object3D|null}
   */
  getObject(id) {
    return this.objects.get(id) || null;
  }

  /**
   * 获取所有场景对象
   * Get all scene objects
   * @returns {Map<string, THREE.Object3D>}
   */
  getAllObjects() {
    return new Map(this.objects);
  }

  /**
   * 清空场景
   * Clear scene
   */
  clearScene() {
    // 移除所有自定义对象
    this.objects.forEach((object) => {
      this.scene.remove(object);
    });
    this.objects.clear();
  }

  /**
   * 销毁场景管理器
   * Destroy scene manager
   */
  destroy() {
    this.stopRenderLoop();
    this.clearScene();
    
    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }
    }

    window.removeEventListener('resize', this.handleResize);
  }
}