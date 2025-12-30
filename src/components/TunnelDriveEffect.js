/**
 * 隧道驾驶效果组件 - 实现小车在隧道中飞速驾驶的炫酷视觉效果
 * Tunnel Drive Effect Component - Cool visual effect of car speeding through tunnel
 */
import * as THREE from 'three';

export class TunnelDriveEffect {
  /**
   * 构造函数 - 初始化隧道驾驶效果
   * Constructor - Initialize tunnel drive effect
   * @param {THREE.Scene} scene - 3D场景
   * @param {THREE.Camera} camera - 相机
   * @param {THREE.Object3D} carModel - 小车模型
   * @param {THREE.WebGLRenderer} renderer - 渲染器（可选，用于手动触发渲染）
   */
  constructor(scene, camera, carModel, renderer = null) {
    this.scene = scene;
    this.camera = camera;
    this.carModel = carModel;
    this.renderer = renderer;
    
    // 效果状态
    this.isActive = false;
    this.animationId = null;
    this.startTime = 0;
    this.duration = 6000; // 6秒的驾驶效果（与test-car-movement-cinematic.html一致）
    this.lastLoggedProgress = -1; // 用于调试日志
    
    // 隧道和效果对象
    this.tunnel = null;
    this.speedLines = [];
    this.tunnelLights = [];
    this.particles = null;
    this.hiddenObjects = []; // 隐藏的地面对象
    
    // 原始状态保存
    this.originalCarPosition = null;
    this.originalCarRotation = null;
    this.originalCarChildStates = null; // 保存小车子对象的原始状态
    this.originalWheelRotations = null; // 保存轮子的原始旋转状态
    this.originalCameraPosition = null;
    this.originalCameraRotation = null;
    
    // 电影级运镜相机系统
    this.delayedCameraHistory = []; // 延迟跟随相机历史
    this.cameraDelayFrames = 45; // 延迟帧数 (约0.75秒)
    
    // 赛博朋克颜色配置
    this.colors = {
      tunnel: 0x001122,
      lights: 0x00ffff,
      speedLines: 0x0080ff,
      particles: 0x40e0d0
    };
  }

  /**
   * 开始隧道驾驶效果
   * Start tunnel drive effect
   */
  start() {
    if (this.isActive) {
      console.log('⚠️ 隧道驾驶效果已在运行中');
      return;
    }
    
    console.log('🚗 启动隧道驾驶效果...');
    console.log('小车模型:', this.carModel);
    console.log('场景:', this.scene);
    console.log('相机:', this.camera);
    console.log('渲染器:', this.renderer);
    
    if (!this.carModel) {
      console.error('❌ 小车模型不存在，无法启动隧道驾驶效果');
      return;
    }
    
    this.isActive = true;
    this.startTime = performance.now();
    
    // 保存原始状态
    this.saveOriginalState();
    console.log('✅ 原始状态已保存，小车位置:', this.originalCarPosition);
    
    // 隐藏地面元素
    this.hideGroundElements();
    
    // 创建隧道环境
    this.createTunnel();
    
    // 创建速度线条效果
    this.createSpeedLines();
    
    // 创建粒子效果
    this.createParticles();
    
    // 验证小车模型位置
    console.log('🔍 小车当前位置:', this.carModel.position);
    console.log('🔍 小车原始位置:', this.originalCarPosition);
    
    // 开始动画
    console.log('🎬 准备启动动画循环...');
    this.animate();
    
    console.log('✅ 隧道驾驶效果启动完成，动画循环已开始');
    
    // 验证动画循环是否启动
    setTimeout(() => {
      if (this.animationId) {
        console.log('✅ 动画循环已成功启动，animationId:', this.animationId);
      } else {
        console.error('❌ 动画循环未启动！animationId 为空');
      }
    }, 100);
  }

  /**
   * 停止隧道驾驶效果
   * Stop tunnel drive effect
   */
  stop() {
    if (!this.isActive) return;
    
    console.log('🛑 停止隧道驾驶效果...');
    
    this.isActive = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // 清理电影级运镜相机历史
    this.delayedCameraHistory = [];
    
    // 清理隧道环境
    this.cleanupTunnel();
    
    // 恢复地面元素
    this.showGroundElements();
    
    // 恢复原始状态
    this.restoreOriginalState();
  }

  /**
   * 保存原始状态
   * Save original state
   */
  saveOriginalState() {
    if (this.carModel) {
      this.originalCarPosition = this.carModel.position.clone();
      this.originalCarRotation = this.carModel.rotation.clone();
      
      // 保存小车所有子对象的原始状态（使用世界坐标保存，更准确）
      this.originalCarChildStates = new Map();
      this.carModel.traverse((child) => {
        if (child !== this.carModel) {
          // 保存本地变换
          const localPosition = child.position.clone();
          const localRotation = child.rotation.clone();
          const localScale = child.scale.clone();
          
          // 也保存世界矩阵，用于验证
          const worldMatrix = new THREE.Matrix4();
          child.updateMatrixWorld(true);
          worldMatrix.copy(child.matrixWorld);
          
          this.originalCarChildStates.set(child, {
            position: localPosition,
            rotation: localRotation,
            scale: localScale,
            worldMatrix: worldMatrix
          });
        }
      });
      
      console.log('保存小车原始状态，包含', this.originalCarChildStates.size, '个子对象');
    }
    
    this.originalCameraPosition = this.camera.position.clone();
    this.originalCameraRotation = this.camera.rotation.clone();
  }

