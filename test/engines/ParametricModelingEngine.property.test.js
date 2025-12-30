/**
 * 参数化建模引擎属性测试
 * ParametricModelingEngine Property Tests
 * 
 * Feature: sophicar-3d-platform
 * Testing Properties: 6, 7, 8, 9
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { ParametricModelingEngine } from '../../src/engines/ParametricModelingEngine.js';

// Mock SceneManager for testing
class MockSceneManager {
  constructor() {
    this.objects = new Map();
    this.nextId = 1;
  }
  
  addObject(object, type) {
    const id = `${type}_${this.nextId++}`;
    this.objects.set(id, object);
    return id;
  }
  
  removeObject(object) {
    for (const [id, obj] of this.objects.entries()) {
      if (obj === object) {
        this.objects.delete(id);
        return true;
      }
    }
    return false;
  }
  
  getObject(id) {
    return this.objects.get(id);
  }
}

describe('ParametricModelingEngine Property Tests', () => {
  let sceneManager;
  let modelingEngine;

  beforeEach(() => {
    sceneManager = new MockSceneManager();
    modelingEngine = new ParametricModelingEngine(sceneManager);
  });

  /**
   * Property 6: Parameter Model Update
   * For any vehicle parameter modification, the 3D model should reflect the parameter change in its visual representation
   * Validates: Requirements 3.2
   */
  describe('Property 6: Parameter Model Update', () => {
    it('should update 3D model when parameters are modified', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成有效的参数名称和值
          fc.constantFrom('length', 'width', 'height', 'wheelbase', 'maxSpeed', 'acceleration', 'color', 'transparency'),
          fc.oneof(
            fc.double({ min: 3.0, max: 6.0 }), // length
            fc.double({ min: 1.5, max: 2.2 }), // width  
            fc.double({ min: 1.2, max: 2.0 }), // height
            fc.double({ min: 2.0, max: 3.5 }), // wheelbase
            fc.double({ min: 80, max: 300 }),  // maxSpeed
            fc.double({ min: 5.0, max: 15.0 }), // acceleration
            fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`), // color
            fc.double({ min: 0.1, max: 1.0 })  // transparency
          ),
          async (paramName, paramValue) => {
            // 首先加载模型
            await modelingEngine.loadVehicleModel('test-model');
            
            // 获取更新前的参数值
            const initialValue = modelingEngine.getParameter(paramName);
            
            // 验证参数值是否在有效范围内
            const paramConfig = modelingEngine.getParameterConfig(paramName);
            if (!paramConfig) return; // 跳过无效参数
            
            let validValue = paramValue;
            if (paramConfig.type === 'color') {
              // 确保颜色格式正确
              if (typeof paramValue === 'string' && paramValue.startsWith('#') && paramValue.length === 7) {
                validValue = paramValue;
              } else {
                validValue = '#ff0000'; // 默认红色
              }
            } else if (typeof paramValue === 'number') {
              // 确保数值在有效范围内
              validValue = Math.max(paramConfig.min, Math.min(paramConfig.max, paramValue));
            }
            
            // 更新参数
            const updateSuccess = modelingEngine.updateParameter(paramName, validValue);
            
            if (updateSuccess) {
              // 验证参数值已更新
              const updatedValue = modelingEngine.getParameter(paramName);
              if (typeof validValue === 'number' && isFinite(validValue) && isFinite(updatedValue)) {
                expect(Math.abs(updatedValue - validValue)).toBeLessThan(0.01);
              } else {
                expect(updatedValue).toBe(validValue);
              }
              
              // 验证模型存在且可访问
              expect(modelingEngine.currentModel).toBeTruthy();
              
              // 验证模型几何体已更新（通过检查相关组件）
              if (['length', 'width', 'height'].includes(paramName)) {
                const body = modelingEngine.currentModel.getObjectByName('VehicleBody');
                expect(body).toBeTruthy();
                expect(body.geometry).toBeTruthy();
              }
              
              if (paramName === 'wheelbase') {
                // 验证车轮位置已更新
                const wheel0 = modelingEngine.currentModel.getObjectByName('Wheel_0');
                expect(wheel0).toBeTruthy();
                expect(wheel0.position).toBeTruthy();
              }
              
              if (paramName === 'color') {
                const body = modelingEngine.currentModel.getObjectByName('VehicleBody');
                expect(body).toBeTruthy();
                expect(body.material.color).toBeTruthy();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Geometry Update Consistency  
   * For any parameter change that affects vehicle geometry, the 3D visualization should update the affected geometric elements
   * Validates: Requirements 3.3
   */
  describe('Property 7: Geometry Update Consistency', () => {
    it('should consistently update geometric elements when geometry-affecting parameters change', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成影响几何体的参数组合
          fc.record({
            length: fc.double({ min: 3.0, max: 6.0, noNaN: true }),
            width: fc.double({ min: 1.5, max: 2.2, noNaN: true }),
            height: fc.double({ min: 1.2, max: 2.0, noNaN: true }),
            wheelbase: fc.double({ min: 2.0, max: 3.5, noNaN: true })
          }),
          async (geometryParams) => {
            // 加载模型
            await modelingEngine.loadVehicleModel('test-model');
            
            // 记录初始几何体状态
            const body = modelingEngine.currentModel.getObjectByName('VehicleBody');
            const initialGeometry = body.geometry;
            
            // 应用几何参数变更
            for (const [paramName, value] of Object.entries(geometryParams)) {
              modelingEngine.updateParameter(paramName, value);
            }
            
            // 验证几何体已更新
            const updatedBody = modelingEngine.currentModel.getObjectByName('VehicleBody');
            expect(updatedBody).toBeTruthy();
            
            // 验证几何体对象已更换（因为BoxGeometry被重新创建）
            expect(updatedBody.geometry).not.toBe(initialGeometry);
            
            // 验证车轮位置与轴距参数一致
            const wheel0 = modelingEngine.currentModel.getObjectByName('Wheel_0');
            const wheel2 = modelingEngine.currentModel.getObjectByName('Wheel_2');
            
            if (wheel0 && wheel2) {
              const actualWheelbase = Math.abs(wheel0.position.x - wheel2.position.x);
              const expectedWheelbase = geometryParams.wheelbase;
              
              // 允许小的浮点误差
              expect(Math.abs(actualWheelbase - expectedWheelbase)).toBeLessThan(0.001);
            }
            
            // 验证车身位置与高度参数一致
            const expectedBodyY = geometryParams.height / 2;
            expect(Math.abs(updatedBody.position.y - expectedBodyY)).toBeLessThan(0.001);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Parameter Constraint Enforcement
   * For any set of parameter modifications, the system should enforce all defined constraints and relationships between parameters
   * Validates: Requirements 3.4
   */
  describe('Property 8: Parameter Constraint Enforcement', () => {
    it('should enforce wheelbase constraint based on length', async () => {
      // 加载模型
      await modelingEngine.loadVehicleModel('test-model');
      
      // 测试约束：轴距不能超过车长的80%
      modelingEngine.updateParameter('length', 5.0);
      modelingEngine.updateParameter('wheelbase', 4.5); // 超出约束的值
      
      const actualLength = modelingEngine.getParameter('length');
      const actualWheelbase = modelingEngine.getParameter('wheelbase');
      const maxAllowedWheelbase = actualLength * 0.8; // 5.0 * 0.8 = 4.0
      
      // 轴距应该被约束到不超过车长的80%
      expect(actualWheelbase).toBeLessThanOrEqual(maxAllowedWheelbase);
      expect(actualWheelbase).toBeLessThanOrEqual(3.5); // 系统最大值
      expect(actualWheelbase).toBeGreaterThanOrEqual(2.0); // 系统最小值
    });
    
    it('should maintain parameter ranges', async () => {
      // 加载模型
      await modelingEngine.loadVehicleModel('test-model');
      
      // 验证所有参数都在有效范围内
      const allParams = modelingEngine.getAllParameters();
      for (const [name, config] of allParams.entries()) {
        if (typeof config.value === 'number' && config.min !== undefined && config.max !== undefined) {
          expect(config.value).toBeGreaterThanOrEqual(config.min);
          expect(config.value).toBeLessThanOrEqual(config.max);
        }
      }
    });
  });

  /**
   * Property 9: Undo/Redo State Consistency
   * For any sequence of parameter modifications, applying undo operations should restore previous states, and redo should reapply changes
   * Validates: Requirements 3.5
   */
  describe('Property 9: Undo/Redo State Consistency', () => {
    it('should maintain consistent state through undo/redo operations', async () => {
      // 加载模型
      await modelingEngine.loadVehicleModel('test-model');
      
      // 记录初始状态
      const initialLength = modelingEngine.getParameter('length');
      
      // 应用变更 - 确保值确实不同
      const newLength = initialLength + 1.0;
      modelingEngine.updateParameter('length', newLength);
      expect(Math.abs(modelingEngine.getParameter('length') - newLength)).toBeLessThan(0.01);
      expect(modelingEngine.canUndo()).toBe(true);
      
      // 撤销
      modelingEngine.undo();
      expect(Math.abs(modelingEngine.getParameter('length') - initialLength)).toBeLessThan(0.01);
      expect(modelingEngine.canUndo()).toBe(false);
      expect(modelingEngine.canRedo()).toBe(true);
      
      // 重做
      modelingEngine.redo();
      expect(Math.abs(modelingEngine.getParameter('length') - newLength)).toBeLessThan(0.01);
      expect(modelingEngine.canUndo()).toBe(true);
      expect(modelingEngine.canRedo()).toBe(false);
    });
    
    it('should correctly report undo/redo availability', async () => {
      // 创建新的引擎实例以确保干净状态
      const freshEngine = new ParametricModelingEngine(sceneManager);
      await freshEngine.loadVehicleModel('test-model');
      
      // 初始状态：应该不能撤销，不能重做
      expect(freshEngine.canUndo()).toBe(false);
      expect(freshEngine.canRedo()).toBe(false);
      
      // 获取初始值并确保变更值不同
      const initialLength = freshEngine.getParameter('length');
      const newLength = initialLength + 1.0;
      
      // 应用一个变更
      freshEngine.updateParameter('length', newLength);
      
      // 应该能撤销，不能重做
      expect(freshEngine.canUndo()).toBe(true);
      expect(freshEngine.canRedo()).toBe(false);
      
      // 撤销
      freshEngine.undo();
      
      // 应该不能撤销，能重做
      expect(freshEngine.canUndo()).toBe(false);
      expect(freshEngine.canRedo()).toBe(true);
      
      // 重做
      freshEngine.redo();
      
      // 应该能撤销，不能重做
      expect(freshEngine.canUndo()).toBe(true);
      expect(freshEngine.canRedo()).toBe(false);
    });
  });

  // 辅助测试：验证基本功能
  describe('Basic Functionality Tests', () => {
    it('should initialize with default parameters', () => {
      const params = modelingEngine.getAllParameters();
      expect(params.size).toBeGreaterThan(0);
      
      // 验证关键参数存在
      expect(params.has('length')).toBe(true);
      expect(params.has('width')).toBe(true);
      expect(params.has('height')).toBe(true);
      expect(params.has('wheelbase')).toBe(true);
    });
    
    it('should load vehicle model successfully', async () => {
      const modelId = await modelingEngine.loadVehicleModel('test-model');
      expect(modelId).toBeTruthy();
      expect(modelingEngine.currentModel).toBeTruthy();
      expect(modelingEngine.currentModel.name).toBe('VehicleModel');
    });
    
    it('should export and import configuration', async () => {
      await modelingEngine.loadVehicleModel('test-model');
      
      // 修改一些参数
      modelingEngine.updateParameter('length', 5.0);
      modelingEngine.updateParameter('color', '#00ff00');
      
      // 导出配置
      const config = modelingEngine.exportModelConfiguration();
      expect(config).toBeTruthy();
      expect(config.parameters).toBeTruthy();
      expect(config.parameters.length.value).toBe(5.0);
      expect(config.parameters.color.value).toBe('#00ff00');
      
      // 重置参数
      modelingEngine.resetToDefaults();
      expect(modelingEngine.getParameter('length')).not.toBe(5.0);
      
      // 导入配置
      const importSuccess = modelingEngine.importModelConfiguration(config);
      expect(importSuccess).toBe(true);
      expect(modelingEngine.getParameter('length')).toBe(5.0);
      expect(modelingEngine.getParameter('color')).toBe('#00ff00');
    });
  });
});