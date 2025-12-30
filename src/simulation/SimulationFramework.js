/**
 * 仿真框架 - 执行物理仿真和结果可视化
 * SimulationFramework - Execute physics simulations and visualize results
 */
import * as THREE from 'three';
import { createSimulationScenario, validateSimulationScenario } from '../interfaces/ISimulationScenario.js';

export class SimulationFramework {
  /**
   * 构造函数 - 初始化仿真框架
   * Constructor - Initialize simulation framework
   * @param {SceneManager} sceneManager - 场景管理器
   */
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.physicsWorld = null;
    this.currentScenario = null;
    this.simulationState = 'stopped'; // 'stopped', 'running', 'paused', 'completed'
    this.simulationTime = 0;
    this.timeStep = 1/60; // 60 FPS
    this.maxSimulationTime = 60; // 最大仿真时间（秒）
    
    // 仿真数据存储
    this.simulationData = {
      trajectory: [],
      velocityProfile: [],
      accelerationProfile: [],
      energyConsumption: [],
      performanceMetrics: {}
    };
    
    // 仿真对象引用
    this.simulationObjects = new Map();
    this.animationMixers = [];
    
    // 物理参数
    this.physicsSettings = {
      gravity: -9.81,
      friction: 0.7,
      airResistance: 0.3,
      timeStep: this.timeStep
    };
    
    // 事件监听器
    this.eventListeners = new Map();
    
