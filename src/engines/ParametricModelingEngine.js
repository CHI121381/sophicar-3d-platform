/**
 * 参数化建模引擎 - 处理模型参数调整和实时更新
 * ParametricModelingEngine - Handle model parameter adjustments and real-time updates
 */
import * as THREE from 'three';

export class ParametricModelingEngine {
  /**
   * 构造函数 - 初始化参数化建模引擎
   * Constructor - Initialize parametric modeling engine
   * @param {SceneManager} sceneManager - 场景管理器
   */
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.currentModel = null;
    this.parameters = new Map();
    this.constraints = new Map();
    this.parameterHistory = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;
    
    // 默认车辆参数
    this.defaultParameters = {
      // 尺寸参数
      length: { value: 4.5, min: 3.0, max: 6.0, step: 0.1, unit: 'm' },
      width: { value: 1.8, min: 1.5, max: 2.2, step: 0.05, unit: 'm' },
      height: { value: 1.5, min: 1.2, max: 2.0, step: 0.05, unit: 'm' },
      wheelbase: { value: 2.7, min: 2.0, max: 3.5, step: 0.1, unit: 'm' },
      
      // 性能参数
      maxSpeed: { value: 180, min: 80, max: 300, step: 5, unit: 'km/h' },
      acceleration: { value: 8.5, min: 5.0, max: 15.0, step: 0.1, unit: 'm/s²' },
      brakingDistance: { value: 35, min: 20, max: 60, step: 1, unit: 'm' },
      
      // 视觉参数
      color: { value: '#ff0000', type: 'color' },
      material: { value: 'metallic', options: ['metallic', 'matte', 'glossy'], type: 'select' },
      transparency: { value: 1.0, min: 0.1, max: 1.0, step: 0.1, unit: '' }
    };
    
