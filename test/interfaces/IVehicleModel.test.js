/**
 * IVehicleModel 接口测试
 * IVehicleModel interface tests
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createVehicleModel, validateVehicleModel } from '../../src/interfaces/IVehicleModel.js';

describe('IVehicleModel Interface', () => {
  describe('createVehicleModel', () => {
    it('应该创建具有默认值的车辆模型', () => {
      const model = createVehicleModel();
      
      expect(model.id).toMatch(/^vehicle_\d+$/);
      expect(model.name).toBe('Untitled Vehicle');
      expect(model.geometry).toBeNull();
      expect(Array.isArray(model.materials)).toBe(true);
      expect(model.parameters).toBeInstanceOf(Map);
      expect(typeof model.constraints).toBe('object');
    });

    it('应该使用提供的配置创建车辆模型', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const materials = [new THREE.MeshBasicMaterial({ color: 0xff0000 })];
      const parameters = new Map([['length', 4.5], ['width', 1.8]]);
      const constraints = { maxLength: 6.0 };
      
      const config = {
        id: 'test-vehicle',
        name: 'Test Vehicle',
        geometry,
        materials,
        parameters,
        constraints
      };
      
      const model = createVehicleModel(config);
      
      expect(model.id).toBe('test-vehicle');
      expect(model.name).toBe('Test Vehicle');
      expect(model.geometry).toBe(geometry);
      expect(model.materials).toBe(materials);
      expect(model.parameters).toBe(parameters);
      expect(model.constraints).toBe(constraints);
    });
  });

  describe('validateVehicleModel', () => {
    it('应该验证有效的车辆模型', () => {
      const validModel = createVehicleModel({
        id: 'valid-model',
        name: 'Valid Model'
      });
      
      expect(validateVehicleModel(validModel)).toBe(true);
    });

    it('应该拒绝null或undefined', () => {
      expect(validateVehicleModel(null)).toBe(false);
      expect(validateVehicleModel(undefined)).toBe(false);
    });

    it('应该拒绝非对象类型', () => {
      expect(validateVehicleModel('string')).toBe(false);
      expect(validateVehicleModel(123)).toBe(false);
      expect(validateVehicleModel([])).toBe(false);
    });

    it('应该拒绝缺少必需字段的模型', () => {
      const incompleteModel = {
        id: 'test',
        name: 'Test'
        // 缺少其他必需字段
      };
      
      expect(validateVehicleModel(incompleteModel)).toBe(false);
    });

    it('应该拒绝字段类型错误的模型', () => {
      const invalidModel = {
        id: 123, // 应该是字符串
        name: 'Test',
        geometry: null,
        materials: 'not-array', // 应该是数组
        parameters: {}, // 应该是Map
        constraints: {}
      };
      
      expect(validateVehicleModel(invalidModel)).toBe(false);
    });

    it('应该拒绝parameters不是Map的模型', () => {
      const invalidModel = createVehicleModel();
      invalidModel.parameters = {}; // 不是Map
      
      expect(validateVehicleModel(invalidModel)).toBe(false);
    });
  });
});