  /**
   * 恢复原始状态
   * Restore original state
   */
  restoreOriginalState() {
    if (this.carModel && this.originalCarPosition && this.originalCarRotation) {
      // 恢复小车主体位置和旋转
      this.smoothTransition(
        this.carModel.position,
        this.originalCarPosition,
        1000
      );
      this.smoothTransition(
        this.carModel.rotation,
        this.originalCarRotation,
        1000
      );
      
      // 恢复所有子对象的原始状态
      if (this.originalCarChildStates) {
        this.carModel.traverse((child) => {
          if (child !== this.carModel && this.originalCarChildStates.has(child)) {
            const originalState = this.originalCarChildStates.get(child);
            this.smoothTransition(child.position, originalState.position, 1000);
            this.smoothTransition(child.rotation, originalState.rotation, 1000);
            this.smoothTransition(child.scale, originalState.scale, 1000);
          }
        });
        console.log('恢复小车所有子对象状态');
      }
      
      // 恢复轮子旋转状态
      if (this.originalWheelRotations) {
        this.carModel.traverse((child) => {
          if (this.originalWheelRotations.has(child)) {
            const originalRotation = this.originalWheelRotations.get(child);
            this.smoothTransition(child.rotation, originalRotation, 1000);
          }
        });
        // 清空轮子旋转记录，下次重新保存
        this.originalWheelRotations = null;
      }
    }
    
    // 平滑恢复相机位置
    this.smoothTransition(
      this.camera.position,
      this.originalCameraPosition,
      1500
    );
    this.smoothTransition(
      this.camera.rotation,
      this.originalCameraRotation,
      1500
    );
  }

  /**
   * 隐藏地面元素
   * Hide ground elements
   */
  hideGroundElements() {
    console.log('🌍 隐藏地面元素...');
    
    // 存储隐藏的对象，用于恢复
    this.hiddenObjects = [];
    
    // 遍历场景中的所有对象
    this.scene.traverse((object) => {
      // 检查是否是地面相关的对象
      if (this.isGroundElement(object)) {
        // 保存原始可见性状态
        object.userData.originalVisible = object.visible;
        // 隐藏对象
        object.visible = false;
        // 添加到隐藏列表
        this.hiddenObjects.push(object);
        
        console.log(`隐藏对象: ${object.name || object.type}`);
      }
      
      // 修复地面圈圈的方向 - 让口子朝y轴立起来
      if (this.isGroundRing(object)) {
        console.log(`修复圈圈方向: ${object.name || object.type}`);
        // 保存原始旋转
        if (!object.userData.originalRotation) {
          object.userData.originalRotation = object.rotation.clone();
        }
        // 让圈圈口子朝向Y轴（垂直立起）
        object.rotation.x = Math.PI / 2; // 绕X轴旋转90度，让圈圈立起来
        object.rotation.y = 0;
        object.rotation.z = 0;
      }
    });
    
    console.log(`✅ 已隐藏 ${this.hiddenObjects.length} 个地面元素`);
  }

  /**
   * 显示地面元素
   * Show ground elements
   */
  showGroundElements() {
    console.log('🌍 恢复地面元素...');
    
    if (this.hiddenObjects) {
      this.hiddenObjects.forEach((object) => {
        // 恢复原始可见性状态
        object.visible = object.userData.originalVisible !== undefined ? 
          object.userData.originalVisible : true;
        
        console.log(`恢复对象: ${object.name || object.type}`);
      });
      
      console.log(`✅ 已恢复 ${this.hiddenObjects.length} 个地面元素`);
      this.hiddenObjects = [];
    }
    
    // 恢复地面圈圈的原始方向
    this.scene.traverse((object) => {
      if (this.isGroundRing(object) && object.userData.originalRotation) {
        console.log(`恢复圈圈方向: ${object.name || object.type}`);
        object.rotation.copy(object.userData.originalRotation);
        delete object.userData.originalRotation;
      }
    });
  }

  /**
   * 判断是否是地面圈圈
   * Check if object is a ground ring
   * @param {THREE.Object3D} object - 3D对象
   * @returns {boolean} 是否是地面圈圈
   */
  isGroundRing(object) {
    // 检查是否是环形几何体
    const isRingGeometry = object.geometry && 
      (object.geometry.type === 'RingGeometry' || 
       object.geometry.type === 'RingBufferGeometry' ||
       object.geometry.type === 'TorusGeometry');
    
    // 检查是否在地面高度
    const isAtGroundLevel = object.position.y <= 1;
    
    // 检查是否可见（不隐藏的圈圈）
    const isVisible = object.visible;
    
    return isRingGeometry && isAtGroundLevel && isVisible;
  }

