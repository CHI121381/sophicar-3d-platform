/**
 * Sophicar 3D数字交互平台 - 主入口文件
 * Sophicar 3D Digital Interactive Platform - Main entry file
 */
import * as THREE from 'three';
import { SceneManager } from './src/core/SceneManager.js';
import { InteractionController } from './src/core/InteractionController.js';
import { ParametricModelingEngine } from './src/engines/ParametricModelingEngine.js';
import { LoadingAnimation } from './src/components/LoadingAnimation.js';
import { ModelImportInterface } from './src/components/ModelImportInterface.js';
import { TunnelDriveEffect } from './src/components/TunnelDriveEffect.js';

/**
 * 应用程序主类
 * Main application class
 */
class SophicarApp {
  /**
   * 构造函数 - 初始化应用程序
   * Constructor - Initialize application
   */
  constructor() {
    this.container = null;
    this.sceneManager = null;
    this.interactionController = null;
    this.modelingEngine = null;
    this.modelImportInterface = null;
    this.tunnelDriveEffect = null; // 隧道驾驶效果
    
    // 立即创建容器以支持同步测试
    this.createContainer();
    
    // 异步初始化其他组件
    this.init();
  }

  /**
   * 初始化应用程序
   * Initialize application
   */
  async init() {
    try {
      console.log('🚀 开始初始化Sophicar 3D平台...');
      
      // 首先启动加载动画
      console.log('📱 启动加载动画...');
      await this.startLoadingAnimation();
      console.log('✅ 加载动画完成');
      
      // 初始化核心组件
      console.log('🔧 初始化核心组件...');
      this.initializeCore();
      console.log('✅ 核心组件初始化完成');
      
      // 设置交互控制
      console.log('🎮 设置交互控制...');
      this.setupInteractions();
      console.log('✅ 交互控制设置完成');
      
      // 加载示例内容
      console.log('📦 加载示例内容...');
      await this.loadExampleContent();
      console.log('✅ 示例内容加载完成');
      
      // 设置隧道驾驶效果
      console.log('🚇 设置隧道驾驶效果...');
      this.setupTunnelDriveEffect();
      console.log('✅ 隧道驾驶效果设置完成');
      
      // 创建UI控制按钮
      console.log('🎛️ 创建UI控制按钮...');
      this.createUIControls();
      console.log('✅ UI控制按钮创建完成');
      
      console.log('🎉 Sophicar 3D平台初始化完成！');
      
    } catch (error) {
      console.error('❌ 应用初始化失败:', error);
      
      // 显示错误信息给用户
      this.showErrorMessage('应用初始化失败，请刷新页面重试。错误信息：' + error.message);
    }
  }

  /**
   * 启动加载动画
   * Start loading animation
   */
  async startLoadingAnimation() {
    const loading3D = document.getElementById('loading3D');
    if (loading3D) {
      this.loadingAnimation = new LoadingAnimation(loading3D);
      window.loadingAnimation = this.loadingAnimation; // 全局引用用于窗口大小变化处理
      
      // 设置全局回调作为备用方案
      window.onLoadingComplete = () => {
        console.log('🚀 通过全局回调接收到加载完成信号');
        this.loadingAnimation.destroy();
        this.loadingAnimation = null;
        window.loadingAnimation = null;
        window.onLoadingComplete = null;
      };
      
      // 等待加载动画完成
      return new Promise((resolve) => {
        // 主要事件监听
        loading3D.addEventListener('loadingAnimationComplete', () => {
          console.log('📡 接收到loadingAnimationComplete事件');
          // 延迟一点时间让用户欣赏完整的动画
          setTimeout(() => {
            if (this.loadingAnimation) {
              this.loadingAnimation.destroy();
              this.loadingAnimation = null;
              window.loadingAnimation = null;
            }
            resolve();
          }, 500);
        });
        
        // 备用超时机制 - 如果8秒后仍未完成，强制继续
        setTimeout(() => {
          console.log('⚠️ 加载动画超时，强制继续');
          if (this.loadingAnimation) {
            this.loadingAnimation.destroy();
            this.loadingAnimation = null;
            window.loadingAnimation = null;
          }
          resolve();
        }, 8000);
      });
    }
  }

