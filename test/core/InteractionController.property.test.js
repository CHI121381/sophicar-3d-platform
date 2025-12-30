/**
 * InteractionController 属性测试 (Property-Based Tests)
 * InteractionController Property-Based Tests
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as THREE from 'three';
import { SceneManager } from '../../src/core/SceneManager.js';
import { InteractionController } from '../../src/core/InteractionController.js';

describe('InteractionController Property Tests', () => {
  let container;
  let sceneManager;
  let interactionController;
  let testObjects;

  beforeEach(() => {
    // 创建测试容器
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    
    // 创建场景管理器实例
    sceneManager = new SceneManager(container);
    
    // 创建交互控制器实例
    interactionController = new InteractionController(
      sceneManager.scene,
      sceneManager.camera,
      sceneManager.renderer
    );
    
    // 启用对象选择功能
    interactionController.enableObjectSelection();
    
    // 创建测试对象
    testObjects = [];
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshLambertMaterial({ 
        color: Math.random() * 0xffffff,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      mesh.name = `testObject_${i}`;
      
      sceneManager.addObject(mesh, `test_${i}`);
      testObjects.push(mesh);
    }
  });

  afterEach(() => {
    // 清理资源
    if (interactionController) {
      interactionController.destroy();
    }
    if (sceneManager) {
      sceneManager.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    testObjects = [];
  });

  /**
   * **Feature: sophicar-3d-platform, Property 2: Interactive Element Feedback**
   * **Validates: Requirements 1.5**
   * 
   * Property: For any interactive element in the 3D scene, 
   * hovering over it should trigger visual feedback indicators
   */
  it('Property 2: Interactive Element Feedback', () => {
    fc.assert(
      fc.property(
        // 生成随机的测试对象索引
        fc.integer({ min: 0, max: testObjects.length - 1 }),
        // 生成鼠标位置参数（模拟悬停）
        fc.record({
          x: fc.float({ min: -1, max: 1, noNaN: true }),
          y: fc.float({ min: -1, max: 1, noNaN: true })
        }),
        (objectIndex, mousePosition) => {
          const testObject = testObjects[objectIndex];
          
          // 记录对象的初始状态
          const initialEmissive = testObject.material.emissive.clone();
          const initialEmissiveIntensity = testObject.material.emissiveIntensity;
          const initialScale = testObject.scale.clone();
          
          // 模拟鼠标悬停 - 设置悬停对象
          interactionController.setHoveredObject(testObject);
          
          // 验证视觉反馈已应用
          const hasEmissiveChange = 
            !testObject.material.emissive.equals(initialEmissive) ||
            testObject.material.emissiveIntensity !== initialEmissiveIntensity;
          
          // 检查是否有视觉反馈系统的效果
          const hasVisualFeedback = 
            interactionController.visualFeedback.activeEffects.has(`hover_${testObject.uuid}`);
          
          // 验证悬停状态已设置
          const hoverStateSet = interactionController.hoveredObject === testObject;
          
          // 清除悬停状态
          interactionController.clearHover();
          
          // 验证悬停状态已清除
          const hoverStateCleared = interactionController.hoveredObject === null;
          
          // 验证视觉效果已移除
          const visualEffectRemoved = 
            !interactionController.visualFeedback.activeEffects.has(`hover_${testObject.uuid}`);
          
          // 属性验证：悬停应该触发视觉反馈指示器
          return hasVisualFeedback && hoverStateSet && hoverStateCleared && visualEffectRemoved;
        }
      ),
      { numRuns: 100 } // 运行100次测试
    );
  });

  /**
   * **Feature: sophicar-3d-platform, Property 17: Interaction Response Consistency**
   * **Validates: Requirements 6.1**
   * 
   * Property: For any user interaction with 3D elements, 
   * the system should provide consistent visual and behavioral feedback
   */
  it('Property 17: Interaction Response Consistency', () => {
    fc.assert(
      fc.property(
        // 生成交互序列：多个对象的选择和悬停操作
        fc.array(
          fc.record({
            objectIndex: fc.integer({ min: 0, max: testObjects.length - 1 }),
            action: fc.constantFrom('hover', 'select', 'clear'),
            delay: fc.integer({ min: 0, max: 100 }) // 模拟操作间的延迟
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (interactionSequence) => {
          let consistencyResults = [];
          
          for (const interaction of interactionSequence) {
            const testObject = testObjects[interaction.objectIndex];
            
            // 记录操作前的状态
            const beforeState = {
              hoveredObject: interactionController.hoveredObject,
              selectedObject: interactionController.selectedObject,
              activeEffects: new Set(interactionController.visualFeedback.activeEffects.keys())
            };
            
            // 执行交互操作
            switch (interaction.action) {
              case 'hover':
                interactionController.setHoveredObject(testObject);
                break;
              case 'select':
                interactionController.setSelectedObject(testObject);
                break;
              case 'clear':
                interactionController.clearSelection();
                interactionController.clearHover();
                break;
            }
            
            // 记录操作后的状态
            const afterState = {
              hoveredObject: interactionController.hoveredObject,
              selectedObject: interactionController.selectedObject,
              activeEffects: new Set(interactionController.visualFeedback.activeEffects.keys())
            };
            
            // 验证状态变化的一致性
            let isConsistent = true;
            
            switch (interaction.action) {
              case 'hover':
                // 悬停操作应该设置悬停对象并添加视觉效果
                isConsistent = 
                  afterState.hoveredObject === testObject &&
                  afterState.activeEffects.has(`hover_${testObject.uuid}`);
                break;
                
              case 'select':
                // 选择操作应该设置选中对象并添加视觉效果
                isConsistent = 
                  afterState.selectedObject === testObject &&
                  afterState.activeEffects.has(`selection_${testObject.uuid}`);
                break;
                
              case 'clear':
                // 清除操作应该移除所有选择和悬停状态
                isConsistent = 
                  afterState.hoveredObject === null &&
                  afterState.selectedObject === null;
                break;
            }
            
            consistencyResults.push(isConsistent);
            
            // 添加小延迟以模拟真实交互
            if (interaction.delay > 0) {
              // 在测试环境中，我们不需要真正的延迟，只是标记
            }
          }
          
          // 验证所有交互操作都保持了一致性
          const allConsistent = consistencyResults.every(result => result === true);
          
          // 验证最终状态的完整性
          const finalStateValid = 
            (interactionController.hoveredObject === null || 
             testObjects.includes(interactionController.hoveredObject)) &&
            (interactionController.selectedObject === null || 
             testObjects.includes(interactionController.selectedObject));
          
          // 属性验证：所有交互应该提供一致的视觉和行为反馈
          return allConsistent && finalStateValid;
        }
      ),
      { numRuns: 100 } // 运行100次测试
    );
  });

  /**
   * 辅助测试：验证相机控制响应性
   * Helper test: Verify camera control responsiveness
   */
  it('Camera Control Responsiveness', () => {
    fc.assert(
      fc.property(
        // 生成相机控制参数
        fc.record({
          deltaX: fc.float({ min: Math.fround(-0.1), max: Math.fround(0.1), noNaN: true }),
          deltaY: fc.float({ min: Math.fround(-0.1), max: Math.fround(0.1), noNaN: true }),
          zoomScale: fc.float({ min: Math.fround(0.8), max: Math.fround(1.2), noNaN: true })
        }),
        (controlParams) => {
          // 记录初始相机状态
          const initialPosition = sceneManager.camera.position.clone();
          const initialTarget = interactionController.cameraState.target.clone();
          
          // 模拟相机旋转控制
          if (Math.abs(controlParams.deltaX) > 0.01 || Math.abs(controlParams.deltaY) > 0.01) {
            interactionController.rotateCamera(controlParams.deltaX, controlParams.deltaY);
          }
          
          // 模拟相机缩放控制
          if (Math.abs(controlParams.zoomScale - 1.0) > 0.01) {
            interactionController.zoomCamera(controlParams.zoomScale);
          }
          
          // 验证相机位置已响应控制输入
          const positionChanged = !sceneManager.camera.position.equals(initialPosition);
          const targetMaintained = interactionController.cameraState.target.equals(initialTarget);
          
          // 验证相机矩阵已更新
          sceneManager.camera.updateMatrixWorld();
          const matrixValid = sceneManager.camera.matrixWorld.determinant() !== 0;
          
          // 相机控制应该响应输入并保持有效状态
          return (positionChanged || Math.abs(controlParams.deltaX) < 0.01) && 
                 matrixValid && 
                 !isNaN(sceneManager.camera.position.x) &&
                 !isNaN(sceneManager.camera.position.y) &&
                 !isNaN(sceneManager.camera.position.z);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 辅助测试：验证视觉反馈系统的完整性
   * Helper test: Verify visual feedback system integrity
   */
  it('Visual Feedback System Integrity', () => {
    fc.assert(
      fc.property(
        // 生成多个对象的交互序列
        fc.array(
          fc.record({
            objectIndex: fc.integer({ min: 0, max: testObjects.length - 1 }),
            feedbackType: fc.constantFrom('hover', 'selection', 'ripple')
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (feedbackSequence) => {
          let integrityResults = [];
          
          for (const feedback of feedbackSequence) {
            const testObject = testObjects[feedback.objectIndex];
            const effectId = `${feedback.feedbackType}_${testObject.uuid}`;
            
            // 应用视觉反馈
            switch (feedback.feedbackType) {
              case 'hover':
                interactionController.visualFeedback.addHoverEffect(testObject);
                break;
              case 'selection':
                interactionController.visualFeedback.addSelectionEffect(testObject);
                break;
              case 'ripple':
                const position = testObject.position.clone();
                interactionController.visualFeedback.addInteractionRipple(position, 1.0);
                break;
            }
            
            // 验证效果已正确应用
            let effectApplied = false;
            if (feedback.feedbackType === 'ripple') {
              // 涟漪效果不会在activeEffects中持久存在
              effectApplied = true;
            } else {
              effectApplied = interactionController.visualFeedback.activeEffects.has(effectId);
            }
            
            integrityResults.push(effectApplied);
            
            // 清理效果
            if (feedback.feedbackType === 'hover') {
              interactionController.visualFeedback.removeHoverEffect(testObject);
            } else if (feedback.feedbackType === 'selection') {
              interactionController.visualFeedback.removeSelectionEffect(testObject);
            }
          }
          
          // 验证所有效果都正确应用
          const allEffectsApplied = integrityResults.every(result => result === true);
          
          // 验证清理后没有残留效果
          const noRemainingEffects = interactionController.visualFeedback.activeEffects.size === 0;
          
          return allEffectsApplied && noRemainingEffects;
        }
      ),
      { numRuns: 100 }
    );
  });
});