  /**
   * 判断是否是地面元素
   * Check if object is a ground element
   * @param {THREE.Object3D} object - 3D对象
   * @returns {boolean} 是否是地面元素
   */
  isGroundElement(object) {
    // 检查对象名称
    const name = (object.name || '').toLowerCase();
    const type = object.type.toLowerCase();
    
    // 地面相关的名称关键词
    const groundKeywords = [
      'ground', 'floor', 'plane', 'grid', 'circle', 'ring', 
      '地面', '圆圈', '网格', '平面'
    ];
    
    // 检查名称是否包含地面关键词
    const hasGroundName = groundKeywords.some(keyword => 
      name.includes(keyword)
    );
    
    // 检查是否是平面几何体（通常用于地面）
    const isPlaneGeometry = object.geometry && 
      (object.geometry.type === 'PlaneGeometry' || 
       object.geometry.type === 'PlaneBufferGeometry');
    
    // 检查是否是环形几何体（圆圈装饰）
    const isRingGeometry = object.geometry && 
      (object.geometry.type === 'RingGeometry' || 
       object.geometry.type === 'RingBufferGeometry' ||
       object.geometry.type === 'TorusGeometry');
    
    // 检查是否在地面高度（y坐标接近0或负值）
    const isAtGroundLevel = object.position.y <= 0.5;
    
    // 检查材质是否是网格材质
    const hasWireframeMaterial = object.material && 
      (object.material.wireframe === true);
    
    // 综合判断
    return (hasGroundName || 
           (isPlaneGeometry && isAtGroundLevel) || 
           (isRingGeometry && isAtGroundLevel) ||
           (hasWireframeMaterial && isAtGroundLevel)) &&
           object.userData.selectable === false; // 通常地面元素设置为不可选择
  }