  /**
   * 创建主容器
   * Create main container
   */
  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'sophicar-container';
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

  /**
   * 初始化核心组件
   * Initialize core components
   */
  initializeCore() {
    // 初始化场景管理器
    this.sceneManager = new SceneManager(this.container);
    
    // 初始化参数化建模引擎
    this.modelingEngine = new ParametricModelingEngine(this.sceneManager);
    
    console.log('核心组件初始化完成 (Core components initialized)');
  }

  /**
   * 设置交互控制
   * Setup interaction controls
   */
  setupInteractions() {
    // 初始化交互控制器
    this.interactionController = new InteractionController(
      this.sceneManager.scene,
      this.sceneManager.camera,
      this.sceneManager.renderer
    );
    
    // 启用对象选择
    this.interactionController.enableObjectSelection();
    
    // 初始化模型导入界面
    this.setupModelImportInterface();
    
    // 监听交互事件 - 绑定到渲染器的DOM元素
    this.sceneManager.renderer.domElement.addEventListener('objectSelected', (event) => {
      console.log('对象被选中 (Object selected):', event.detail.object);
    });
    
    this.sceneManager.renderer.domElement.addEventListener('objectHovered', (event) => {
      console.log('对象被悬停 (Object hovered):', event.detail.object);
    });
    
    console.log('交互控制设置完成 (Interaction controls setup completed)');
    console.log('交互控制器状态:', {
      enabled: this.interactionController.objectSelectionEnabled,
      domElement: this.interactionController.domElement,
      scene: this.sceneManager.scene.children.length + ' objects in scene'
    });
  }

  /**
   * 设置模型导入界面
   * Setup model import interface
   */
  setupModelImportInterface() {
    // 创建模型导入界面
    this.modelImportInterface = new ModelImportInterface(document.body, {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedFormats: ['gltf', 'glb', 'obj', 'fbx'],
      showPreview: true,
      autoImport: false,
      onModelLoaded: (model, file) => {
        console.log('模型导入成功 (Model imported successfully):', file.name);
        
        // 将模型添加到场景中
        this.sceneManager.addObject(model, `imported_${file.name}_${Date.now()}`);
        
        // 调整相机视角以查看新导入的模型
        this.adjustCameraToModel(model);
      },
      onImportProgress: (progress) => {
        console.log('导入进度 (Import progress):', progress);
      },
      onError: (error) => {
        console.error('模型导入错误 (Model import error):', error);
      }
    });
    
    // 添加键盘快捷键 - 按 'I' 键打开导入界面
    document.addEventListener('keydown', (event) => {
      if (event.key.toLowerCase() === 'i' && !event.ctrlKey && !event.altKey) {
        this.showModelImportInterface();
      }
    });
    
    console.log('模型导入界面设置完成 (Model import interface setup completed)');
  }

  /**
   * 显示模型导入界面
   * Show model import interface
   */
  showModelImportInterface() {
    if (this.modelImportInterface) {
      this.modelImportInterface.show();
    }
  }

  /**
   * 调整相机以查看模型
   * Adjust camera to view model
   * @param {THREE.Object3D} model - 3D模型对象
   */
  adjustCameraToModel(model) {
    const THREE = window.THREE;
    
    // 计算模型边界框
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // 计算合适的相机距离
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;
    
    // 平滑移动相机
    const camera = this.sceneManager.camera;
    const startPosition = camera.position.clone();
    const targetPosition = new THREE.Vector3(
      center.x + distance,
      center.y + distance * 0.5,
      center.z + distance
    );
    
    // 使用简单的动画移动相机
    let progress = 0;
    const animateCamera = () => {
      progress += 0.02;
      if (progress >= 1) {
        camera.position.copy(targetPosition);
        camera.lookAt(center);
        return;
      }
      
      camera.position.lerpVectors(startPosition, targetPosition, progress);
      camera.lookAt(center);
      
      requestAnimationFrame(animateCamera);
    };
    
    animateCamera();
  }

