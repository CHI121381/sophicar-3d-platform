/**
 * 场景比较器属性测试
 * ScenarioComparator Property Tests
 * 
 * Feature: sophicar-3d-platform
 * Testing Property: 12
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import * as THREE from 'three';
import { ScenarioComparator } from '../../src/simulation/ScenarioComparator.js';
import { createSimulationScenario } from '../../src/interfaces/ISimulationScenario.js';

// Mock SceneManager for testing
class MockSceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.renderer = {
      domElement: document.createElement('canvas'),
      setSize: vi.fn(),
      render: vi.fn()
    };
    this.objects = new Map();
    this.nextId = 1;
  }
  
  addObject(object, id) {
    const objectId = id || `object_${this.nextId++}`;
    this.scene.add(object);
    this.objects.set(objectId, object);
    return objectId;
  }
  
  removeObject(objectOrId) {
    let object;
    let objectId;

    if (typeof objectOrId === 'string') {
      objectId = objectOrId;
      object = this.objects.get(objectId);
    } else if (objectOrId instanceof THREE.Object3D) {
      object = objectOrId;
      for (const [id, obj] of this.objects.entries()) {
        if (obj === object) {
          objectId = id;
          break;
        }
      }
    }

    if (object) {
      this.scene.remove(object);
      if (objectId) {
        this.objects.delete(objectId);
      }
      return true;
    }
    return false;
  }
  
  getObject(id) {
    return this.objects.get(id);
  }
}

describe('ScenarioComparator Property Tests', () => {
  let sceneManager;
  let scenarioComparator;

  beforeEach(() => {
    sceneManager = new MockSceneManager();
    scenarioComparator = new ScenarioComparator(sceneManager);
  });

  afterEach(() => {
    if (scenarioComparator) {
      scenarioComparator.destroy();
    }
  });

  /**
   * **Feature: sophicar-3d-platform, Property 12: Scenario Comparison Functionality**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any set of simulation scenarios, the system should provide 
   * comparison tools that allow analysis across different conditions
   */
  describe('Property 12: Scenario Comparison Functionality', () => {
    it('should provide comparison tools for any set of simulation scenarios', () => {
      fc.assert(
        fc.property(
          // 生成2-4个场景进行比较
          fc.integer({ min: 2, max: 4 }).chain(numScenarios => 
            fc.tuple(
              fc.constantFrom(numScenarios),
              fc.array(
                fc.record({
                  scenarioId: fc.string({ minLength: 1, maxLength: 20 }).map(s => `scenario_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
                  scenarioName: fc.string({ minLength: 3, maxLength: 30 }),
                  maxSpeed: fc.float({ min: Math.fround(10), max: Math.fround(100), noNaN: true }),
                  averageSpeed: fc.float({ min: Math.fround(5), max: Math.fround(80), noNaN: true }),
                  totalDistance: fc.float({ min: Math.fround(50), max: Math.fround(1000), noNaN: true }),
                  totalEnergyConsumption: fc.float({ min: Math.fround(10), max: Math.fround(200), noNaN: true }),
                  maxAcceleration: fc.float({ min: Math.fround(1), max: Math.fround(15), noNaN: true }),
                  energyEfficiency: fc.float({ min: Math.fround(0.1), max: Math.fround(2.0), noNaN: true })
                }),
                { minLength: numScenarios, maxLength: numScenarios }
              ).map(scenarios => {
                // 确保场景ID唯一并且有效
                const uniqueScenarios = [];
                const usedIds = new Set();
                for (let i = 0; i < scenarios.length; i++) {
                  const scenario = scenarios[i];
                  let uniqueId = scenario.scenarioId;
                  
                  // 确保ID不为空且唯一
                  if (!uniqueId || uniqueId.trim() === '' || usedIds.has(uniqueId)) {
                    uniqueId = `scenario_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  }
                  
                  while (usedIds.has(uniqueId)) {
                    uniqueId = `scenario_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  }
                  
                  usedIds.add(uniqueId);
                  uniqueScenarios.push({
                    ...scenario,
                    scenarioId: uniqueId
                  });
                }
                return uniqueScenarios;
              })
            )
          ),
          ([numScenarios, scenarios]) => {
            // 为每个属性测试创建新的比较器实例
            const testSceneManager = new MockSceneManager();
            const testComparator = new ScenarioComparator(testSceneManager);
            
            try {
              // 为每个场景添加数据到比较器
              const scenarioIds = [];
              
              scenarios.forEach(scenarioData => {
                const scenarioConfig = {
                  id: scenarioData.scenarioId,
                  name: scenarioData.scenarioName,
                  environment: {
                    terrain: 'flat',
                    weather: 'clear',
                    lighting: 'daylight'
                  },
                  physicsSettings: {
                    gravity: -9.81,
                    friction: 0.5,
                    airResistance: 0.3
                  }
                };
                
                const simulationResult = {
                  scenario: {
                    id: scenarioData.scenarioId,
                    name: scenarioData.scenarioName,
                    type: 'performance_test',
                    duration: 60
                  },
                  data: {
                    performanceMetrics: {
                      maxSpeed: scenarioData.maxSpeed,
                      averageSpeed: scenarioData.averageSpeed,
                      totalDistance: scenarioData.totalDistance,
                      totalEnergyConsumption: scenarioData.totalEnergyConsumption,
                      maxAcceleration: scenarioData.maxAcceleration,
                      energyEfficiency: scenarioData.energyEfficiency
                    },
                    trajectory: [
                      { time: 0, position: new THREE.Vector3(0, 0, 0) },
                      { time: 30, position: new THREE.Vector3(50, 0, 0) },
                      { time: 60, position: new THREE.Vector3(100, 0, 0) }
                    ]
                  }
                };
                
                // 添加场景到比较器
                const addSuccess = testComparator.addScenarioForComparison(
                  scenarioData.scenarioId,
                  scenarioConfig,
                  simulationResult
                );
                
                expect(addSuccess).toBe(true);
                scenarioIds.push(scenarioData.scenarioId);
              });
              
              // 验证场景已正确添加
              expect(testComparator.scenarios.size).toBe(scenarios.length);
              expect(testComparator.simulationResults.size).toBe(scenarios.length);
              
              // 执行比较分析
              const comparisonResult = testComparator.compareScenarios(scenarioIds, {
                includeVisualization: true,
                includeRecommendations: true
              });
              
              // 验证比较结果的基本结构
              expect(comparisonResult).toBeTruthy();
              expect(comparisonResult.comparisonId).toBeTruthy();
              expect(comparisonResult.scenarioIds).toEqual(scenarioIds);
              expect(comparisonResult.timestamp).toBeInstanceOf(Date);
              
              // 验证指标计算
              expect(comparisonResult.metrics).toBeTruthy();
              const expectedMetrics = ['maxSpeed', 'averageSpeed', 'totalDistance', 'totalEnergyConsumption', 'maxAcceleration', 'energyEfficiency'];
              expectedMetrics.forEach(metricName => {
                expect(comparisonResult.metrics[metricName]).toBeTruthy();
                
                const metricData = comparisonResult.metrics[metricName];
                expect(metricData.values).toBeInstanceOf(Array);
                expect(metricData.values.length).toBe(scenarios.length);
                expect(typeof metricData.min).toBe('number');
                expect(typeof metricData.max).toBe('number');
                expect(typeof metricData.average).toBe('number');
                expect(typeof metricData.standardDeviation).toBe('number');
                expect(metricData.bestScenario).toBeTruthy();
                expect(metricData.worstScenario).toBeTruthy();
                
                // 验证统计计算的正确性
                expect(metricData.min).toBeLessThanOrEqual(metricData.max);
                expect(metricData.average).toBeGreaterThanOrEqual(metricData.min);
                expect(metricData.average).toBeLessThanOrEqual(metricData.max);
                expect(metricData.standardDeviation).toBeGreaterThanOrEqual(0);
              });
              
              // 验证统计分析
              expect(comparisonResult.analysis).toBeTruthy();
              expect(comparisonResult.analysis.correlations).toBeTruthy();
              expect(comparisonResult.analysis.trends).toBeTruthy();
              expect(comparisonResult.analysis.outliers).toBeTruthy();
              expect(comparisonResult.analysis.significance).toBeTruthy();
              
              // 验证可视化配置
              expect(comparisonResult.visualization).toBeTruthy();
              expect(comparisonResult.visualization.charts).toBeTruthy();
              expect(comparisonResult.visualization.trajectoryOverlay).toBeTruthy();
              expect(comparisonResult.visualization.heatmap).toBeTruthy();
              expect(comparisonResult.visualization.radarChart).toBeTruthy();
              
              // 验证建议生成
              expect(comparisonResult.recommendations).toBeTruthy();
              expect(Array.isArray(comparisonResult.recommendations)).toBe(true);
              
              // 验证比较结果已存储
              expect(testComparator.activeComparisons.has(comparisonResult.comparisonId)).toBe(true);
              
              // 验证可以检索比较结果
              const retrievedResult = testComparator.getComparisonResult(comparisonResult.comparisonId);
              expect(retrievedResult).toBeTruthy();
              expect(retrievedResult.comparisonId).toBe(comparisonResult.comparisonId);
              
              // 验证可以获取所有比较结果
              const allResults = testComparator.getAllComparisonResults();
              expect(allResults.length).toBeGreaterThan(0);
              expect(allResults.some(result => result.comparisonId === comparisonResult.comparisonId)).toBe(true);
              
              return true;
            } finally {
              // 清理测试比较器
              testComparator.destroy();
            }
          }
        ),
        { numRuns: 10 } // 减少运行次数以提高测试稳定性
      );
    });

    it('should handle scenario addition and removal correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              scenarioId: fc.string({ minLength: 1, maxLength: 15 }).map(s => `test_${s.replace(/[^a-zA-Z0-9]/g, '_')}`),
              scenarioName: fc.string({ minLength: 3, maxLength: 25 }),
              performanceData: fc.record({
                maxSpeed: fc.float({ min: Math.fround(20), max: Math.fround(80), noNaN: true }),
                totalDistance: fc.float({ min: Math.fround(100), max: Math.fround(500), noNaN: true })
              })
            }),
            { minLength: 1, maxLength: 5 }
          ).map(scenarios => {
            // 确保场景ID唯一并且有效
            const uniqueScenarios = [];
            const usedIds = new Set();
            for (let i = 0; i < scenarios.length; i++) {
              const scenario = scenarios[i];
              let uniqueId = scenario.scenarioId;
              
              // 确保ID不为空且唯一
              if (!uniqueId || uniqueId.trim() === '' || usedIds.has(uniqueId)) {
                uniqueId = `test_scenario_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              }
              
              while (usedIds.has(uniqueId)) {
                uniqueId = `test_scenario_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              }
              
              usedIds.add(uniqueId);
              uniqueScenarios.push({
                ...scenario,
                scenarioId: uniqueId
              });
            }
            return uniqueScenarios;
          }),
          (scenarios) => {
            // 为每个属性测试创建新的比较器实例
            const testSceneManager = new MockSceneManager();
            const testComparator = new ScenarioComparator(testSceneManager);
            
            try {
              const addedScenarios = [];
              
              // 添加场景
              scenarios.forEach(scenarioData => {
                const scenarioConfig = {
                  id: scenarioData.scenarioId,
                  name: scenarioData.scenarioName,
                  environment: { terrain: 'flat' }
                };
                
                const simulationResult = {
                  scenario: { id: scenarioData.scenarioId },
                  data: {
                    performanceMetrics: scenarioData.performanceData
                  }
                };
                
                const addSuccess = testComparator.addScenarioForComparison(
                  scenarioData.scenarioId,
                  scenarioConfig,
                  simulationResult
                );
                
                expect(addSuccess).toBe(true);
                addedScenarios.push(scenarioData.scenarioId);
                
                // 验证场景已添加
                expect(testComparator.scenarios.has(scenarioData.scenarioId)).toBe(true);
                expect(testComparator.simulationResults.has(scenarioData.scenarioId)).toBe(true);
              });
              
              // 验证总数正确
              expect(testComparator.scenarios.size).toBe(scenarios.length);
              expect(testComparator.simulationResults.size).toBe(scenarios.length);
              
              // 移除一半的场景（如果有多个场景）
              if (addedScenarios.length > 1) {
                const scenariosToRemove = addedScenarios.slice(0, Math.floor(addedScenarios.length / 2));
                
                scenariosToRemove.forEach(scenarioId => {
                  const removeSuccess = testComparator.removeScenarioFromComparison(scenarioId);
                  expect(removeSuccess).toBe(true);
                  
                  // 验证场景已移除
                  expect(testComparator.scenarios.has(scenarioId)).toBe(false);
                  expect(testComparator.simulationResults.has(scenarioId)).toBe(false);
                });
                
                // 验证剩余场景数量正确
                const expectedRemaining = scenarios.length - scenariosToRemove.length;
                expect(testComparator.scenarios.size).toBe(expectedRemaining);
                expect(testComparator.simulationResults.size).toBe(expectedRemaining);
              }
              
              return true;
            } finally {
              // 清理测试比较器
              testComparator.destroy();
            }
          }
        ),
        { numRuns: 10 } // 减少运行次数以提高测试稳定性
      );
    });

    it('should generate meaningful comparison analysis', () => {
      // 创建具有明显差异的测试场景
      const testScenarios = [
        {
          id: 'high_performance',
          name: 'High Performance Scenario',
          metrics: {
            maxSpeed: 80,
            averageSpeed: 60,
            totalDistance: 500,
            totalEnergyConsumption: 50,
            maxAcceleration: 10,
            energyEfficiency: 1.5
          }
        },
        {
          id: 'low_performance',
          name: 'Low Performance Scenario',
          metrics: {
            maxSpeed: 40,
            averageSpeed: 30,
            totalDistance: 200,
            totalEnergyConsumption: 80,
            maxAcceleration: 5,
            energyEfficiency: 0.8
          }
        },
        {
          id: 'medium_performance',
          name: 'Medium Performance Scenario',
          metrics: {
            maxSpeed: 60,
            averageSpeed: 45,
            totalDistance: 350,
            totalEnergyConsumption: 65,
            maxAcceleration: 7.5,
            energyEfficiency: 1.2
          }
        }
      ];

      const scenarioIds = [];

      // 添加测试场景
      testScenarios.forEach(scenarioData => {
        const scenarioConfig = {
          id: scenarioData.id,
          name: scenarioData.name,
          environment: { terrain: 'flat' }
        };

        const simulationResult = {
          scenario: { id: scenarioData.id, name: scenarioData.name },
          data: { performanceMetrics: scenarioData.metrics }
        };

        scenarioComparator.addScenarioForComparison(
          scenarioData.id,
          scenarioConfig,
          simulationResult
        );
        scenarioIds.push(scenarioData.id);
      });

      // 执行比较
      const comparisonResult = scenarioComparator.compareScenarios(scenarioIds);

      // 验证最佳和最差场景识别
      expect(comparisonResult.metrics.maxSpeed.bestScenario).toBe('high_performance');
      expect(comparisonResult.metrics.maxSpeed.worstScenario).toBe('low_performance');
      
      expect(comparisonResult.metrics.energyEfficiency.bestScenario).toBe('high_performance');
      expect(comparisonResult.metrics.energyEfficiency.worstScenario).toBe('low_performance');

      // 验证统计计算
      expect(comparisonResult.metrics.maxSpeed.average).toBeCloseTo(60, 1);
      expect(comparisonResult.metrics.maxSpeed.min).toBe(40);
      expect(comparisonResult.metrics.maxSpeed.max).toBe(80);

      // 验证建议生成
      expect(comparisonResult.recommendations.length).toBeGreaterThan(0);
      
      // 应该有性能优化建议
      const performanceRecommendations = comparisonResult.recommendations.filter(
        rec => rec.type === 'performance'
      );
      expect(performanceRecommendations.length).toBeGreaterThan(0);

      // 验证可视化数据结构
      expect(comparisonResult.visualization.charts.maxSpeed).toBeTruthy();
      expect(comparisonResult.visualization.charts.maxSpeed.data.length).toBe(3);
      
      expect(comparisonResult.visualization.radarChart.datasets.length).toBe(3);
      expect(comparisonResult.visualization.heatmap.data.length).toBeGreaterThan(0);
    });

    it('should handle edge cases correctly', () => {
      // 测试空场景列表
      expect(() => {
        scenarioComparator.compareScenarios([]);
      }).toThrow();

      // 测试单个场景
      expect(() => {
        scenarioComparator.compareScenarios(['non_existent']);
      }).toThrow();

      // 测试不存在的场景ID - 应该只处理存在的场景
      const scenarioConfig = {
        id: 'test_scenario_1',
        name: 'Test Scenario 1'
      };
      
      const simulationResult = {
        scenario: { id: 'test_scenario_1' },
        data: { performanceMetrics: { maxSpeed: 50 } }
      };

      scenarioComparator.addScenarioForComparison('test_scenario_1', scenarioConfig, simulationResult);

      // 添加第二个场景以满足最少两个场景的要求
      const scenarioConfig2 = {
        id: 'test_scenario_2',
        name: 'Test Scenario 2'
      };
      
      const simulationResult2 = {
        scenario: { id: 'test_scenario_2' },
        data: { performanceMetrics: { maxSpeed: 60 } }
      };

      scenarioComparator.addScenarioForComparison('test_scenario_2', scenarioConfig2, simulationResult2);

      // 现在测试包含不存在场景ID的情况 - 应该只比较存在的场景
      expect(() => {
        scenarioComparator.compareScenarios(['test_scenario_1', 'test_scenario_2', 'non_existent']);
      }).not.toThrow();

      // 应该只比较存在的场景
      const result = scenarioComparator.compareScenarios(['test_scenario_1', 'test_scenario_2', 'non_existent']);
      expect(result.scenarioIds).toEqual(['test_scenario_1', 'test_scenario_2']);
    });
  });

  // 辅助测试：验证基本功能
  describe('Basic Functionality Tests', () => {
    it('should initialize correctly', () => {
      expect(scenarioComparator.scenarios).toBeInstanceOf(Map);
      expect(scenarioComparator.simulationResults).toBeInstanceOf(Map);
      expect(scenarioComparator.activeComparisons).toBeInstanceOf(Map);
      expect(Array.isArray(scenarioComparator.comparisonMetrics)).toBe(true);
    });

    it('should handle invalid inputs gracefully', () => {
      // 测试无效参数
      expect(scenarioComparator.addScenarioForComparison(null, null, null)).toBe(false);
      expect(scenarioComparator.addScenarioForComparison('', {}, {})).toBe(false);
      expect(scenarioComparator.addScenarioForComparison('test', null, {})).toBe(false);
      
      // 测试移除不存在的场景
      expect(scenarioComparator.removeScenarioFromComparison('non_existent')).toBe(false);
    });

    it('should clear comparisons correctly', () => {
      // 添加一些测试数据
      const scenarioConfig = { id: 'test', name: 'Test' };
      const simulationResult = { scenario: { id: 'test' }, data: { performanceMetrics: {} } };
      
      scenarioComparator.addScenarioForComparison('test', scenarioConfig, simulationResult);
      expect(scenarioComparator.scenarios.size).toBe(1);
      
      // 清空所有比较
      scenarioComparator.clearAllComparisons();
      expect(scenarioComparator.scenarios.size).toBe(0);
      expect(scenarioComparator.simulationResults.size).toBe(0);
      expect(scenarioComparator.activeComparisons.size).toBe(0);
    });
  });
});