/**
 * 车辆模型接口定义
 * Vehicle Model Interface Definition
 */

/**
 * 车辆模型接口
 * Vehicle Model Interface
 * @interface IVehicleModel
 */
export const IVehicleModel = {
  /**
   * 模型唯一标识
   * Model unique identifier
   * @type {string}
   */
  id: '',
  
  /**
   * 模型名称
   * Model name
   * @type {string}
   */
  name: '',
  
  /**
   * 3D几何体
   * 3D geometry
   * @type {THREE.Geometry}
   */
  geometry: null,
  
  /**
   * 材质数组
   * Materials array
   * @type {THREE.Material[]}
   */
  materials: [],
  
  /**
   * 参数映射
   * Parameters mapping
   * @type {Map<string, number>}
   */
  parameters: new Map(),
  
  /**
   * 参数约束
   * Parameter constraints
   * @type {Object}
   */
  constraints: {}
};

/**
 * 创建车辆模型实例
 * Create vehicle model instance
 * @param {Object} config - 配置对象
 * @returns {IVehicleModel} 车辆模型实例
 */
export function createVehicleModel(config = {}) {
  return {
    id: config.id || `vehicle_${Date.now()}`,
    name: config.name || 'Untitled Vehicle',
    geometry: config.geometry || null,
    materials: config.materials || [],
    parameters: config.parameters || new Map(),
    constraints: config.constraints || {}
  };
}

/**
 * 验证车辆模型接口
 * Validate vehicle model interface
 * @param {Object} model - 要验证的模型对象
 * @returns {boolean} 是否符合接口规范
 */
export function validateVehicleModel(model) {
  if (!model || typeof model !== 'object') {
    return false;
  }
  
  const requiredFields = ['id', 'name', 'geometry', 'materials', 'parameters', 'constraints'];
  
  for (const field of requiredFields) {
    if (!(field in model)) {
      console.warn(`VehicleModel validation failed: missing field '${field}'`);
      return false;
    }
  }
  
  // 验证字段类型
  if (typeof model.id !== 'string' || typeof model.name !== 'string') {
    console.warn('VehicleModel validation failed: id and name must be strings');
    return false;
  }
  
  if (!Array.isArray(model.materials)) {
    console.warn('VehicleModel validation failed: materials must be an array');
    return false;
  }
  
  if (!(model.parameters instanceof Map)) {
    console.warn('VehicleModel validation failed: parameters must be a Map');
    return false;
  }
  
  return true;
}