  /**
   * 加载示例内容
   * Load example content
   */
  async loadExampleContent() {
    try {
      // 模拟加载时间，让加载动画有足够时间展示
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 初始化参数化建模引擎（不创建可视化几何体）
      await this.modelingEngine.loadVehicleModel('example-vehicle');
      
      // 添加一些示例几何体
      this.addExampleObjects();
      
      // 设置赛博朋克风格的场景
      this.setupCyberpunkScene();
      
      // 开始场景动画
      this.startSceneAnimations();
      
      // 检查天空中的可选对象
      setTimeout(() => {
        this.checkSkyObjects();
      }, 2000);
      
      console.log('示例内容加载完成 (Example content loaded)');
      
    } catch (error) {
      console.error('示例内容加载失败 (Failed to load example content):', error);
    }
  }

  /**
   * 设置赛博朋克风格场景
   * Setup cyberpunk style scene
   */
  setupCyberpunkScene() {
    // 更新场景背景为深色
    this.sceneManager.scene.background = new THREE.Color(0x0a0a0a);
    
    // 更新环境光照为赛博朋克风格
    this.sceneManager.updateEnvironmentalConditions({
      ambientIntensity: 0.2,
      mainLightIntensity: 1.2,
      fillLightIntensity: 0.4,
      fogNear: 30,
      fogFar: 150,
      fogColor: 0x001122
    });
    
    // 添加额外的赛博朋克光源 - 降低高度并设置为不可选择
    const cyberLight1 = new THREE.PointLight(0x00ffff, 1, 20);
    cyberLight1.position.set(-5, 1, 5); // 降低到地面附近
    cyberLight1.userData.selectable = false; // 设置为不可选择
    this.sceneManager.scene.add(cyberLight1);
    
    const cyberLight2 = new THREE.PointLight(0x0080ff, 0.8, 15);
    cyberLight2.position.set(5, 1, -5); // 降低到地面附近
    cyberLight2.userData.selectable = false; // 设置为不可选择
    this.sceneManager.scene.add(cyberLight2);
    
    // 添加发光粒子效果
    this.addGlowParticles();
  }

  /**
   * 添加发光粒子效果
   * Add glow particle effects
   */
  addGlowParticles() {
    // 用户要求删除天空中的物体，因此不再创建粒子效果
    console.log('跳过粒子效果创建，保持天空清洁');
    
    // 如果需要地面附近的装饰效果，可以在这里添加贴近地面的效果
    // 但目前按用户要求保持简洁
  }

  /**
   * 添加示例对象
   * Add example objects
   */
  addExampleObjects() {
    // 添加赛博朋克风格地面
    const groundGeometry = new THREE.PlaneGeometry(30, 30, 32, 32);
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x001122,
      transparent: true,
      opacity: 0.8,
      wireframe: false
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    
    // 设置地面不可选中
    ground.userData.selectable = false;
    ground.name = 'ground_plane';
    
    this.sceneManager.addObject(ground, 'ground');
    
    // 添加程序化生成的小车模型
    this.addCarModel();
  }

