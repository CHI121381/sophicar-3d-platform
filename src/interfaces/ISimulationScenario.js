/**
 * 仿真场景接口定义
 * Simulation Scenario Interface Definition
 */

/**
 * 仿真场景接口
 * Simulation Scenario Interface
 * @interface ISimulationScenario
 */
export const ISimulationScenario = {
  /**
   * 场景标识
   * Scenario identifier
   * @type {string}
   */
  id: '',
  
  /**
   * 场景名称
   * Scenario name
   * @type {string}
   */
  name: '',
  
  /**
   * 环境设置
   * Environment settings
   * @type {Object}
   */
  environment: {},
  
  /**
   * 初始条件
   * Initial conditions
   * @type {Object}
   */
  initialConditions: {},
  
  /**
   * 物理设置
   * Physics settings
   * @type {Object}
   */
  physicsSettings: {},
  
  /**
   * 预期结果
   * Expected outcomes
   * @type {Object}
   */
  expectedOutcomes: {}
};

/**
 * 创建仿真场景实例
 * Create simulation scenario instance
 * @param {Object} config - 配置对象
 * @returns {ISimulationScenario} 仿真场景实例
 */
export function createSimulationScenario(config = {}) {
  return {
    id: config.id || `scenario_${Date.now()}`,
    name: config.name || 'Untitled Scenario',
    environment: config.environment || {
      terrain: 'flat',
      weather: 'clear',
      lighting: 'daylight',
      temperature: 20,
      humidity: 50
    },
    initialConditions: config.initialConditions || {
      vehiclePosition: { x: 0, y: 0, z: 0 },
      vehicleVelocity: { x: 0, y: 0, z: 0 },
      vehicleRotation: { x: 0, y: 0, z: 0 }
    },
    physicsSettings: config.physicsSettings || {
      gravity: -9.81,
      friction: 0.7,
      airResistance: 0.3,
      timeStep: 1/60
    },
    expectedOutcomes: config.expectedOutcomes || {
      maxSpeed: null,
      stoppingDistance: null,
      energyConsumption: null
    }
  };
}

/**
 * 验证仿真场景接口
 * Validate simulation scenario interface
 * @param {Object} scenario - 要验证的场景对象
 * @returns {boolean} 是否符合接口规范
 */
export function validateSimulationScenario(scenario) {
  if (!scenario || typeof scenario !== 'object') {
    return false;
  }
  
  const requiredFields = ['id', 'name', 'environment', 'initialConditions', 'physicsSettings', 'expectedOutcomes'];
  
  for (const field of requiredFields) {
    if (!(field in scenario)) {
      console.warn(`SimulationScenario validation failed: missing field '${field}'`);
      return false;
    }
  }
  
  // 验证字段类型
  if (typeof scenario.id !== 'string' || typeof scenario.name !== 'string') {
    console.warn('SimulationScenario validation failed: id and name must be strings');
    return false;
  }
  
  const objectFields = ['environment', 'initialConditions', 'physicsSettings', 'expectedOutcomes'];
  for (const field of objectFields) {
    if (typeof scenario[field] !== 'object' || scenario[field] === null) {
      console.warn(`SimulationScenario validation failed: ${field} must be an object`);
      return false;
    }
  }
  
  return true;
}