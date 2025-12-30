/**
 * 教育模块接口定义
 * Educational Module Interface Definition
 */

/**
 * 教育模块接口
 * Educational Module Interface
 * @interface IEducationalModule
 */
export const IEducationalModule = {
  /**
   * 模块标识
   * Module identifier
   * @type {string}
   */
  id: '',
  
  /**
   * 模块标题
   * Module title
   * @type {string}
   */
  title: '',
  
  /**
   * 模块描述
   * Module description
   * @type {string}
   */
  description: '',
  
  /**
   * 内容数组
   * Content array
   * @type {Object[]}
   */
  content: [],
  
  /**
   * 交互元素
   * Interactive elements
   * @type {Object[]}
   */
  interactiveElements: [],
  
  /**
   * 评估标准
   * Assessment criteria
   * @type {Object}
   */
  assessmentCriteria: {}
};

/**
 * 创建教育模块实例
 * Create educational module instance
 * @param {Object} config - 配置对象
 * @returns {IEducationalModule} 教育模块实例
 */
export function createEducationalModule(config = {}) {
  return {
    id: config.id || `module_${Date.now()}`,
    title: config.title || 'Untitled Module',
    description: config.description || '',
    content: config.content || [],
    interactiveElements: config.interactiveElements || [],
    assessmentCriteria: config.assessmentCriteria || {
      completionRequired: true,
      minimumScore: 70,
      timeLimit: null,
      attempts: 3
    }
  };
}

/**
 * 验证教育模块接口
 * Validate educational module interface
 * @param {Object} module - 要验证的模块对象
 * @returns {boolean} 是否符合接口规范
 */
export function validateEducationalModule(module) {
  if (!module || typeof module !== 'object') {
    return false;
  }
  
  const requiredFields = ['id', 'title', 'description', 'content', 'interactiveElements', 'assessmentCriteria'];
  
  for (const field of requiredFields) {
    if (!(field in module)) {
      console.warn(`EducationalModule validation failed: missing field '${field}'`);
      return false;
    }
  }
  
  // 验证字段类型
  const stringFields = ['id', 'title', 'description'];
  for (const field of stringFields) {
    if (typeof module[field] !== 'string') {
      console.warn(`EducationalModule validation failed: ${field} must be a string`);
      return false;
    }
  }
  
  const arrayFields = ['content', 'interactiveElements'];
  for (const field of arrayFields) {
    if (!Array.isArray(module[field])) {
      console.warn(`EducationalModule validation failed: ${field} must be an array`);
      return false;
    }
  }
  
  if (typeof module.assessmentCriteria !== 'object' || module.assessmentCriteria === null) {
    console.warn('EducationalModule validation failed: assessmentCriteria must be an object');
    return false;
  }
  
  return true;
}