  /**
   * 平滑过渡动画
   * Smooth transition animation
   * @param {THREE.Vector3|THREE.Euler} current - 当前值
   * @param {THREE.Vector3|THREE.Euler} target - 目标值
   * @param {number} duration - 持续时间
   */
  smoothTransition(current, target, duration) {
    const startValues = {
      x: current.x,
      y: current.y,
      z: current.z
    };
    
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = this.easeOutCubic(progress);
      
      current.x = startValues.x + (target.x - startValues.x) * easeProgress;
      current.y = startValues.y + (target.y - startValues.y) * easeProgress;
      current.z = startValues.z + (target.z - startValues.z) * easeProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  /**
   * 创建隧道环境
   * Create tunnel environment
   */
  createTunnel() {
    // 创建主隧道 - 更长更宽的隧道
    const tunnelGeometry = new THREE.CylinderGeometry(12, 12, 300, 64, 1, true);
    const tunnelMaterial = new THREE.MeshLambertMaterial({
      color: this.colors.tunnel,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending
    });
    
    this.tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    this.tunnel.rotation.z = Math.PI / 2;
    this.tunnel.position.set(0, 0, -75); // 调整位置适应更长的隧道
    this.tunnel.renderOrder = -1;
    
    // 创建内壁隧道 - 添加纹理效果
    const innerTunnelGeometry = new THREE.CylinderGeometry(11.5, 11.5, 300, 64, 1, true);
    const innerTunnelMaterial = new THREE.MeshLambertMaterial({
      color: 0x002244,
      transparent: true,
      opacity: 0.4,
      side: THREE.BackSide,
      depthWrite: false
    });
    
    const innerTunnel = new THREE.Mesh(innerTunnelGeometry, innerTunnelMaterial);
    innerTunnel.rotation.z = Math.PI / 2;
    innerTunnel.position.set(0, 0, -75);
    innerTunnel.renderOrder = 0;
    
    // 创建隧道结构线条 - 增加科技感
    this.createTunnelStructure();
    
    // 创建隧道入口和出口效果
    this.createTunnelPortals();
    
    this.scene.add(this.tunnel);
    this.scene.add(innerTunnel);
    this.tunnelLights.push(innerTunnel);
    
    // 创建隧道灯光
    this.createTunnelLights();
  }

  /**
   * 创建隧道结构线条
   * Create tunnel structure lines
   */
  createTunnelStructure() {
    const structureCount = 8; // 8条结构线
    const tunnelLength = 300;
    
    for (let i = 0; i < structureCount; i++) {
      const angle = (i / structureCount) * Math.PI * 2;
      const radius = 11.8;
      
      // 创建结构线几何体
      const points = [];
      for (let j = 0; j <= 50; j++) {
        const z = -tunnelLength/2 + (j / 50) * tunnelLength;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        points.push(new THREE.Vector3(x, y, z));
      }
      
      const structureGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const structureMaterial = new THREE.LineBasicMaterial({
        color: 0x004466,
        transparent: true,
        opacity: 0.6
      });
      
      const structureLine = new THREE.Line(structureGeometry, structureMaterial);
      structureLine.rotation.z = Math.PI / 2;
      structureLine.position.set(0, 0, -75);
      structureLine.renderOrder = 0;
      
      this.scene.add(structureLine);
      this.tunnelLights.push(structureLine);
    }
  }

  /**
   * 创建隧道入口和出口效果
   * Create tunnel portal effects
   */
  createTunnelPortals() {
    // 隧道入口光环
    const entranceGeometry = new THREE.RingGeometry(11, 13, 32);
    const entranceMaterial = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(0, 0, 75);
    entrance.renderOrder = 1;
    
    // 隧道出口光环
    const exitGeometry = new THREE.RingGeometry(11, 13, 32);
    const exitMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    
    const exit = new THREE.Mesh(exitGeometry, exitMaterial);
    exit.position.set(0, 0, -225);
    exit.renderOrder = 1;
    
    this.scene.add(entrance);
    this.scene.add(exit);
    this.tunnelLights.push(entrance);
    this.tunnelLights.push(exit);
  }

  /**
   * 创建隧道灯光
   * Create tunnel lights
   */
  createTunnelLights() {
    const lightCount = 30; // 增加灯光数量
    const tunnelLength = 300;
    
    for (let i = 0; i < lightCount; i++) {
      const z = -tunnelLength/2 + (i / (lightCount - 1)) * tunnelLength;
      
      // 创建主环形灯光
      const lightRingGeometry = new THREE.TorusGeometry(10, 0.4, 12, 24);
      const lightRingMaterial = new THREE.MeshStandardMaterial({
        color: this.colors.lights,
        emissive: this.colors.lights,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.9
      });
      
      const lightRing = new THREE.Mesh(lightRingGeometry, lightRingMaterial);
      lightRing.position.set(0, 0, z);
      // 不设置旋转，让圈口朝向屏幕（Z轴正方向）
      lightRing.renderOrder = 1;
      
      // 添加内圈光环效果
      const innerRingGeometry = new THREE.TorusGeometry(8.5, 0.2, 8, 16);
      const innerRingMaterial = new THREE.MeshStandardMaterial({
        color: 0x00aaff,
        emissive: 0x00aaff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.7
      });
      
      const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
      innerRing.position.set(0, 0, z);
      // 不设置旋转，让圈口朝向屏幕（Z轴正方向）
      innerRing.renderOrder = 1;
      
      // 创建光束效果
      const beamGeometry = new THREE.ConeGeometry(0.1, 2, 8);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: this.colors.lights,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
      });
      
      // 在圆环周围创建多个光束
      for (let j = 0; j < 8; j++) {
        const beamAngle = (j / 8) * Math.PI * 2;
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(
          Math.cos(beamAngle) * 10,
          Math.sin(beamAngle) * 10,
          z
        );
        beam.lookAt(0, 0, z); // 光束指向中心
        beam.renderOrder = 2;
        
        this.scene.add(beam);
        this.tunnelLights.push(beam);
      }
      
      this.scene.add(lightRing);
      this.scene.add(innerRing);
      this.tunnelLights.push(lightRing);
      this.tunnelLights.push(innerRing);
      
      // 添加更强的点光源
      const pointLight = new THREE.PointLight(this.colors.lights, 1.2, 25);
      pointLight.position.set(0, 0, z);
      this.scene.add(pointLight);
      this.tunnelLights.push(pointLight);
      
      // 添加聚光灯效果
      const spotLight = new THREE.SpotLight(this.colors.lights, 0.8, 30, Math.PI / 6, 0.5);
      spotLight.position.set(0, 0, z + 5);
      spotLight.target.position.set(0, 0, z - 5);
      spotLight.castShadow = false; // 避免性能问题
      this.scene.add(spotLight);
      this.scene.add(spotLight.target);
      this.tunnelLights.push(spotLight);
      this.tunnelLights.push(spotLight.target);
    }
  }

  /**
   * 创建速度线条效果
   * Create speed lines effect
   */
  createSpeedLines() {
    const lineCount = 200; // 增加线条数量
    
    for (let i = 0; i < lineCount; i++) {
      const lineGeometry = new THREE.BufferGeometry();
      
      // 创建更长的速度线条
      const lineLength = 3 + Math.random() * 4;
      const positions = new Float32Array([
        0, 0, 0,
        0, 0, -lineLength
      ]);
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      // 不同类型的速度线条
      const lineType = Math.floor(Math.random() * 3);
      let lineMaterial;
      
      switch (lineType) {
        case 0: // 主要速度线条
          lineMaterial = new THREE.LineBasicMaterial({
            color: this.colors.speedLines,
            transparent: true,
            opacity: 0.8
          });
          break;
        case 1: // 次要速度线条
          lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.6
          });
          break;
        case 2: // 装饰性线条
          lineMaterial = new THREE.LineBasicMaterial({
            color: 0x0066aa,
            transparent: true,
            opacity: 0.4
          });
          break;
      }
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      
      // 分层分布在隧道内
      const angle = Math.random() * Math.PI * 2;
      const radiusLayer = Math.floor(Math.random() * 3); // 3个半径层
      const radius = 4 + radiusLayer * 2.5; // 4, 6.5, 9 的半径分布
      
      line.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        Math.random() * 200 - 250
      );
      
      // 存储线条属性用于动画
      line.userData = {
        speed: 2 + Math.random() * 3, // 不同的移动速度
        originalOpacity: lineMaterial.opacity,
        layer: radiusLayer
      };
      
      line.renderOrder = 2;
      
      this.scene.add(line);
      this.speedLines.push(line);
    }
  }

  /**
   * 创建粒子效果
   * Create particle effects
   */
  createParticles() {
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // 随机分布在隧道内，确保不超出隧道边界
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 10; // 调整半径，确保在隧道内
      
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.sin(angle) * radius;
      positions[i3 + 2] = Math.random() * 200 - 200;
      
      // 赛博朋克颜色
      const color = new THREE.Color();
      color.setHSL(0.5 + Math.random() * 0.2, 0.8, 0.6);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      sizes[i] = Math.random() * 0.1 + 0.05;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false // 避免深度冲突
    });
    
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.particles.renderOrder = 3; // 确保粒子在最后渲染
    this.scene.add(this.particles);
  }

  /**
   * 动画循环
   * Animation loop
   */
  animate() {
    if (!this.isActive) {
      console.warn('⚠️ 动画循环被调用但效果未激活，isActive:', this.isActive);
      return;
    }
    
    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    
    // 首次调用时输出详细调试信息
    if (elapsed < 50) {
      console.log('🎬 动画循环开始！');
      console.log('  - 已过时间:', elapsed.toFixed(2), 'ms');
      console.log('  - 进度:', (progress * 100).toFixed(2) + '%');
      console.log('  - 小车模型存在:', !!this.carModel);
      console.log('  - 原始位置:', this.originalCarPosition);
      console.log('  - 渲染器存在:', !!this.renderer);
    }
    
    // 更新小车位置和姿态
    if (this.carModel) {
      this.updateCarAnimation(progress);
    } else {
      console.error('❌ 小车模型不存在，无法更新动画');
      this.stop();
      return;
    }
    
    // 更新相机跟随
    this.updateCameraFollow(progress);
    
    // 更新隧道效果
    this.updateTunnelEffects(elapsed);
    
    // 更新速度线条
    this.updateSpeedLines(elapsed);
    
    // 更新粒子效果
    this.updateParticles(elapsed);
    
    // 手动触发渲染（如果提供了渲染器）
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    } else {
      // 只在首次警告
      if (elapsed < 50) {
        console.warn('⚠️ 渲染器未提供，无法手动触发渲染');
      }
    }
    
    if (progress >= 1) {
      // 动画完成，停止效果
      console.log('✅ 动画完成，准备停止效果');
      setTimeout(() => this.stop(), 1000);
    } else {
      // 继续动画循环
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }

  /**
   * 更新小车动画（使用与test-car-movement-cinematic.html一致的缓动）
   * Update car animation
   * @param {number} progress - 动画进度 (0-1)
   */
  updateCarAnimation(progress) {
    if (!this.carModel) {
      console.warn('⚠️ 小车模型不存在，跳过动画更新');
      return;
    }
    
    // 确保有原始位置，如果没有则使用当前位置
    if (!this.originalCarPosition) {
      this.originalCarPosition = this.carModel.position.clone();
      console.log('⚠️ 原始位置未保存，使用当前位置:', this.originalCarPosition);
    }
    
    // 使用与test-car-movement-cinematic.html一致的缓动和距离
    const maxDistance = 50; // 50米的运动距离（与test-car-movement-cinematic.html一致）
    const easedProgress = this.easeInOutQuart(progress); // 使用四次方缓动
    const currentDistance = easedProgress * maxDistance;
    
    // 直接设置小车位置 - 朝画面远端移动
    const newX = this.originalCarPosition.x;
    const newY = this.originalCarPosition.y;
    const newZ = this.originalCarPosition.z - currentDistance; // 负Z方向是画面远端
    
    // 只更新小车主体位置，不影响子对象
    this.carModel.position.set(newX, newY, newZ);
    
    // 强制恢复所有子对象的原始状态（包括轮子），确保零件不会乱飞
    // 在每一帧都强制恢复，防止其他代码修改
    if (this.originalCarChildStates) {
      this.carModel.traverse((child) => {
        if (child !== this.carModel && this.originalCarChildStates.has(child)) {
          const originalState = this.originalCarChildStates.get(child);
          // 强制恢复位置、旋转和缩放（使用精确复制）
          if (originalState.position) {
            child.position.set(
              originalState.position.x,
              originalState.position.y,
              originalState.position.z
            );
          }
          if (originalState.rotation) {
            child.rotation.set(
              originalState.rotation.x,
              originalState.rotation.y,
              originalState.rotation.z
            );
          }
          if (originalState.scale) {
            child.scale.set(
              originalState.scale.x,
              originalState.scale.y,
              originalState.scale.z
            );
          }
        }
      });
    }
    
    // 禁用轮子旋转，避免零件乱飞
    // 如果需要轮子旋转效果，可以在这里添加，但当前为了稳定性暂时禁用
    // this.animateWheels(this.carModel, currentDistance);
    
    // 每秒输出一次位置信息
    if (Math.floor(progress * 10) !== this.lastLoggedProgress) {
      this.lastLoggedProgress = Math.floor(progress * 10);
      const actualPos = this.carModel.position;
      console.log(`🚗 小车移动进度: ${(progress * 100).toFixed(1)}%, 距离: ${currentDistance.toFixed(2)}m`);
      console.log(`   目标位置: (${newX.toFixed(2)}, ${newY.toFixed(2)}, ${newZ.toFixed(2)})`);
      console.log(`   实际位置: (${actualPos.x.toFixed(2)}, ${actualPos.y.toFixed(2)}, ${actualPos.z.toFixed(2)})`);
      
      // 检查位置是否真的更新了
      if (Math.abs(actualPos.z - newZ) > 0.01) {
        console.warn(`⚠️ 位置更新可能被覆盖！目标Z: ${newZ.toFixed(2)}, 实际Z: ${actualPos.z.toFixed(2)}`);
      }
    }
  }
  
  /**
   * 轮子旋转动画（与test-car-movement-cinematic.html一致）
   * 只旋转轮子，不影响其他子对象的位置和旋转
   * @param {THREE.Object3D} carModel - 小车模型
   * @param {number} distance - 移动距离
   */
  animateWheels(carModel, distance) {
    // 根据移动距离计算轮子旋转（与test-car-movement-cinematic.html一致）
    const wheelRadius = 0.3;
    const rotationAngle = distance / wheelRadius;
    
    // 保存原始轮子旋转状态（如果还没有保存）
    if (!this.originalWheelRotations) {
      this.originalWheelRotations = new Map();
      carModel.traverse((child) => {
        const childName = (child.name || '').toLowerCase();
        if (childName.includes('wheel') || 
            childName.includes('tire') || 
            childName.includes('轮') ||
            child.userData.isWheel) {
          // 保存原始旋转（只保存X轴旋转）
          this.originalWheelRotations.set(child, {
            x: child.rotation.x,
            y: child.rotation.y,
            z: child.rotation.z
          });
        }
      });
    }
    
    // 只更新轮子的X轴旋转，保持Y和Z轴不变
    carModel.traverse((child) => {
      const childName = (child.name || '').toLowerCase();
      if (childName.includes('wheel') || 
          childName.includes('tire') || 
          childName.includes('轮') ||
          child.userData.isWheel) {
        // 获取原始旋转
        const originalRotation = this.originalWheelRotations.get(child);
        if (originalRotation) {
          // 只修改X轴旋转，保持Y和Z轴为原始值
          child.rotation.x = originalRotation.x - rotationAngle;
          child.rotation.y = originalRotation.y;
          child.rotation.z = originalRotation.z;
        } else {
          // 如果没有原始旋转记录，直接设置X轴
          child.rotation.x = -rotationAngle;
        }
      }
    });
  }

  /**
   * 更新相机跟随 - 电影级一镜到底运镜
   * Update camera follow - Cinematic one-shot cinematography
   * @param {number} progress - 动画进度 (0-1)
   */
  updateCameraFollow(progress) {
    if (!this.carModel) return;
    
    const elapsed = performance.now() - this.startTime;
    const time = elapsed * 0.001;
    
    // 电影级一镜到底运镜 - 基于时间的三个阶段（与test-car-movement-cinematic.html一致）
    // Phase 1 (0-2秒): 延迟跟随 - 追车开场
    // Phase 2 (2-4秒): 侧面跟随 - 运镜转换  
    // Phase 3 (4-6秒): 原始跟随 - 沉浸结尾
    
    // 镜头阶段定义（与test-car-movement-cinematic.html一致）
    const cinematicPhases = [
      {
        name: '延迟跟随',
        startTime: 0,
        endTime: 2000,
        description: '追车开场'
      },
      {
        name: '侧面跟随',
        startTime: 2000,
        endTime: 4000,
        description: '运镜转换'
      },
      {
        name: '原始跟随',
        startTime: 4000,
        endTime: 6000,
        description: '沉浸结尾'
      }
    ];
    
    // 确定当前镜头阶段（基于时间，而非进度）
    let currentPhase = 0;
    let phaseProgress = 0;
    
    for (let i = 0; i < cinematicPhases.length; i++) {
      if (elapsed >= cinematicPhases[i].startTime && elapsed < cinematicPhases[i].endTime) {
        currentPhase = i;
        phaseProgress = (elapsed - cinematicPhases[i].startTime) / 
                      (cinematicPhases[i].endTime - cinematicPhases[i].startTime);
        break;
      }
    }
    
    // 如果超过最后一个阶段，保持在最后一个阶段
    if (elapsed >= cinematicPhases[cinematicPhases.length - 1].endTime) {
      currentPhase = cinematicPhases.length - 1;
      phaseProgress = 1;
    }
    
    // 初始化延迟跟随历史（如果需要）
    if (!this.delayedCameraHistory) {
      this.delayedCameraHistory = [];
      this.cameraDelayFrames = 45; // 0.75秒延迟
    }
    
    // 根据阶段执行不同的运镜（与test-car-movement-cinematic.html完全一致）
    switch (currentPhase) {
      case 0: // 延迟跟随阶段 (0-2秒)
        this.updateDelayedFollowCamera(this.camera, this.carModel, phaseProgress);
        break;
        
      case 1: // 侧面跟随阶段 (2-4秒) - 平滑过渡
        this.updateSideFollowCamera(this.camera, this.carModel, phaseProgress, elapsed);
        break;
        
      case 2: // 原始跟随阶段 (4-6秒) - 最终沉浸
        this.updateOriginalFollowCamera(this.camera, this.carModel, phaseProgress, elapsed);
        break;
    }
    
    // 添加电影级相机震动（与test-car-movement-cinematic.html一致）
    this.addCinematicCameraShake(this.camera, progress);
  }

  /**
   * 延迟跟随相机更新（与test-car-movement-cinematic.html一致）
   * @param {THREE.Camera} camera - 相机对象
   * @param {THREE.Object3D} carModel - 小车模型
   * @param {number} phaseProgress - 阶段进度 (0-1)
   */
  updateDelayedFollowCamera(camera, carModel, phaseProgress) {
    // 延迟跟随 - 营造追车感（与test-car-movement-cinematic.html一致）
    const idealOffset = new THREE.Vector3(0, 4, 12);
    const idealPosition = carModel.position.clone().add(idealOffset);
    
    // 添加到历史记录
    this.delayedCameraHistory.push(idealPosition.clone());
    if (this.delayedCameraHistory.length > this.cameraDelayFrames) {
      this.delayedCameraHistory.shift();
    }
    
    // 使用延迟位置
    if (this.delayedCameraHistory.length > 0) {
      const delayedPosition = this.delayedCameraHistory[0];
      camera.position.lerp(delayedPosition, 0.08);
      
      // 相机稍微向上看，增加动感
      const lookTarget = carModel.position.clone();
      lookTarget.y += 0.5;
      camera.lookAt(lookTarget);
    }
  }

  /**
   * 侧面跟随相机更新（与test-car-movement-cinematic.html一致）
   * @param {THREE.Camera} camera - 相机对象
   * @param {THREE.Object3D} carModel - 小车模型
   * @param {number} phaseProgress - 阶段进度 (0-1)
   * @param {number} elapsed - 已过时间
   */
  updateSideFollowCamera(camera, carModel, phaseProgress, elapsed) {
    // 侧面跟随 - 从延迟跟随平滑过渡到侧面（与test-car-movement-cinematic.html一致）
    const transitionProgress = this.easeInOutCubic(phaseProgress);
    
    // 起始位置（延迟跟随的最后位置）
    const startOffset = new THREE.Vector3(0, 4, 12);
    // 目标位置（侧面跟随）
    const endOffset = new THREE.Vector3(15, 6, 3);
    
    // 平滑插值
    const currentOffset = new THREE.Vector3().lerpVectors(startOffset, endOffset, transitionProgress);
    const targetPosition = carModel.position.clone().add(currentOffset);
    
    // 添加轻微的弧形运动
    const arcHeight = Math.sin(transitionProgress * Math.PI) * 2;
    targetPosition.y += arcHeight;
    
    camera.position.lerp(targetPosition, 0.12);
    
    // 相机始终看向小车，但有轻微的预判
    const lookTarget = carModel.position.clone();
    lookTarget.z -= 2; // 稍微看向前方
    camera.lookAt(lookTarget);
  }

  /**
   * 原始跟随相机更新（与test-car-movement-cinematic.html一致）
   * @param {THREE.Camera} camera - 相机对象
   * @param {THREE.Object3D} carModel - 小车模型
   * @param {number} phaseProgress - 阶段进度 (0-1)
   * @param {number} elapsed - 已过时间
   */
  updateOriginalFollowCamera(camera, carModel, phaseProgress, elapsed) {
    // 原始跟随 - 从侧面平滑过渡到紧跟（与test-car-movement-cinematic.html一致）
    const transitionProgress = this.easeInOutCubic(phaseProgress);
    
    // 起始位置（侧面跟随的最后位置）
    const startOffset = new THREE.Vector3(15, 6, 3);
    // 目标位置（原始跟随）
    const endOffset = new THREE.Vector3(0, 2.5, 8);
    
    // 平滑插值
    const currentOffset = new THREE.Vector3().lerpVectors(startOffset, endOffset, transitionProgress);
    const targetPosition = carModel.position.clone().add(currentOffset);
    
    // 添加轻微的下降运动，营造俯冲感
    const diveEffect = Math.sin(transitionProgress * Math.PI * 0.5) * 1;
    targetPosition.y -= diveEffect * 0.5;
    
    camera.position.lerp(targetPosition, 0.15);
    
    // 最终阶段，相机紧跟小车
    const lookTarget = carModel.position.clone();
    lookTarget.y += 0.2;
    camera.lookAt(lookTarget);
  }

  /**
   * 添加电影级相机震动（与test-car-movement-cinematic.html一致）
   * @param {THREE.Camera} camera - 相机对象
   * @param {number} progress - 总体进度
   */
  addCinematicCameraShake(camera, progress) {
    // 电影级相机震动 - 随着速度增加而增强（与test-car-movement-cinematic.html一致）
    const shakeIntensity = 0.03 * Math.min(progress * 2, 1);
    const time = performance.now() * 0.001;
    
    // 使用多层噪声创建更自然的震动
    const shake1 = Math.sin(time * 8) * shakeIntensity * 0.6;
    const shake2 = Math.sin(time * 12.7) * shakeIntensity * 0.3;
    const shake3 = Math.sin(time * 19.3) * shakeIntensity * 0.1;
    
    camera.position.x += shake1 + shake2 + shake3;
    camera.position.y += (shake1 * 0.7) + (shake2 * 0.5);
  }

  /**
   * 三次贝塞尔缓动函数（与test-car-movement-cinematic.html一致）
   * @param {number} t - 进度 (0-1)
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * 四次方缓动函数（与test-car-movement-cinematic.html一致）
   * @param {number} t - 进度 (0-1)
   */
  easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  /**
   * 更新隧道效果
   * Update tunnel effects
   * @param {number} elapsed - 已过时间
   */
  updateTunnelEffects(elapsed) {
    const time = elapsed * 0.001;
    
    // 隧道灯光动态效果
    this.tunnelLights.forEach((light, index) => {
      if (light.material) {
        // 环形灯光脉冲效果
        const pulseSpeed = 0.01 + (index % 3) * 0.005;
        const pulsePhase = index * 0.5;
        const pulseIntensity = 0.8 + Math.sin(elapsed * pulseSpeed + pulsePhase) * 0.4;
        
        // 只有在材质支持 emissiveIntensity 时才设置
        if (light.material.emissiveIntensity !== undefined) {
          light.material.emissiveIntensity = pulseIntensity;
        }
        
        // 颜色变化效果
        if (index % 5 === 0 && light.material.color) {
          const hue = (time * 0.1 + index * 0.1) % 1;
          light.material.color.setHSL(0.5 + hue * 0.3, 0.8, 0.6);
          // 只有在材质支持 emissive 时才设置
          if (light.material.emissive) {
            light.material.emissive.setHSL(0.5 + hue * 0.3, 0.8, 0.6);
          }
        }
        
        // 透明度波动
        if (light.material.opacity !== undefined) {
          light.material.opacity = 0.7 + Math.sin(elapsed * 0.008 + index * 0.3) * 0.3;
        }
      }
      
      if (light.intensity !== undefined) {
        // 点光源强度变化 - 更剧烈的变化
        const flickerSpeed = 0.005 + (index % 4) * 0.002;
        const baseIntensity = 1.2;
        const flickerIntensity = Math.sin(elapsed * flickerSpeed + index) * 0.6;
        light.intensity = Math.max(0.3, baseIntensity + flickerIntensity);
        
        // 光源颜色变化
        if (index % 7 === 0) {
          const colorShift = Math.sin(time * 0.3 + index * 0.2) * 0.5 + 0.5;
          light.color.setHSL(0.5 + colorShift * 0.2, 0.8, 0.7);
        }
      }
      
      // 旋转效果（对于环形灯光）
      if (light.geometry && light.geometry.type === 'TorusGeometry') {
        light.rotation.z += 0.01 * (1 + index % 3);
      }
    });
    
    // 隧道本体的动态效果
    if (this.tunnel) {
      // 轻微的隧道脉动效果
      const pulseFactor = 1 + Math.sin(time * 2) * 0.02;
      this.tunnel.scale.set(pulseFactor, pulseFactor, 1);
      
      // 隧道材质透明度变化
      this.tunnel.material.opacity = 0.6 + Math.sin(time * 1.5) * 0.1;
    }
  }

  /**
   * 更新速度线条
   * Update speed lines
   * @param {number} elapsed - 已过时间
   */
  updateSpeedLines(elapsed) {
    const time = elapsed * 0.001;
    
    this.speedLines.forEach((line, index) => {
      const userData = line.userData;
      
      // 不同速度的线条移动
      line.position.z += userData.speed;
      
      // 重置到前方
      if (line.position.z > 100) {
        line.position.z = -250;
      }
      
      // 动态透明度效果
      const distanceFactor = Math.max(0, 1 - Math.abs(line.position.z) / 200);
      const pulseFactor = 0.7 + Math.sin(time * 2 + index * 0.1) * 0.3;
      line.material.opacity = userData.originalOpacity * distanceFactor * pulseFactor;
      
      // 不同层的线条有不同的动画效果
      if (userData.layer === 0) {
        // 内层：快速闪烁
        line.material.opacity *= 0.8 + Math.sin(elapsed * 0.02 + index) * 0.2;
      } else if (userData.layer === 1) {
        // 中层：波浪效果
        const wave = Math.sin(time * 3 + line.position.z * 0.1);
        line.position.x += Math.cos(line.position.z * 0.05) * wave * 0.1;
        line.position.y += Math.sin(line.position.z * 0.05) * wave * 0.1;
      }
      // 外层保持稳定移动
    });
  }

  /**
   * 更新粒子效果
   * Update particle effects
   * @param {number} elapsed - 已过时间
   */
  updateParticles(elapsed) {
    if (!this.particles) return;
    
    const positions = this.particles.geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 3) {
      // 粒子向后移动
      positions[i + 2] += 3;
      
      // 重置到前方
      if (positions[i + 2] > 50) {
        positions[i + 2] = -200;
      }
    }
    
    this.particles.geometry.attributes.position.needsUpdate = true;
    
    // 整体旋转效果
    this.particles.rotation.z = elapsed * 0.001;
  }

  /**
   * 清理隧道环境
   * Cleanup tunnel environment
   */
  cleanupTunnel() {
    // 移除隧道
    if (this.tunnel) {
      this.scene.remove(this.tunnel);
      this.tunnel.geometry.dispose();
      this.tunnel.material.dispose();
      this.tunnel = null;
    }
    
    // 移除隧道灯光
    this.tunnelLights.forEach(light => {
      this.scene.remove(light);
      if (light.geometry) light.geometry.dispose();
      if (light.material) light.material.dispose();
    });
    this.tunnelLights = [];
    
    // 移除速度线条
    this.speedLines.forEach(line => {
      this.scene.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    this.speedLines = [];
    
    // 移除粒子
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.particles = null;
    }
  }

  /**
   * 缓动函数 - 三次方缓出
   * Easing function - cubic ease out
   * @param {number} t - 进度值 (0-1)
   * @returns {number} 缓动后的值
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * 销毁效果
   * Destroy effect
   */
  destroy() {
    this.stop();
  }
}