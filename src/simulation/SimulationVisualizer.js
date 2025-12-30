/**
 * 仿真可视化器 - 创建车辆运动和环境交互的动画系统
 * SimulationVisualizer - Create vehicle motion and environmental interaction animation system
 */
import * as THREE from 'three';

export class SimulationVisualizer {
  /**
   * 构造函数 - 初始化仿真可视化器
   * Constructor - Initialize simulation visualizer
   * @param {SceneManager} sceneManager - 场景管理器
   * @param {SimulationFramework} simulationFramework - 仿真框架
   */
  constructor(sceneManager, simulationFramework) {
    this.sceneManager = sceneManager;
    this.simulationFramework = simulationFramework;
    
    // 可视化元素
    this.visualElements = new Map();
    this.trajectoryLines = new Map();
    this.velocityVectors = new Map();
    this.forceVectors = new Map();
    
    // 动画系统
    this.animationMixers = [];
    this.activeAnimations = new Map();
    
    // 可视化设置
    this.visualizationSettings = {
      showTrajectory: true,
      showVelocityVectors: true,
      showForceVectors: false,
      trajectoryLength: 100, // 轨迹点数量
      vectorScale: 1.0,
      updateInterval: 1/30 // 30 FPS 更新频率
    };
    
    // 材质库
    this.materials = this.createMaterials();
    
    // 数据可视化面板
    this.dataVisualizationPanel = null;
    
    this.initializeVisualizer();
  }

  /**
   * 初始化可视化器
   * Initialize visualizer
   */
  initializeVisualizer() {
    // 监听仿真事件
    this.simulationFramework.addEventListener('simulationStarted', (data) => {
      this.onSimulationStarted(data);
    });
    
    this.simulationFramework.addEventListener('simulationCompleted', (data) => {
      this.onSimulationCompleted(data);
    });
    
    this.simulationFramework.addEventListener('simulationReset', () => {
      this.onSimulationReset();
    });
    
    // 创建数据可视化面板
    this.createDataVisualizationPanel();
  }