    this.initializeParameters();
  }

  /**
   * 初始化参数系统
   * Initialize parameter system
   */
  initializeParameters() {
    // 复制默认参数到当前参数
    for (const [key, config] of Object.entries(this.defaultParameters)) {
      this.parameters.set(key, { ...config });
    }
    
    // 设置参数约束关系
    this.setupParameterConstraints();
    
    // 初始化历史记录但不保存初始状态（避免初始就能撤销）
    this.parameterHistory = [];
    this.historyIndex = -1;
  }

  /**
   * 设置参数约束关系
   * Set up parameter constraints
   */
  setupParameterConstraints() {
    // 轴距不能超过车长的80%
    this.constraints.set('wheelbase_length', {
      dependent: 'wheelbase',
      independent: 'length',
      constraint: (wheelbase, length) => wheelbase <= length * 0.8,
      adjust: (length) => Math.min(this.parameters.get('wheelbase').value, length * 0.8)
    });
    
    // 车宽影响最大速度（空气动力学）
    this.constraints.set('width_maxSpeed', {
      dependent: 'maxSpeed',
      independent: 'width',
      constraint: (maxSpeed, width) => true, // 总是有效，但会影响性能
      adjust: (width) => {
        const baseSpeed = 180;
        const widthFactor = 1.8 / width; // 基准宽度1.8m
        return Math.min(300, baseSpeed * widthFactor);
      }
    });
  }

  /**
   * 加载车辆模型
   * Load vehicle model
   * @param {string} modelPath - 模型文件路径
   * @returns {Promise<string>} 模型对象ID
   */
  async loadVehicleModel(modelPath) {
    try {
      // 不再创建可视化的车辆几何体，只初始化参数
      // 实际的车辆模型将由外部系统（如真实的FBX模型）提供
      console.log(`ParametricModelingEngine: 参数化建模引擎已准备就绪，模型路径: ${modelPath}`);
      
      // 返回一个虚拟的模型ID，表示参数系统已就绪
      return 'parametric_system_ready';
      
    } catch (error) {
      console.error('ParametricModelingEngine: 模型加载失败', error);
      throw error;
    }
  }

  /**
   * 更新参数值
   * Update parameter value
   * @param {string} name - 参数名称
   * @param {*} value - 参数值
   * @returns {boolean} 更新是否成功
   */
  updateParameter(name, value) {
    if (!this.parameters.has(name)) {
      console.warn(`ParametricModelingEngine: 未知参数 ${name}`);
      return false;
    }
    
    const parameter = this.parameters.get(name);
    
    // 验证参数值
    if (!this.validateParameterValue(name, value)) {
      console.warn(`ParametricModelingEngine: 参数值无效 ${name}=${value}`);
      return false;
    }
    
    // 检查值是否真正改变
    const valueChanged = (typeof value === 'number' && typeof parameter.value === 'number') 
      ? Math.abs(parameter.value - value) > 1e-6 
      : parameter.value !== value;
    
    if (valueChanged) {
      // 如果这是第一次更新，先保存初始状态
      if (this.parameterHistory.length === 0) {
        this.saveParameterState();
      }
      
      // 更新参数值
      parameter.value = value;
      
      // 应用约束调整
      this.applyConstraints(name);
      
      // 保存更新后的状态到历史记录
      this.saveParameterState();
      
      // 更新模型
      this.updateModelGeometry();
    }
    
    return true;
  }

  /**
   * 验证参数值
   * Validate parameter value
   * @param {string} name - 参数名称
   * @param {*} value - 参数值
   * @returns {boolean} 是否有效
   */
  validateParameterValue(name, value) {
    const parameter = this.parameters.get(name);
    
    if (parameter.type === 'color') {
      return /^#[0-9A-F]{6}$/i.test(value);
    }
    
    if (parameter.type === 'select') {
      return parameter.options.includes(value);
    }
    
    if (typeof value === 'number') {
      // 检查是否为有效数字
      if (!isFinite(value)) {
        return false;
      }
      // 使用更宽松的浮点数比较，允许小的精度误差
      return value >= (parameter.min - 1e-10) && value <= (parameter.max + 1e-10);
    }
    
    return true;
  }

  /**
   * 应用参数约束
   * Apply parameter constraints
   * @param {string} changedParameter - 改变的参数名称
   */
  applyConstraints(changedParameter) {
    for (const [constraintId, constraint] of this.constraints.entries()) {
      if (constraint.independent === changedParameter) {
        const independentValue = this.parameters.get(changedParameter).value;
        
        // 确保独立值是有效数字
        if (!isFinite(independentValue)) {
          continue;
        }
        
        const newValue = constraint.adjust(independentValue);
        const dependentParam = this.parameters.get(constraint.dependent);
        
        // 确保调整后的值是有效数字
        if (!isFinite(newValue)) {
          continue;
        }
        
        // 确保调整后的值在有效范围内
        const clampedValue = Math.max(dependentParam.min, Math.min(dependentParam.max, newValue));
        dependentParam.value = clampedValue;
      }
    }
  }

  /**
   * 应用参数变更到模型
   * Apply parameter changes to model
   */
  applyParameterChanges() {
    if (!this.currentModel) {
      console.warn('ParametricModelingEngine: 没有加载的模型');
      return;
    }
    
    this.updateModelGeometry();
  }

  /**
   * 更新模型几何体
   * Update model geometry
   */
  updateModelGeometry() {
    if (!this.currentModel) return;
    
    // 更新车身
    const body = this.currentModel.getObjectByName('VehicleBody');
    if (body) {
      // 更新几何体尺寸
      body.geometry.dispose();
      body.geometry = new THREE.BoxGeometry(
        this.parameters.get('length').value,
        this.parameters.get('height').value,
        this.parameters.get('width').value
      );
      
      // 更新位置
      body.position.y = this.parameters.get('height').value / 2;
      
      // 更新材质
      body.material.color.setStyle(this.parameters.get('color').value);
      body.material.transparent = this.parameters.get('transparency').value < 1.0;
      body.material.opacity = this.parameters.get('transparency').value;
    }
    
    // 更新车轮位置
    const wheelPositions = [
      { x: this.parameters.get('wheelbase').value / 2, z: this.parameters.get('width').value / 2 - 0.1 },
      { x: this.parameters.get('wheelbase').value / 2, z: -this.parameters.get('width').value / 2 + 0.1 },
      { x: -this.parameters.get('wheelbase').value / 2, z: this.parameters.get('width').value / 2 - 0.1 },
      { x: -this.parameters.get('wheelbase').value / 2, z: -this.parameters.get('width').value / 2 + 0.1 }
    ];
    
    wheelPositions.forEach((pos, index) => {
      const wheel = this.currentModel.getObjectByName(`Wheel_${index}`);
      if (wheel) {
        wheel.position.set(pos.x, wheel.position.y, pos.z);
      }
    });
  }

  /**
   * 导出模型配置
   * Export model configuration
   * @returns {Object} 模型配置数据
   */
  exportModelConfiguration() {
    const config = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        type: 'vehicle_configuration'
      },
      parameters: {},
      constraints: Array.from(this.constraints.entries())
    };
    
    // 导出所有参数
    for (const [name, parameter] of this.parameters.entries()) {
      config.parameters[name] = {
        value: parameter.value,
        min: parameter.min,
        max: parameter.max,
        step: parameter.step,
        unit: parameter.unit,
        type: parameter.type
      };
    }
    
    return config;
  }

  /**
   * 导入模型配置
   * Import model configuration
   * @param {Object} config - 配置数据
   * @returns {boolean} 导入是否成功
   */
  importModelConfiguration(config) {
    try {
      if (!config.parameters) {
        throw new Error('配置数据格式无效');
      }
      
      // 保存当前状态
      this.saveParameterState();
      
      // 导入参数
      for (const [name, paramConfig] of Object.entries(config.parameters)) {
        if (this.parameters.has(name)) {
          const parameter = this.parameters.get(name);
          parameter.value = paramConfig.value;
        }
      }
      
      // 应用所有约束
      for (const [name] of this.parameters.entries()) {
        this.applyConstraints(name);
      }
      
      // 更新模型
      this.updateModelGeometry();
      
      return true;
      
    } catch (error) {
      console.error('ParametricModelingEngine: 配置导入失败', error);
      return false;
    }
  }

  /**
   * 重置为默认参数
   * Reset to default parameters
   */
  resetToDefaults() {
    // 保存当前状态
    this.saveParameterState();
    
    // 重置所有参数
    for (const [key, config] of Object.entries(this.defaultParameters)) {
      this.parameters.get(key).value = config.value;
    }
    
    // 更新模型
    this.updateModelGeometry();
  }

  /**
   * 保存参数状态到历史记录
   * Save parameter state to history
   */
  saveParameterState() {
    const state = {};
    for (const [name, parameter] of this.parameters.entries()) {
      state[name] = parameter.value;
    }
    
    // 移除当前索引之后的历史记录
    this.parameterHistory = this.parameterHistory.slice(0, this.historyIndex + 1);
    
    // 添加新状态
    this.parameterHistory.push(state);
    this.historyIndex = this.parameterHistory.length - 1;
    
    // 限制历史记录大小
    if (this.parameterHistory.length > this.maxHistorySize) {
      this.parameterHistory.shift();
      this.historyIndex--;
    }
  }

  /**
   * 撤销操作
   * Undo operation
   * @returns {boolean} 撤销是否成功
   */
  undo() {
    if (this.historyIndex <= 0) {
      return false;
    }
    
    this.historyIndex--;
    const state = this.parameterHistory[this.historyIndex];
    
    // 恢复参数状态
    for (const [name, value] of Object.entries(state)) {
      if (this.parameters.has(name)) {
        this.parameters.get(name).value = value;
      }
    }
    
    // 更新模型
    this.updateModelGeometry();
    
    return true;
  }

  /**
   * 重做操作
   * Redo operation
   * @returns {boolean} 重做是否成功
   */
  redo() {
    if (this.historyIndex >= this.parameterHistory.length - 1) {
      return false;
    }
    
    this.historyIndex++;
    const state = this.parameterHistory[this.historyIndex];
    
    // 恢复参数状态
    for (const [name, value] of Object.entries(state)) {
      if (this.parameters.has(name)) {
        this.parameters.get(name).value = value;
      }
    }
    
    // 更新模型
    this.updateModelGeometry();
    
    return true;
  }

  /**
   * 获取参数值
   * Get parameter value
   * @param {string} name - 参数名称
   * @returns {*} 参数值
   */
  getParameter(name) {
    const parameter = this.parameters.get(name);
    return parameter ? parameter.value : null;
  }

  /**
   * 获取所有参数
   * Get all parameters
   * @returns {Map<string, Object>} 参数映射
   */
  getAllParameters() {
    return new Map(this.parameters);
  }

  /**
   * 获取参数配置
   * Get parameter configuration
   * @param {string} name - 参数名称
   * @returns {Object|null} 参数配置
   */
  getParameterConfig(name) {
    return this.parameters.get(name) || null;
  }

  /**
   * 检查是否可以撤销
   * Check if undo is available
   * @returns {boolean}
   */
  canUndo() {
    return this.historyIndex > 0;
  }

  /**
   * 检查是否可以重做
   * Check if redo is available
   * @returns {boolean}
   */
  canRedo() {
    return this.historyIndex < this.parameterHistory.length - 1;
  }

  /**
   * 销毁建模引擎
   * Destroy modeling engine
   */
  destroy() {
    if (this.currentModel) {
      this.sceneManager.removeObject(this.currentModel);
      this.currentModel = null;
    }
    
    this.parameters.clear();
    this.constraints.clear();
    this.parameterHistory = [];
    this.historyIndex = -1;
  }
}