    this.initializePhysicsWorld();
  }

  /**
   * 初始化物理世界
   * Initialize physics world
   */
  initializePhysicsWorld() {
    // 创建简化的物理世界对象
    this.physicsWorld = {
      gravity: new THREE.Vector3(0, this.physicsSettings.gravity, 0),
      objects: new Map(),
      constraints: [],
      
      // 添加物理对象
      addObject: (id, object, properties) => {
        this.physicsWorld.objects.set(id, {
          object: object,
          velocity: new THREE.Vector3(0, 0, 0),
          acceleration: new THREE.Vector3(0, 0, 0),
          mass: properties.mass || 1000, // 默认1000kg
          friction: properties.friction || this.physicsSettings.friction,
          airResistance: properties.airResistance || this.physicsSettings.airResistance,
          forces: []
        });
      },
      
      // 移除物理对象
      removeObject: (id) => {
        this.physicsWorld.objects.delete(id);
      },
      
      // 应用力
      applyForce: (id, force) => {
        const physicsObject = this.physicsWorld.objects.get(id);
        if (physicsObject) {
          physicsObject.forces.push(force);
        }
      },
      
      // 更新物理世界
      update: (deltaTime) => {
        this.updatePhysicsObjects(deltaTime);
      }
    };
  }

  /**
   * 更新物理对象
   * Update physics objects
   * @param {number} deltaTime - 时间步长
   */
  updatePhysicsObjects(deltaTime) {
    for (const [id, physicsObject] of this.physicsWorld.objects.entries()) {
      const { object, velocity, acceleration, mass, friction, airResistance, forces } = physicsObject;
      
      // 计算合力
      const totalForce = new THREE.Vector3(0, 0, 0);
      
      // 重力
      totalForce.add(new THREE.Vector3(0, mass * this.physicsWorld.gravity.y, 0));
      
      // 应用的外力
      forces.forEach(force => totalForce.add(force));
      
      // 摩擦力（简化模型）
      if (velocity.length() > 0) {
        const frictionForce = velocity.clone().normalize().multiplyScalar(-friction * mass * Math.abs(this.physicsWorld.gravity.y));
        totalForce.add(frictionForce);
      }
      
      // 空气阻力（简化模型）
      if (velocity.length() > 0) {
        const airResistanceForce = velocity.clone().multiplyScalar(-airResistance * velocity.lengthSq());
        totalForce.add(airResistanceForce);
      }
      
      // 计算加速度 F = ma
      acceleration.copy(totalForce).divideScalar(mass);
      
      // 更新速度
      velocity.add(acceleration.clone().multiplyScalar(deltaTime));
      
      // 更新位置
      const deltaPosition = velocity.clone().multiplyScalar(deltaTime);
      object.position.add(deltaPosition);
      
      // 地面碰撞检测（简化）
      if (object.position.y < 0) {
        object.position.y = 0;
        velocity.y = Math.max(0, velocity.y); // 防止穿透地面
      }
      
      // 清空力数组
      physicsObject.forces.length = 0;
      
      // 记录仿真数据
      if (this.simulationState === 'running') {
        this.recordSimulationData(id, object, velocity, acceleration);
      }
    }
  }

  /**
   * 记录仿真数据
   * Record simulation data
   * @param {string} id - 对象ID
   * @param {THREE.Object3D} object - 3D对象
   * @param {THREE.Vector3} velocity - 速度
   * @param {THREE.Vector3} acceleration - 加速度
   */
  recordSimulationData(id, object, velocity, acceleration) {
    const currentTime = this.simulationTime;
    
    // 记录轨迹
    this.simulationData.trajectory.push({
      time: currentTime,
      position: object.position.clone(),
      objectId: id
    });
    
    // 记录速度
    this.simulationData.velocityProfile.push({
      time: currentTime,
      velocity: velocity.length(),
      velocityVector: velocity.clone(),
      objectId: id
    });
    
    // 记录加速度
    this.simulationData.accelerationProfile.push({
      time: currentTime,
      acceleration: acceleration.length(),
      accelerationVector: acceleration.clone(),
      objectId: id
    });
    
    // 计算能耗（简化模型）
    const power = Math.abs(velocity.dot(acceleration)) * 1000; // 简化功率计算
    this.simulationData.energyConsumption.push({
      time: currentTime,
      power: power,
      cumulativeEnergy: this.calculateCumulativeEnergy(),
      objectId: id
    });
  }

  /**
   * 计算累积能耗
   * Calculate cumulative energy consumption
   * @returns {number} 累积能耗
   */
  calculateCumulativeEnergy() {
    return this.simulationData.energyConsumption.reduce((total, entry) => {
      return total + (entry.power * this.timeStep);
    }, 0);
  }

  /**
   * 设置仿真场景
   * Set simulation scenario
   * @param {Object} scenarioConfig - 场景配置
   * @returns {boolean} 设置是否成功
   */
  setupSimulationScenario(scenarioConfig) {
    try {
      // 创建并验证场景
      const scenario = createSimulationScenario(scenarioConfig);
      if (!validateSimulationScenario(scenario)) {
        throw new Error('场景配置验证失败');
      }
      
      this.currentScenario = scenario;
      
      // 应用物理设置
      this.physicsSettings = { ...this.physicsSettings, ...scenario.physicsSettings };
      this.physicsWorld.gravity.y = this.physicsSettings.gravity;
      
      // 设置环境
      this.setupEnvironment(scenario.environment);
      
      // 重置仿真数据
      this.resetSimulationData();
      
      return true;
      
    } catch (error) {
      console.error('SimulationFramework: 场景设置失败', error);
      return false;
    }
  }

  /**
   * 设置仿真环境
   * Set up simulation environment
   * @param {Object} environment - 环境配置
   */
  setupEnvironment(environment) {
    // 更新场景环境光照
    if (this.sceneManager.lights) {
      const lightingConfig = environment.lighting || {};
      
      // 根据天气条件调整光照
      switch (environment.weather) {
        case 'sunny':
          this.sceneManager.lights.main.intensity = lightingConfig.intensity || 1.0;
          this.sceneManager.lights.ambient.intensity = 0.4;
          break;
        case 'cloudy':
          this.sceneManager.lights.main.intensity = lightingConfig.intensity || 0.6;
          this.sceneManager.lights.ambient.intensity = 0.6;
          break;
        case 'rainy':
          this.sceneManager.lights.main.intensity = lightingConfig.intensity || 0.3;
          this.sceneManager.lights.ambient.intensity = 0.7;
          break;
        default:
          this.sceneManager.lights.main.intensity = lightingConfig.intensity || 0.8;
          this.sceneManager.lights.ambient.intensity = 0.4;
      }
    }
    
    // 设置地形（简化实现）
    if (environment.terrain && environment.terrain !== 'flat') {
      this.createTerrain(environment.terrain);
    }
  }

  /**
   * 创建地形
   * Create terrain
   * @param {string} terrainType - 地形类型
   */
  createTerrain(terrainType) {
    // 移除现有地形
    const existingTerrain = this.sceneManager.scene.getObjectByName('terrain');
    if (existingTerrain) {
      this.sceneManager.scene.remove(existingTerrain);
    }
    
    let terrainGeometry;
    
    switch (terrainType) {
      case 'hills':
        // 创建起伏地形
        terrainGeometry = new THREE.PlaneGeometry(100, 100, 32, 32);
        const vertices = terrainGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
          vertices[i + 2] = Math.sin(vertices[i] * 0.1) * Math.cos(vertices[i + 1] * 0.1) * 2;
        }
        terrainGeometry.attributes.position.needsUpdate = true;
        terrainGeometry.computeVertexNormals();
        break;
        
      case 'slope':
        // 创建斜坡地形
        terrainGeometry = new THREE.PlaneGeometry(100, 100, 10, 10);
        const slopeVertices = terrainGeometry.attributes.position.array;
        for (let i = 0; i < slopeVertices.length; i += 3) {
          slopeVertices[i + 2] = slopeVertices[i + 1] * 0.1; // 10% 坡度
        }
        terrainGeometry.attributes.position.needsUpdate = true;
        terrainGeometry.computeVertexNormals();
        break;
        
      default:
        terrainGeometry = new THREE.PlaneGeometry(100, 100);
    }
    
    const terrainMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x90EE90,
      side: THREE.DoubleSide
    });
    
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.name = 'terrain';
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.1;
    
    this.sceneManager.scene.add(terrain);
  }

  /**
   * 添加仿真对象
   * Add simulation object
   * @param {string} id - 对象ID
   * @param {THREE.Object3D} object - 3D对象
   * @param {Object} properties - 物理属性
   */
  addSimulationObject(id, object, properties = {}) {
    // 添加到场景
    const sceneObjectId = this.sceneManager.addObject(object, id);
    
    // 添加到物理世界
    this.physicsWorld.addObject(id, object, properties);
    
    // 存储引用
    this.simulationObjects.set(id, {
      sceneObjectId: sceneObjectId,
      object: object,
      properties: properties
    });
    
    // 设置初始条件
    if (this.currentScenario && this.currentScenario.initialConditions) {
      this.applyInitialConditions(id, this.currentScenario.initialConditions);
    }
  }

  /**
   * 应用初始条件
   * Apply initial conditions
   * @param {string} objectId - 对象ID
   * @param {Object} initialConditions - 初始条件
   */
  applyInitialConditions(objectId, initialConditions) {
    const simObject = this.simulationObjects.get(objectId);
    if (!simObject) return;
    
    const { object } = simObject;
    
    // 设置初始位置
    if (initialConditions.vehiclePosition) {
      const pos = initialConditions.vehiclePosition;
      object.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
    }
    
    // 设置初始旋转
    if (initialConditions.vehicleRotation) {
      const rot = initialConditions.vehicleRotation;
      object.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
    }
    
    // 设置初始速度
    if (initialConditions.vehicleVelocity) {
      const physicsObject = this.physicsWorld.objects.get(objectId);
      if (physicsObject) {
        const vel = initialConditions.vehicleVelocity;
        physicsObject.velocity.set(vel.x || 0, vel.y || 0, vel.z || 0);
      }
    }
  }

  /**
   * 运行仿真
   * Run simulation
   * @param {Object} parameters - 仿真参数
   * @returns {boolean} 启动是否成功
   */
  runSimulation(parameters = {}) {
    if (this.simulationState === 'running') {
      console.warn('SimulationFramework: 仿真已在运行中');
      return false;
    }
    
    if (!this.currentScenario) {
      console.warn('SimulationFramework: 未设置仿真场景');
      return false;
    }
    
    // 应用仿真参数
    this.maxSimulationTime = parameters.duration || this.maxSimulationTime;
    this.timeStep = parameters.timeStep || this.timeStep;
    
    // 重置仿真状态
    this.simulationTime = 0;
    this.simulationState = 'running';
    
    // 重置仿真数据
    this.resetSimulationData();
    
    // 开始仿真循环
    this.startSimulationLoop();
    
    // 触发事件
    this.emit('simulationStarted', { scenario: this.currentScenario, parameters });
    
    return true;
  }

  /**
   * 开始仿真循环
   * Start simulation loop
   */
  startSimulationLoop() {
    const simulationStep = () => {
      if (this.simulationState !== 'running') {
        return;
      }
      
      // 更新仿真时间
      this.simulationTime += this.timeStep;
      
      // 更新物理世界
      this.physicsWorld.update(this.timeStep);
      
      // 更新动画混合器
      this.animationMixers.forEach(mixer => {
        mixer.update(this.timeStep);
      });
      
      // 检查仿真完成条件
      if (this.simulationTime >= this.maxSimulationTime || this.checkSimulationCompletion()) {
        this.completeSimulation();
        return;
      }
      
      // 继续下一帧
      requestAnimationFrame(simulationStep);
    };
    
    simulationStep();
  }

  /**
   * 检查仿真完成条件
   * Check simulation completion conditions
   * @returns {boolean} 是否应该完成仿真
   */
  checkSimulationCompletion() {
    // 检查所有对象是否静止
    for (const [id, physicsObject] of this.physicsWorld.objects.entries()) {
      if (physicsObject.velocity.length() > 0.1) {
        return false; // 还有对象在运动
      }
    }
    
    // 如果所有对象都静止，完成仿真
    return this.simulationTime > 1.0; // 至少运行1秒
  }

  /**
   * 暂停仿真
   * Pause simulation
   */
  pauseSimulation() {
    if (this.simulationState === 'running') {
      this.simulationState = 'paused';
      this.emit('simulationPaused', { time: this.simulationTime });
    }
  }

  /**
   * 恢复仿真
   * Resume simulation
   */
  resumeSimulation() {
    if (this.simulationState === 'paused') {
      this.simulationState = 'running';
      this.startSimulationLoop();
      this.emit('simulationResumed', { time: this.simulationTime });
    }
  }

  /**
   * 重置仿真
   * Reset simulation
   */
  resetSimulation() {
    this.simulationState = 'stopped';
    this.simulationTime = 0;
    
    // 重置所有仿真对象到初始状态
    if (this.currentScenario) {
      for (const [id] of this.simulationObjects.entries()) {
        this.applyInitialConditions(id, this.currentScenario.initialConditions);
        
        // 重置物理状态
        const physicsObject = this.physicsWorld.objects.get(id);
        if (physicsObject) {
          physicsObject.velocity.set(0, 0, 0);
          physicsObject.acceleration.set(0, 0, 0);
          physicsObject.forces.length = 0;
        }
      }
    }
    
    // 重置仿真数据
    this.resetSimulationData();
    
    // 触发事件
    this.emit('simulationReset');
  }

  /**
   * 完成仿真
   * Complete simulation
   */
  completeSimulation() {
    this.simulationState = 'completed';
    
    // 计算性能指标
    this.calculatePerformanceMetrics();
    
    // 触发事件
    this.emit('simulationCompleted', {
      time: this.simulationTime,
      data: this.simulationData
    });
  }

  /**
   * 计算性能指标
   * Calculate performance metrics
   */
  calculatePerformanceMetrics() {
    const metrics = {};
    
    // 最大速度
    const maxVelocity = Math.max(...this.simulationData.velocityProfile.map(v => v.velocity));
    metrics.maxSpeed = maxVelocity;
    
    // 最大加速度
    const maxAcceleration = Math.max(...this.simulationData.accelerationProfile.map(a => a.acceleration));
    metrics.maxAcceleration = maxAcceleration;
    
    // 总行驶距离
    let totalDistance = 0;
    for (let i = 1; i < this.simulationData.trajectory.length; i++) {
      const prev = this.simulationData.trajectory[i - 1];
      const curr = this.simulationData.trajectory[i];
      totalDistance += prev.position.distanceTo(curr.position);
    }
    metrics.totalDistance = totalDistance;
    
    // 平均速度
    metrics.averageSpeed = totalDistance / this.simulationTime;
    
    // 总能耗
    metrics.totalEnergyConsumption = this.calculateCumulativeEnergy();
    
    // 效率指标
    metrics.energyEfficiency = totalDistance / (metrics.totalEnergyConsumption || 1);
    
    this.simulationData.performanceMetrics = metrics;
  }

  /**
   * 导出仿真结果
   * Export simulation results
   * @param {string} format - 导出格式 ('json', 'csv')
   * @returns {string|Object} 导出的数据
   */
  exportResults(format = 'json') {
    const exportData = {
      scenario: this.currentScenario,
      simulationTime: this.simulationTime,
      data: this.simulationData,
      timestamp: new Date().toISOString()
    };
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
        
      case 'csv':
        return this.convertToCSV(exportData);
        
      default:
        return exportData;
    }
  }

  /**
   * 转换为CSV格式
   * Convert to CSV format
   * @param {Object} data - 数据对象
   * @returns {string} CSV字符串
   */
  convertToCSV(data) {
    const csvLines = [];
    
    // 轨迹数据
    csvLines.push('Trajectory Data');
    csvLines.push('Time,X,Y,Z,ObjectId');
    data.data.trajectory.forEach(point => {
      csvLines.push(`${point.time},${point.position.x},${point.position.y},${point.position.z},${point.objectId}`);
    });
    
    csvLines.push('');
    
    // 速度数据
    csvLines.push('Velocity Data');
    csvLines.push('Time,Speed,VX,VY,VZ,ObjectId');
    data.data.velocityProfile.forEach(vel => {
      csvLines.push(`${vel.time},${vel.velocity},${vel.velocityVector.x},${vel.velocityVector.y},${vel.velocityVector.z},${vel.objectId}`);
    });
    
    return csvLines.join('\n');
  }

  /**
   * 重置仿真数据
   * Reset simulation data
   */
  resetSimulationData() {
    this.simulationData = {
      trajectory: [],
      velocityProfile: [],
      accelerationProfile: [],
      energyConsumption: [],
      performanceMetrics: {}
    };
  }

  /**
   * 添加事件监听器
   * Add event listener
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * 移除事件监听器
   * Remove event listener
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  removeEventListener(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   * Emit event
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`SimulationFramework: 事件处理器错误 (${event})`, error);
        }
      });
    }
  }

  /**
   * 获取当前仿真状态
   * Get current simulation state
   * @returns {Object} 仿真状态信息
   */
  getSimulationState() {
    return {
      state: this.simulationState,
      time: this.simulationTime,
      maxTime: this.maxSimulationTime,
      progress: this.simulationTime / this.maxSimulationTime,
      scenario: this.currentScenario,
      objectCount: this.simulationObjects.size
    };
  }

  /**
   * 获取仿真数据
   * Get simulation data
   * @returns {Object} 仿真数据
   */
  getSimulationData() {
    return { ...this.simulationData };
  }

  /**
   * 销毁仿真框架
   * Destroy simulation framework
   */
  destroy() {
    // 停止仿真
    this.simulationState = 'stopped';
    
    // 清理仿真对象
    for (const [id, simObject] of this.simulationObjects.entries()) {
      this.sceneManager.removeObject(simObject.sceneObjectId);
      this.physicsWorld.removeObject(id);
    }
    this.simulationObjects.clear();
    
    // 清理动画混合器
    this.animationMixers.forEach(mixer => mixer.stopAllAction());
    this.animationMixers.length = 0;
    
    // 清理事件监听器
    this.eventListeners.clear();
    
    // 重置数据
    this.resetSimulationData();
    this.currentScenario = null;
    this.physicsWorld = null;
  }
}