  /**
   * 添加小车模型
   * Add car model
   */
  async addCarModel() {
    try {
      // 使用ModelFileLoader加载你的真实小车模型
      const modelLoader = new (await import('./src/loaders/ModelFileLoader.js')).ModelFileLoader();
      
      console.log('正在加载Sophicar真实车辆模型...');
      
      // 加载FBX模型文件
      const carModel = await modelLoader.loadModel('/models/sophicar-vehicle.fbx', {
        scale: 0.01, // FBX模型通常比较大，需要缩小
        center: true, // 居中模型
        castShadow: true,
        receiveShadow: true,
        optimizeMaterials: true
      });
      
      // 设置模型名称
      carModel.name = 'SophicarRealVehicle';
      
      // 计算模型边界框以确定正确的地面位置
      const box = new THREE.Box3().setFromObject(carModel);
      const modelHeight = box.max.y - box.min.y;
      const modelBottom = box.min.y;
      const modelTop = box.max.y;
      
      // 更精确的地面对齐 - 让轮胎底部真正接触地面
      // 如果模型底部在负值位置，需要上移；如果在正值位置，需要下移
      const groundOffset = -modelBottom;
      
      // 进一步微调 - 确保轮胎真正接触地面而不是悬浮
      const fineAdjustment = -0.1; // 下移0.1米确保接触
      const finalY = groundOffset + fineAdjustment;
      
      // 设置模型位置 - 轮胎底部正好接触地面
      carModel.position.set(0, finalY, 0);
      carModel.rotation.y = Math.PI; // 让车头朝向用户
      
      // 保存基础高度用于动画
      carModel.userData.baseHeight = finalY;
      
      console.log(`小车模型详情:`);
      console.log(`- 模型高度: ${modelHeight.toFixed(3)}m`);
      console.log(`- 模型底部: ${modelBottom.toFixed(3)}m`);
      console.log(`- 模型顶部: ${modelTop.toFixed(3)}m`);
      console.log(`- 地面偏移: ${groundOffset.toFixed(3)}m`);
      console.log(`- 微调偏移: ${fineAdjustment.toFixed(3)}m`);
      console.log(`- 最终高度: ${finalY.toFixed(3)}m`);
      
      // 确保模型有阴影，并设置为不可选择以避免材质问题
      carModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // 设置小车的所有部件为不可选择，避免点击时材质被修改导致零件消失
          child.userData.selectable = false;
          
          // 增强材质的视觉效果
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat.emissive) {
                  mat.emissive.setHex(0x001122);
                  mat.emissiveIntensity = 0.1;
                }
              });
            } else {
              if (child.material.emissive) {
                child.material.emissive.setHex(0x001122);
                child.material.emissiveIntensity = 0.1;
              }
            }
          }
        }
      });
      
      // 添加到场景中心位置
      this.sceneManager.addObject(carModel, 'sophicar_real_vehicle');
      
      // 调整相机以最佳角度查看小车
      setTimeout(() => {
        this.adjustCameraToModel(carModel);
      }, 1000);
      
      console.log('✅ Sophicar真实车辆模型加载成功！');
      
      // 清理模型加载器
      modelLoader.destroy();
      
    } catch (error) {
      console.error('❌ 加载Sophicar车辆模型失败:', error);
      
      // 如果加载失败，显示一个简单的占位符
      this.addFallbackCarModel();
    }
  }

  /**
   * 添加备用小车模型（如果真实模型加载失败）
   * Add fallback car model if real model fails to load
   */
  addFallbackCarModel() {
    console.log('使用备用车辆模型...');
    
    const carGroup = new THREE.Group();
    carGroup.name = 'SophicarFallback';
    
    // 简化的车身 - 调整位置让底部接触地面
    const bodyGeometry = new THREE.BoxGeometry(4, 1.5, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: 0x0066cc,
      emissive: new THREE.Color(0x001133),
      emissiveIntensity: 0.3
    });
    const carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    carBody.position.set(0, 0.75, 0); // 车身高度的一半，相对于车组原点
    carBody.castShadow = true;
    carBody.receiveShadow = true;
    carGroup.add(carBody);
    
    // 添加"SOPHICAR"标识
    const textGeometry = new THREE.BoxGeometry(3, 0.2, 0.1);
    const textMaterial = new THREE.MeshLambertMaterial({
      color: 0x00ffff,
      emissive: new THREE.Color(0x00ffff),
      emissiveIntensity: 0.8
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 1.7, 4.1); // 相对于车组原点的标识位置
    carGroup.add(textMesh);
    
    // 添加简单的轮子
    const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const wheelRadius = 0.3; // 轮子半径
    
    const wheelPositions = [
      { x: 1.5, z: 2.5 },   // 前左
      { x: -1.5, z: 2.5 },  // 前右
      { x: 1.5, z: -2.5 },  // 后左
      { x: -1.5, z: -2.5 }  // 后右
    ];
    
    wheelPositions.forEach((pos, index) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos.x, wheelRadius, pos.z); // 轮子底部接触地面
      wheel.rotation.z = Math.PI / 2; // 旋转轮子方向
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      carGroup.add(wheel);
    });
    
    // 设置整个车组的位置 - 轮胎底部接触地面
    carGroup.position.set(0, 0, 0);
    carGroup.rotation.y = Math.PI;
    
    // 保存基础高度用于动画
    carGroup.userData.baseHeight = 0;
    
    this.sceneManager.addObject(carGroup, 'sophicar_fallback_vehicle');
    
    setTimeout(() => {
      this.adjustCameraToModel(carGroup);
    }, 1000);
  }

  /**
   * 检查并删除天空中的可选对象
   * Check and remove selectable objects in the sky
   */
  checkSkyObjects() {
    console.log('🌌 检查天空中的可选对象...');
    
    const skyObjects = [];
    const objectsToRemove = [];
    
    // 遍历场景中的所有对象
    this.sceneManager.scene.traverse((object) => {
      // 检查对象是否在地面以上（y > 2）
      if (object.position.y > 2 && object.isMesh) {
        const objectInfo = {
          name: object.name || 'unnamed',
          type: object.type,
          position: object.position.clone(),
          selectable: object.userData.selectable !== false,
          object: object
        };
        
        skyObjects.push(objectInfo);
        
        // 如果对象可选择，标记为需要删除
        if (object.userData.selectable !== false) {
          objectsToRemove.push(object);
        }
      }
    });
    
    console.log(`发现 ${skyObjects.length} 个天空中的对象:`);
    skyObjects.forEach((obj, index) => {
      console.log(`${index + 1}. ${obj.name} (${obj.type}) - 位置: (${obj.position.x.toFixed(2)}, ${obj.position.y.toFixed(2)}, ${obj.position.z.toFixed(2)}) - 可选择: ${obj.selectable}`);
    });
    
    // 删除天空中的可选择对象
    if (objectsToRemove.length > 0) {
      console.log(`🗑️ 删除 ${objectsToRemove.length} 个天空中的可选择对象...`);
      objectsToRemove.forEach((object, index) => {
        console.log(`删除对象 ${index + 1}: ${object.name || 'unnamed'}`);
        this.sceneManager.scene.remove(object);
        
        // 清理几何体和材质
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      console.log('✅ 天空中的可选择对象已删除');
    } else {
      console.log('✅ 天空中没有可选择的对象需要删除');
    }
    
    return {
      total: skyObjects.length,
      removed: objectsToRemove.length,
      remaining: skyObjects.length - objectsToRemove.length
    };
  }
  /**
   * 获取建模引擎实例
   * Get modeling engine instance
   * @returns {ParametricModelingEngine}
   */
  getModelingEngine() {
    return this.modelingEngine;
  }

  /**
   * 获取场景管理器实例
   * Get scene manager instance
   * @returns {SceneManager}
   */
  getSceneManager() {
    return this.sceneManager;
  }

  /**
   * 获取交互控制器实例
   * Get interaction controller instance
   * @returns {InteractionController}
   */
  getInteractionController() {
    return this.interactionController;
  }

  /**
   * 获取模型导入界面实例
   * Get model import interface instance
   * @returns {ModelImportInterface}
   */
  getModelImportInterface() {
    return this.modelImportInterface;
  }

  /**
   * 开始场景动画循环
   * Start scene animation loop
   */
  startSceneAnimations() {
    const animate = () => {
      // 更新交互控制器
      if (this.interactionController) {
        this.interactionController.updateInteractions();
      }
      
      // 可以在这里添加小车的轻微动画效果
      this.sceneManager.getAllObjects().forEach((object, id) => {
        // 为真实车辆模型添加轻微的呼吸效果
        if (id === 'sophicar_real_vehicle' || id === 'sophicar_fallback_vehicle') {
          const time = performance.now() * 0.001;
          
          // 检查是否在隧道驾驶中，如果是则跳过动画
          if (this.tunnelDriveEffect && this.tunnelDriveEffect.isActive) {
            return; // 隧道驾驶期间不执行常规动画
          }
          
          // 保存或获取基础高度
          if (object.userData.baseHeight === undefined) {
            object.userData.baseHeight = object.position.y;
          }
          
          // 基于基础高度进行轻微的上下浮动
          object.position.y = object.userData.baseHeight + Math.sin(time * 0.5) * 0.02;
          
          // 轻微的发光效果变化
          object.traverse((child) => {
            if (child.isMesh && child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat.emissive && mat.emissiveIntensity !== undefined) {
                    mat.emissiveIntensity = 0.1 + Math.sin(time * 2) * 0.05;
                  }
                });
              } else {
                if (child.material.emissive && child.material.emissiveIntensity !== undefined) {
                  child.material.emissiveIntensity = 0.1 + Math.sin(time * 2) * 0.05;
                }
              }
            }
          });
        }
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * 设置隧道驾驶效果
   * Setup tunnel drive effect
   */
  setupTunnelDriveEffect() {
    // 等待小车模型加载完成后初始化隧道驾驶效果
    setTimeout(() => {
      const carModel = this.sceneManager.getObject('sophicar_real_vehicle') || 
                      this.sceneManager.getObject('sophicar_fallback_vehicle');
      
      if (carModel) {
        this.tunnelDriveEffect = new TunnelDriveEffect(
          this.sceneManager.scene,
          this.sceneManager.camera,
          carModel,
          this.sceneManager.renderer // 传入渲染器以便手动触发渲染
        );
        console.log('✅ 隧道驾驶效果已初始化');
      } else {
        console.warn('⚠️ 未找到小车模型，隧道驾驶效果初始化失败');
      }
    }, 2000);
  }

  /**
   * 创建UI控制按钮
   * Create UI control buttons
   */
  createUIControls() {
    // 创建右上角按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'ui-controls';
    buttonContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    
    // 创建隧道驾驶按钮
    const tunnelDriveButton = document.createElement('button');
    tunnelDriveButton.id = 'tunnel-drive-btn';
    tunnelDriveButton.innerHTML = `
      <span class="btn-icon">🚀</span>
      <span class="btn-text">隧道驾驶</span>
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
      min-width: 120px;
      justify-content: center;
    `;
    
    // 按钮悬停效果
    tunnelDriveButton.addEventListener('mouseenter', () => {
      tunnelDriveButton.style.background = 'linear-gradient(135deg, #0080ff 0%, #00aaff 100%)';
      tunnelDriveButton.style.boxShadow = '0 6px 20px rgba(0, 255, 255, 0.5)';
      tunnelDriveButton.style.transform = 'translateY(-2px)';
    });
    
    tunnelDriveButton.addEventListener('mouseleave', () => {
      tunnelDriveButton.style.background = 'linear-gradient(135deg, #0066cc 0%, #0080ff 100%)';
      tunnelDriveButton.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.3)';
      tunnelDriveButton.style.transform = 'translateY(0)';
    });
    
    // 按钮点击事件
    tunnelDriveButton.addEventListener('click', () => {
      this.startTunnelDrive();
    });
    
    // 添加按钮到容器
    buttonContainer.appendChild(tunnelDriveButton);
    
    // 添加容器到页面
    document.body.appendChild(buttonContainer);
    
    console.log('✅ UI控制按钮已创建');
  }

  /**
   * 启动隧道驾驶效果
   * Start tunnel drive effect
   */
  startTunnelDrive() {
    if (!this.tunnelDriveEffect) {
      console.warn('⚠️ 隧道驾驶效果未初始化');
      return;
    }
    
    if (this.tunnelDriveEffect.isActive) {
      console.log('⚠️ 隧道驾驶效果已在运行中');
      return;
    }
    
    console.log('🚀 启动隧道驾驶效果...');
    
    // 更新按钮状态
    const button = document.getElementById('tunnel-drive-btn');
    if (button) {
      button.innerHTML = `
        <span class="btn-icon">⏸️</span>
        <span class="btn-text">驾驶中...</span>
      `;
      button.style.background = 'linear-gradient(135deg, #ff6600 0%, #ff8800 100%)';
      button.disabled = true;
      button.style.cursor = 'not-allowed';
    }
    
    // 启动效果
    this.tunnelDriveEffect.start();
    
    // 8秒后恢复按钮状态
    setTimeout(() => {
      if (button) {
        button.innerHTML = `
          <span class="btn-icon">🚀</span>
          <span class="btn-text">隧道驾驶</span>
        `;
        button.style.background = 'linear-gradient(135deg, #0066cc 0%, #0080ff 100%)';
        button.disabled = false;
        button.style.cursor = 'pointer';
      }
    }, 9000);
  }

  /**
   * 显示错误信息
   * Show error message
   * @param {string} message - 错误信息
   */
  showErrorMessage(message) {
    // 移除加载界面
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }
    
    // 创建错误显示界面
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
      color: #ff6b6b;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Microsoft YaHei', Arial, sans-serif;
      z-index: 3000;
    `;
    
    errorDiv.innerHTML = `
      <h2 style="color: #ff6b6b; margin-bottom: 20px; text-align: center;">⚠️ 应用加载失败</h2>
      <p style="color: #40e0d0; margin-bottom: 30px; text-align: center; max-width: 600px; line-height: 1.6;">${message}</p>
      <button onclick="location.reload()" style="
        background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
        border: none;
        border-radius: 8px;
        color: white;
        padding: 12px 24px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        🔄 刷新页面
      </button>
    `;
    
    document.body.appendChild(errorDiv);
  }

  /**
   * 显示错误信息
   * Show error message
   * @param {string} message - 错误信息
   */
  showErrorMessage(message) {
    // 移除加载界面
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }
    
    // 创建错误显示界面
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
      color: #ff6b6b;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Microsoft YaHei', Arial, sans-serif;
      z-index: 3000;
    `;
    
    errorDiv.innerHTML = `
      <h2 style="color: #ff6b6b; margin-bottom: 20px; text-align: center;">⚠️ 应用加载失败</h2>
      <p style="color: #40e0d0; margin-bottom: 30px; text-align: center; max-width: 600px; line-height: 1.6;">${message}</p>
      <button onclick="location.reload()" style="
        background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
        border: none;
        border-radius: 8px;
        color: white;
        padding: 12px 24px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        🔄 刷新页面
      </button>
    `;
    
    document.body.appendChild(errorDiv);
  }

  /**
   * 销毁应用程序
   * Destroy application
   */
  destroy() {
    if (this.loadingAnimation) {
      this.loadingAnimation.destroy();
    }
    
    if (this.tunnelDriveEffect) {
      this.tunnelDriveEffect.destroy();
    }
    
    if (this.modelImportInterface) {
      this.modelImportInterface.destroy();
    }
    
    if (this.interactionController) {
      this.interactionController.destroy();
    }
    
    if (this.modelingEngine) {
      this.modelingEngine.destroy();
    }
    
    if (this.sceneManager) {
      this.sceneManager.destroy();
    }
    
    // 清理UI控制按钮
    const uiControls = document.getElementById('ui-controls');
    if (uiControls && uiControls.parentNode) {
      uiControls.parentNode.removeChild(uiControls);
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    console.log('应用程序已销毁 (Application destroyed)');
  }
}

// 创建全局应用实例
// Create global application instance
window.sophicarApp = new SophicarApp();

// 导出应用类供测试使用
// Export application class for testing
export { SophicarApp };