  /**
   * 创建材质库
   * Create materials library
   * @returns {Object} 材质对象
   */
  createMaterials() {
    return {
      trajectory: new THREE.LineBasicMaterial({ 
        color: 0x00ff00, 
        linewidth: 2,
        transparent: true,
        opacity: 0.8
      }),
      velocityVector: new THREE.MeshBasicMaterial({ 
        color: 0x0000ff,
        transparent: true,
        opacity: 0.7
      }),
      forceVector: new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.7
      }),
      particle: new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        opacity: 0.6
      }),
      heatmap: new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          intensity: { value: 1.0 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float intensity;
          varying vec2 vUv;
          
          vec3 heatmapColor(float t) {
            vec3 c1 = vec3(0.0, 0.0, 1.0); // 蓝色
            vec3 c2 = vec3(0.0, 1.0, 0.0); // 绿色
            vec3 c3 = vec3(1.0, 1.0, 0.0); // 黄色
            vec3 c4 = vec3(1.0, 0.0, 0.0); // 红色
            
            if (t < 0.33) return mix(c1, c2, t * 3.0);
            else if (t < 0.66) return mix(c2, c3, (t - 0.33) * 3.0);
            else return mix(c3, c4, (t - 0.66) * 3.0);
          }
          
          void main() {
            float heat = intensity * (sin(time + vUv.x * 10.0) * 0.5 + 0.5);
            gl_FragColor = vec4(heatmapColor(heat), 0.8);
          }
        `,
        transparent: true
      })
    };
  }

  /**
   * 仿真开始时的处理
   * Handle simulation start
   * @param {Object} data - 仿真数据
   */
  onSimulationStarted(data) {
    console.log('SimulationVisualizer: 仿真开始，初始化可视化元素');
    
    // 清理之前的可视化元素
    this.clearVisualizationElements();
    
    // 为每个仿真对象创建可视化元素
    for (const [objectId] of this.simulationFramework.simulationObjects.entries()) {
      this.createVisualizationForObject(objectId);
    }
    
    // 开始实时更新
    this.startRealtimeVisualization();
  }

  /**
   * 仿真完成时的处理
   * Handle simulation completion
   * @param {Object} data - 仿真数据
   */
  onSimulationCompleted(data) {
    console.log('SimulationVisualizer: 仿真完成，生成最终可视化');
    
    // 停止实时更新
    this.stopRealtimeVisualization();
    
    // 生成完整轨迹可视化
    this.generateCompleteTrajectoryVisualization(data.data);
    
    // 更新数据面板
    this.updateDataVisualizationPanel(data.data);
    
    // 创建性能热力图
    this.createPerformanceHeatmap(data.data);
  }

  /**
   * 仿真重置时的处理
   * Handle simulation reset
   */
  onSimulationReset() {
    console.log('SimulationVisualizer: 仿真重置，清理可视化元素');
    
    // 停止实时更新
    this.stopRealtimeVisualization();
    
    // 清理所有可视化元素
    this.clearVisualizationElements();
    
    // 重置数据面板
    this.resetDataVisualizationPanel();
  }

  /**
   * 为对象创建可视化元素
   * Create visualization elements for object
   * @param {string} objectId - 对象ID
   */
  createVisualizationForObject(objectId) {
    const simObject = this.simulationFramework.simulationObjects.get(objectId);
    if (!simObject) return;
    
    // 创建轨迹线
    if (this.visualizationSettings.showTrajectory) {
      this.createTrajectoryLine(objectId);
    }
    
    // 创建速度向量
    if (this.visualizationSettings.showVelocityVectors) {
      this.createVelocityVector(objectId);
    }
    
    // 创建力向量
    if (this.visualizationSettings.showForceVectors) {
      this.createForceVector(objectId);
    }
    
    // 创建粒子效果
    this.createParticleEffect(objectId);
  }

  /**
   * 创建轨迹线
   * Create trajectory line
   * @param {string} objectId - 对象ID
   */
  createTrajectoryLine(objectId) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.visualizationSettings.trajectoryLength * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const line = new THREE.Line(geometry, this.materials.trajectory.clone());
    line.name = `trajectory_${objectId}`;
    line.visible = false; // 初始隐藏，有数据时显示
    
    this.sceneManager.addObject(line, `trajectory_${objectId}`);
    this.trajectoryLines.set(objectId, {
      line: line,
      positions: [],
      maxPoints: this.visualizationSettings.trajectoryLength
    });
  }

  /**
   * 创建速度向量
   * Create velocity vector
   * @param {string} objectId - 对象ID
   */
  createVelocityVector(objectId) {
    const geometry = new THREE.ConeGeometry(0.1, 1, 8);
    const material = this.materials.velocityVector.clone();
    const arrow = new THREE.Mesh(geometry, material);
    arrow.name = `velocity_vector_${objectId}`;
    
    this.sceneManager.addObject(arrow, `velocity_vector_${objectId}`);
    this.velocityVectors.set(objectId, arrow);
  }

  /**
   * 创建力向量
   * Create force vector
   * @param {string} objectId - 对象ID
   */
  createForceVector(objectId) {
    const geometry = new THREE.ConeGeometry(0.15, 1.2, 8);
    const material = this.materials.forceVector.clone();
    const arrow = new THREE.Mesh(geometry, material);
    arrow.name = `force_vector_${objectId}`;
    
    this.sceneManager.addObject(arrow, `force_vector_${objectId}`);
    this.forceVectors.set(objectId, arrow);
  }

  /**
   * 创建粒子效果
   * Create particle effect
   * @param {string} objectId - 对象ID
   */
  createParticleEffect(objectId) {
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    // 初始化粒子位置和速度
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 2;
      positions[i + 1] = Math.random() * 0.5;
      positions[i + 2] = (Math.random() - 0.5) * 2;
      
      velocities[i] = (Math.random() - 0.5) * 0.1;
      velocities[i + 1] = Math.random() * 0.05;
      velocities[i + 2] = (Math.random() - 0.5) * 0.1;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const particles = new THREE.Points(geometry, this.materials.particle.clone());
    particles.name = `particles_${objectId}`;
    particles.visible = false; // 默认隐藏
    
    this.sceneManager.addObject(particles, `particles_${objectId}`);
    this.visualElements.set(`particles_${objectId}`, particles);
  }

  /**
   * 开始实时可视化更新
   * Start realtime visualization updates
   */
  startRealtimeVisualization() {
    const updateVisualization = () => {
      if (this.simulationFramework.simulationState !== 'running') {
        return;
      }
      
      // 更新所有对象的可视化
      for (const [objectId] of this.simulationFramework.simulationObjects.entries()) {
        this.updateObjectVisualization(objectId);
      }
      
      // 更新材质动画
      this.updateMaterialAnimations();
      
      // 继续下一帧更新
      setTimeout(() => {
        requestAnimationFrame(updateVisualization);
      }, 1000 / 30); // 30 FPS
    };
    
    updateVisualization();
  }

  /**
   * 停止实时可视化更新
   * Stop realtime visualization updates
   */
  stopRealtimeVisualization() {
    // 实时更新会在下一帧检查状态时自动停止
  }

  /**
   * 更新对象可视化
   * Update object visualization
   * @param {string} objectId - 对象ID
   */
  updateObjectVisualization(objectId) {
    const simObject = this.simulationFramework.simulationObjects.get(objectId);
    if (!simObject) return;
    
    const physicsObject = this.simulationFramework.physicsWorld.objects.get(objectId);
    if (!physicsObject) return;
    
    const { object, velocity, acceleration } = physicsObject;
    
    // 更新轨迹线
    this.updateTrajectoryLine(objectId, object.position);
    
    // 更新速度向量
    this.updateVelocityVector(objectId, object.position, velocity);
    
    // 更新力向量
    this.updateForceVector(objectId, object.position, acceleration);
    
    // 更新粒子效果
    this.updateParticleEffect(objectId, object.position, velocity);
  }

  /**
   * 更新轨迹线
   * Update trajectory line
   * @param {string} objectId - 对象ID
   * @param {THREE.Vector3} position - 当前位置
   */
  updateTrajectoryLine(objectId, position) {
    const trajectoryData = this.trajectoryLines.get(objectId);
    if (!trajectoryData) return;
    
    const { line, positions, maxPoints } = trajectoryData;
    
    // 添加新位置
    positions.push(position.clone());
    
    // 限制轨迹长度
    if (positions.length > maxPoints) {
      positions.shift();
    }
    
    // 更新几何体
    if (positions.length > 1) {
      const positionArray = new Float32Array(positions.length * 3);
      positions.forEach((pos, index) => {
        positionArray[index * 3] = pos.x;
        positionArray[index * 3 + 1] = pos.y;
        positionArray[index * 3 + 2] = pos.z;
      });
      
      line.geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
      line.geometry.setDrawRange(0, positions.length);
      line.visible = true;
    }
  }

  /**
   * 更新速度向量
   * Update velocity vector
   * @param {string} objectId - 对象ID
   * @param {THREE.Vector3} position - 位置
   * @param {THREE.Vector3} velocity - 速度
   */
  updateVelocityVector(objectId, position, velocity) {
    const arrow = this.velocityVectors.get(objectId);
    if (!arrow) return;
    
    const speed = velocity.length();
    if (speed > 0.1) {
      // 设置位置
      arrow.position.copy(position);
      arrow.position.y += 1; // 稍微抬高显示
      
      // 设置方向
      arrow.lookAt(position.clone().add(velocity.clone().normalize()));
      
      // 设置长度
      arrow.scale.y = speed * this.visualizationSettings.vectorScale;
      
      // 设置颜色（基于速度）
      const normalizedSpeed = Math.min(speed / 20, 1); // 假设最大速度20m/s
      arrow.material.color.setHSL(0.7 - normalizedSpeed * 0.7, 1, 0.5);
      
      arrow.visible = true;
    } else {
      arrow.visible = false;
    }
  }

  /**
   * 更新力向量
   * Update force vector
   * @param {string} objectId - 对象ID
   * @param {THREE.Vector3} position - 位置
   * @param {THREE.Vector3} acceleration - 加速度
   */
  updateForceVector(objectId, position, acceleration) {
    const arrow = this.forceVectors.get(objectId);
    if (!arrow) return;
    
    const magnitude = acceleration.length();
    if (magnitude > 0.1) {
      // 设置位置
      arrow.position.copy(position);
      arrow.position.y += 1.5; // 比速度向量更高
      
      // 设置方向
      arrow.lookAt(position.clone().add(acceleration.clone().normalize()));
      
      // 设置长度
      arrow.scale.y = magnitude * this.visualizationSettings.vectorScale * 0.5;
      
      arrow.visible = true;
    } else {
      arrow.visible = false;
    }
  }

  /**
   * 更新粒子效果
   * Update particle effect
   * @param {string} objectId - 对象ID
   * @param {THREE.Vector3} position - 位置
   * @param {THREE.Vector3} velocity - 速度
   */
  updateParticleEffect(objectId, position, velocity) {
    const particles = this.visualElements.get(`particles_${objectId}`);
    if (!particles) return;
    
    const speed = velocity.length();
    
    // 只在高速运动时显示粒子效果
    if (speed > 5) {
      particles.position.copy(position);
      particles.visible = true;
      
      // 更新粒子透明度基于速度
      particles.material.opacity = Math.min(speed / 20, 1) * 0.6;
    } else {
      particles.visible = false;
    }
  }

  /**
   * 更新材质动画
   * Update material animations
   */
  updateMaterialAnimations() {
    const time = performance.now() * 0.001;
    
    // 更新热力图材质
    if (this.materials.heatmap.uniforms) {
      this.materials.heatmap.uniforms.time.value = time;
    }
  }

  /**
   * 生成完整轨迹可视化
   * Generate complete trajectory visualization
   * @param {Object} simulationData - 仿真数据
   */
  generateCompleteTrajectoryVisualization(simulationData) {
    // 按对象ID分组轨迹数据
    const trajectoryByObject = new Map();
    
    simulationData.trajectory.forEach(point => {
      if (!trajectoryByObject.has(point.objectId)) {
        trajectoryByObject.set(point.objectId, []);
      }
      trajectoryByObject.get(point.objectId).push(point);
    });
    
    // 为每个对象创建完整轨迹
    for (const [objectId, trajectory] of trajectoryByObject.entries()) {
      this.createCompleteTrajectory(objectId, trajectory);
    }
  }

  /**
   * 创建完整轨迹
   * Create complete trajectory
   * @param {string} objectId - 对象ID
   * @param {Array} trajectory - 轨迹数据
   */
  createCompleteTrajectory(objectId, trajectory) {
    if (trajectory.length < 2) return;
    
    // 创建轨迹几何体
    const positions = new Float32Array(trajectory.length * 3);
    const colors = new Float32Array(trajectory.length * 3);
    
    trajectory.forEach((point, index) => {
      positions[index * 3] = point.position.x;
      positions[index * 3 + 1] = point.position.y;
      positions[index * 3 + 2] = point.position.z;
      
      // 基于时间的颜色渐变
      const t = index / (trajectory.length - 1);
      colors[index * 3] = t; // 红色分量
      colors[index * 3 + 1] = 1 - t; // 绿色分量
      colors[index * 3 + 2] = 0.5; // 蓝色分量
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.LineBasicMaterial({ 
      vertexColors: true,
      linewidth: 3,
      transparent: true,
      opacity: 0.9
    });
    
    const completTrajectory = new THREE.Line(geometry, material);
    completTrajectory.name = `complete_trajectory_${objectId}`;
    
    this.sceneManager.addObject(completTrajectory, `complete_trajectory_${objectId}`);
    this.visualElements.set(`complete_trajectory_${objectId}`, completTrajectory);
  }

  /**
   * 创建性能热力图
   * Create performance heatmap
   * @param {Object} simulationData - 仿真数据
   */
  createPerformanceHeatmap(simulationData) {
    if (simulationData.velocityProfile.length === 0) return;
    
    // 创建热力图网格
    const gridSize = 20;
    const geometry = new THREE.PlaneGeometry(50, 50, gridSize, gridSize);
    
    // 计算每个网格点的性能数据
    const vertices = geometry.attributes.position.array;
    const colors = new Float32Array(vertices.length);
    
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      
      // 查找最近的轨迹点
      let minDistance = Infinity;
      let nearestSpeed = 0;
      
      simulationData.velocityProfile.forEach(vel => {
        const trajectory = simulationData.trajectory.find(t => 
          Math.abs(t.time - vel.time) < 0.1
        );
        
        if (trajectory) {
          const distance = Math.sqrt(
            Math.pow(x - trajectory.position.x, 2) + 
            Math.pow(z - trajectory.position.z, 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestSpeed = vel.velocity;
          }
        }
      });
      
      // 基于距离和速度计算热力值
      const heatValue = minDistance < 5 ? nearestSpeed / 20 : 0;
      colors[i / 3] = heatValue;
    }
    
    geometry.setAttribute('heatValue', new THREE.BufferAttribute(colors, 1));
    
    const heatmapMaterial = this.materials.heatmap.clone();
    const heatmap = new THREE.Mesh(geometry, heatmapMaterial);
    heatmap.name = 'performance_heatmap';
    heatmap.rotation.x = -Math.PI / 2;
    heatmap.position.y = 0.01; // 稍微抬高避免z-fighting
    
    this.sceneManager.addObject(heatmap, 'performance_heatmap');
    this.visualElements.set('performance_heatmap', heatmap);
  }

  /**
   * 创建数据可视化面板
   * Create data visualization panel
   */
  createDataVisualizationPanel() {
    // 创建HTML面板元素
    const panel = document.createElement('div');
    panel.id = 'simulation-data-panel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 1000;
      display: none;
    `;
    
    panel.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #00ff00;">仿真数据面板</h3>
      <div id="simulation-status">状态: 停止</div>
      <div id="simulation-time">时间: 0.0s</div>
      <div id="simulation-speed">速度: 0.0 m/s</div>
      <div id="simulation-acceleration">加速度: 0.0 m/s²</div>
      <div id="simulation-distance">距离: 0.0 m</div>
      <div id="simulation-energy">能耗: 0.0 J</div>
      <canvas id="speed-chart" width="270" height="100" style="margin-top: 10px; border: 1px solid #333;"></canvas>
    `;
    
    document.body.appendChild(panel);
    this.dataVisualizationPanel = panel;
    
    // 初始化图表
    this.initializeSpeedChart();
  }

  /**
   * 初始化速度图表
   * Initialize speed chart
   */
  initializeSpeedChart() {
    const canvas = document.getElementById('speed-chart');
    if (!canvas) return;
    
    this.speedChartContext = canvas.getContext('2d');
    this.speedChartData = [];
    this.maxChartPoints = 100;
  }

  /**
   * 更新数据可视化面板
   * Update data visualization panel
   * @param {Object} simulationData - 仿真数据
   */
  updateDataVisualizationPanel(simulationData) {
    if (!this.dataVisualizationPanel) return;
    
    const metrics = simulationData.performanceMetrics;
    
    // 更新文本数据
    document.getElementById('simulation-status').textContent = `状态: 完成`;
    document.getElementById('simulation-time').textContent = `时间: ${this.simulationFramework.simulationTime.toFixed(1)}s`;
    document.getElementById('simulation-speed').textContent = `最大速度: ${metrics.maxSpeed?.toFixed(1) || 0} m/s`;
    document.getElementById('simulation-acceleration').textContent = `最大加速度: ${metrics.maxAcceleration?.toFixed(1) || 0} m/s²`;
    document.getElementById('simulation-distance').textContent = `总距离: ${metrics.totalDistance?.toFixed(1) || 0} m`;
    document.getElementById('simulation-energy').textContent = `总能耗: ${metrics.totalEnergyConsumption?.toFixed(0) || 0} J`;
    
    // 更新速度图表
    this.updateSpeedChart(simulationData.velocityProfile);
    
    // 显示面板
    this.dataVisualizationPanel.style.display = 'block';
  }

  /**
   * 更新速度图表
   * Update speed chart
   * @param {Array} velocityProfile - 速度曲线数据
   */
  updateSpeedChart(velocityProfile) {
    if (!this.speedChartContext || velocityProfile.length === 0) return;
    
    const ctx = this.speedChartContext;
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景网格
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // 垂直网格线
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // 水平网格线
    for (let i = 0; i <= 5; i++) {
      const y = (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // 绘制速度曲线
    if (velocityProfile.length > 1) {
      const maxSpeed = Math.max(...velocityProfile.map(v => v.velocity));
      const maxTime = velocityProfile[velocityProfile.length - 1].time;
      
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      velocityProfile.forEach((point, index) => {
        const x = (point.time / maxTime) * width;
        const y = height - (point.velocity / maxSpeed) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }
    
    // 绘制标签
    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.fillText('速度 (m/s)', 5, 15);
    ctx.fillText('时间 (s)', width - 50, height - 5);
  }

  /**
   * 重置数据可视化面板
   * Reset data visualization panel
   */
  resetDataVisualizationPanel() {
    if (!this.dataVisualizationPanel) return;
    
    // 隐藏面板
    this.dataVisualizationPanel.style.display = 'none';
    
    // 清空图表
    if (this.speedChartContext) {
      this.speedChartContext.clearRect(0, 0, 270, 100);
    }
  }

  /**
   * 清理可视化元素
   * Clear visualization elements
   */
  clearVisualizationElements() {
    // 清理轨迹线
    for (const [objectId, trajectoryData] of this.trajectoryLines.entries()) {
      this.sceneManager.removeObject(`trajectory_${objectId}`);
    }
    this.trajectoryLines.clear();
    
    // 清理速度向量
    for (const [objectId] of this.velocityVectors.entries()) {
      this.sceneManager.removeObject(`velocity_vector_${objectId}`);
    }
    this.velocityVectors.clear();
    
    // 清理力向量
    for (const [objectId] of this.forceVectors.entries()) {
      this.sceneManager.removeObject(`force_vector_${objectId}`);
    }
    this.forceVectors.clear();
    
    // 清理其他可视化元素
    for (const [elementId] of this.visualElements.entries()) {
      this.sceneManager.removeObject(elementId);
    }
    this.visualElements.clear();
  }

  /**
   * 设置可视化选项
   * Set visualization options
   * @param {Object} options - 可视化选项
   */
  setVisualizationOptions(options) {
    this.visualizationSettings = { ...this.visualizationSettings, ...options };
    
    // 应用设置变更
    if (options.showTrajectory !== undefined) {
      this.toggleTrajectoryVisibility(options.showTrajectory);
    }
    
    if (options.showVelocityVectors !== undefined) {
      this.toggleVelocityVectorVisibility(options.showVelocityVectors);
    }
    
    if (options.showForceVectors !== undefined) {
      this.toggleForceVectorVisibility(options.showForceVectors);
    }
  }

  /**
   * 切换轨迹可见性
   * Toggle trajectory visibility
   * @param {boolean} visible - 是否可见
   */
  toggleTrajectoryVisibility(visible) {
    for (const [objectId, trajectoryData] of this.trajectoryLines.entries()) {
      trajectoryData.line.visible = visible;
    }
  }

  /**
   * 切换速度向量可见性
   * Toggle velocity vector visibility
   * @param {boolean} visible - 是否可见
   */
  toggleVelocityVectorVisibility(visible) {
    for (const [objectId, arrow] of this.velocityVectors.entries()) {
      arrow.visible = visible;
    }
  }

  /**
   * 切换力向量可见性
   * Toggle force vector visibility
   * @param {boolean} visible - 是否可见
   */
  toggleForceVectorVisibility(visible) {
    for (const [objectId, arrow] of this.forceVectors.entries()) {
      arrow.visible = visible;
    }
  }

  /**
   * 销毁可视化器
   * Destroy visualizer
   */
  destroy() {
    // 停止实时更新
    this.stopRealtimeVisualization();
    
    // 清理可视化元素
    this.clearVisualizationElements();
    
    // 清理动画混合器
    this.animationMixers.forEach(mixer => mixer.stopAllAction());
    this.animationMixers.length = 0;
    
    // 移除数据面板
    if (this.dataVisualizationPanel && this.dataVisualizationPanel.parentNode) {
      this.dataVisualizationPanel.parentNode.removeChild(this.dataVisualizationPanel);
    }
    
    // 清理材质
    Object.values(this.materials).forEach(material => {
      if (material.dispose) material.dispose();
    });
  }
}