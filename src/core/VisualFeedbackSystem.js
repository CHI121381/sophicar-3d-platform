/**
 * 视觉反馈系统 - 处理交互状态的视觉反馈和动画
 * Visual Feedback System - Handle visual feedback and animations for interaction states
 */
import * as THREE from 'three';

export class VisualFeedbackSystem {
  /**
   * 构造函数 - 初始化视觉反馈系统
   * Constructor - Initialize visual feedback system
   * @param {THREE.Scene} scene - 3D场景
   */
  constructor(scene) {
    this.scene = scene;
    
    // 反馈效果配置
    this.feedbackConfig = {
      hover: {
        emissiveColor: 0x222222,
        emissiveIntensity: 0.3,
        scaleMultiplier: 1.05,
        animationDuration: 200
      },
      selection: {
        emissiveColor: 0x444444,
        emissiveIntensity: 0.5,
        outlineColor: 0x00ff00,
        outlineWidth: 0.02,
        animationDuration: 300
      },
      interaction: {
        rippleColor: 0x4CAF50,
        rippleDuration: 800,
        pulseIntensity: 0.8,
        pulseDuration: 1000
      }
    };
    
    // 活动的动画和效果
    this.activeAnimations = new Map();
    this.activeEffects = new Map();
    
    // 创建材质缓存
    this.materialCache = new Map();
    
    this.setupFeedbackMaterials();
  }

  /**
   * 设置反馈材质
   * Set up feedback materials
   */
  setupFeedbackMaterials() {
    // 悬停高亮材质
    this.hoverMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(this.feedbackConfig.hover.emissiveColor),
      emissiveIntensity: this.feedbackConfig.hover.emissiveIntensity,
      transparent: true,
      opacity: 0.8
    });

    // 选择高亮材质
    this.selectionMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(this.feedbackConfig.selection.emissiveColor),
      emissiveIntensity: this.feedbackConfig.selection.emissiveIntensity,
      transparent: true,
      opacity: 0.9
    });

    // 交互涟漪材质
    this.rippleMaterial = new THREE.MeshBasicMaterial({
      color: this.feedbackConfig.interaction.rippleColor,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
  }

  /**
   * 添加悬停效果
   * Add hover effect
   * @param {THREE.Object3D} object - 目标对象
   */
  addHoverEffect(object) {
    if (!object || this.activeEffects.has(`hover_${object.uuid}`)) return;

    // 保存原始材质和变换
    this.saveOriginalProperties(object);

    // 应用悬停效果
    this.applyHoverVisuals(object);
    
    // 添加悬停动画
    this.animateHoverIn(object);
    
    // 标记效果为活动状态
    this.activeEffects.set(`hover_${object.uuid}`, {
      type: 'hover',
      object: object,
      startTime: performance.now()
    });
  }

  /**
   * 移除悬停效果
   * Remove hover effect
   * @param {THREE.Object3D} object - 目标对象
   */
  removeHoverEffect(object) {
    if (!object || !this.activeEffects.has(`hover_${object.uuid}`)) return;

    // 动画移除悬停效果
    this.animateHoverOut(object);
    
    // 移除效果标记
    this.activeEffects.delete(`hover_${object.uuid}`);
  }

  /**
   * 添加选择效果
   * Add selection effect
   * @param {THREE.Object3D} object - 目标对象
   */
  addSelectionEffect(object) {
    if (!object || this.activeEffects.has(`selection_${object.uuid}`)) return;

    // 保存原始属性
    this.saveOriginalProperties(object);

    // 应用选择视觉效果
    this.applySelectionVisuals(object);
    
    // 添加选择动画
    this.animateSelectionIn(object);
    
    // 创建选择轮廓
    this.createSelectionOutline(object);
    
    // 标记效果为活动状态
    this.activeEffects.set(`selection_${object.uuid}`, {
      type: 'selection',
      object: object,
      startTime: performance.now()
    });
  }

  /**
   * 移除选择效果
   * Remove selection effect
   * @param {THREE.Object3D} object - 目标对象
   */
  removeSelectionEffect(object) {
    if (!object || !this.activeEffects.has(`selection_${object.uuid}`)) return;

    // 动画移除选择效果
    this.animateSelectionOut(object);
    
    // 移除选择轮廓
    this.removeSelectionOutline(object);
    
    // 移除效果标记
    this.activeEffects.delete(`selection_${object.uuid}`);
  }

  /**
   * 添加交互涟漪效果
   * Add interaction ripple effect
   * @param {THREE.Vector3} position - 交互位置
   * @param {number} intensity - 效果强度
   */
  addInteractionRipple(position, intensity = 1.0) {
    const rippleId = `ripple_${Date.now()}_${Math.random()}`;
    
    // 创建涟漪几何体
    const rippleGeometry = new THREE.RingGeometry(0, 0.1, 16);
    const rippleMesh = new THREE.Mesh(rippleGeometry, this.rippleMaterial.clone());
    
    rippleMesh.position.copy(position);
    rippleMesh.lookAt(position.clone().add(new THREE.Vector3(0, 1, 0)));
    
    this.scene.add(rippleMesh);
    
    // 动画涟漪扩散
    this.animateRippleExpansion(rippleMesh, intensity, rippleId);
  }

  /**
   * 添加脉冲效果
   * Add pulse effect
   * @param {THREE.Object3D} object - 目标对象
   * @param {number} duration - 脉冲持续时间
   */
  addPulseEffect(object, duration = 1000) {
    if (!object) return;

    const pulseId = `pulse_${object.uuid}`;
    
    // 如果已有脉冲效果，先移除
    if (this.activeAnimations.has(pulseId)) {
      this.stopAnimation(pulseId);
    }
    
    this.animatePulse(object, duration, pulseId);
  }

  /**
   * 保存对象原始属性
   * Save object original properties
   * @param {THREE.Object3D} object - 目标对象
   */
  saveOriginalProperties(object) {
    if (object.userData.originalProperties) return;

    // 递归保存所有子对象的材质属性
    const saveObjectMaterials = (obj) => {
      if (obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        return materials.map(mat => ({
          color: mat.color ? mat.color.clone() : null,
          emissive: mat.emissive ? mat.emissive.clone() : null,
          emissiveIntensity: mat.emissiveIntensity,
          opacity: mat.opacity,
          transparent: mat.transparent,
          visible: mat.visible
        }));
      }
      return null;
    };

    object.userData.originalProperties = {
      scale: object.scale.clone(),
      visible: object.visible,
      materials: new Map()
    };

    // 保存所有子对象的材质
    object.traverse((child) => {
      if (child.material) {
        object.userData.originalProperties.materials.set(child.uuid, {
          materials: saveObjectMaterials(child),
          visible: child.visible
        });
      }
    });
  }

  /**
   * 恢复对象原始属性
   * Restore object original properties
   * @param {THREE.Object3D} object - 目标对象
   */
  restoreOriginalProperties(object) {
    if (!object.userData.originalProperties) return;

    const original = object.userData.originalProperties;
    
    // 恢复缩放
    object.scale.copy(original.scale);
    object.visible = original.visible;
    
    // 恢复所有子对象的材质
    object.traverse((child) => {
      if (child.material && original.materials.has(child.uuid)) {
        const savedData = original.materials.get(child.uuid);
        child.visible = savedData.visible;
        
        if (savedData.materials) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat, index) => {
            if (savedData.materials[index]) {
              const savedMat = savedData.materials[index];
              if (savedMat.color && mat.color) mat.color.copy(savedMat.color);
              if (savedMat.emissive && mat.emissive) mat.emissive.copy(savedMat.emissive);
              if (savedMat.emissiveIntensity !== undefined) mat.emissiveIntensity = savedMat.emissiveIntensity;
              if (savedMat.opacity !== undefined) mat.opacity = savedMat.opacity;
              if (savedMat.transparent !== undefined) mat.transparent = savedMat.transparent;
              if (savedMat.visible !== undefined) mat.visible = savedMat.visible;
            }
          });
        }
      }
    });
    
    // 清除保存的属性
    delete object.userData.originalProperties;
  }

  /**
   * 复制材质属性
   * Copy material properties
   * @param {THREE.Material} source - 源材质
   * @param {THREE.Material} target - 目标材质
   */
  copyMaterialProperties(source, target) {
    if (source.emissive && target.emissive) {
      target.emissive.copy(source.emissive);
    }
    if (source.emissiveIntensity !== undefined) {
      target.emissiveIntensity = source.emissiveIntensity;
    }
    if (source.opacity !== undefined) {
      target.opacity = source.opacity;
    }
  }

  /**
   * 应用悬停视觉效果
   * Apply hover visual effects
   * @param {THREE.Object3D} object - 目标对象
   */
  applyHoverVisuals(object) {
    // 只对顶级对象应用轻微的发光效果，避免影响子对象
    object.traverse((child) => {
      if (child.material && child.material.emissive) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(mat => {
          if (mat.emissive) {
            // 保存当前发光强度，然后轻微增强
            const currentIntensity = mat.emissiveIntensity || 0;
            mat.emissiveIntensity = Math.min(currentIntensity + 0.1, 0.5);
          }
        });
      }
    });
  }

  /**
   * 应用选择视觉效果
   * Apply selection visual effects
   * @param {THREE.Object3D} object - 目标对象
   */
  applySelectionVisuals(object) {
    // 只对顶级对象应用轻微的发光效果，避免影响子对象材质
    object.traverse((child) => {
      if (child.material && child.material.emissive) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(mat => {
          if (mat.emissive) {
            // 保存当前发光强度，然后轻微增强
            const currentIntensity = mat.emissiveIntensity || 0;
            mat.emissiveIntensity = Math.min(currentIntensity + 0.2, 0.8);
          }
        });
      }
    });
  }

  /**
   * 悬停进入动画
   * Hover in animation
   * @param {THREE.Object3D} object - 目标对象
   */
  animateHoverIn(object) {
    const animationId = `hoverIn_${object.uuid}`;
    const startScale = object.scale.clone();
    const targetScale = startScale.clone().multiplyScalar(this.feedbackConfig.hover.scaleMultiplier);
    const duration = this.feedbackConfig.hover.animationDuration;
    
    this.createScaleAnimation(object, startScale, targetScale, duration, animationId);
  }

  /**
   * 悬停退出动画
   * Hover out animation
   * @param {THREE.Object3D} object - 目标对象
   */
  animateHoverOut(object) {
    const animationId = `hoverOut_${object.uuid}`;
    const currentScale = object.scale.clone();
    const originalScale = object.userData.originalProperties?.scale || new THREE.Vector3(1, 1, 1);
    const duration = this.feedbackConfig.hover.animationDuration;
    
    this.createScaleAnimation(object, currentScale, originalScale, duration, animationId, () => {
      this.restoreOriginalProperties(object);
    });
  }

  /**
   * 选择进入动画
   * Selection in animation
   * @param {THREE.Object3D} object - 目标对象
   */
  animateSelectionIn(object) {
    const animationId = `selectionIn_${object.uuid}`;
    const duration = this.feedbackConfig.selection.animationDuration;
    
    // 创建选择脉冲效果
    this.addPulseEffect(object, duration);
  }

  /**
   * 选择退出动画
   * Selection out animation
   * @param {THREE.Object3D} object - 目标对象
   */
  animateSelectionOut(object) {
    const animationId = `selectionOut_${object.uuid}`;
    
    // 停止脉冲效果
    this.stopAnimation(`pulse_${object.uuid}`);
    
    // 恢复原始属性
    setTimeout(() => {
      this.restoreOriginalProperties(object);
    }, 100);
  }

  /**
   * 创建缩放动画
   * Create scale animation
   * @param {THREE.Object3D} object - 目标对象
   * @param {THREE.Vector3} startScale - 起始缩放
   * @param {THREE.Vector3} endScale - 结束缩放
   * @param {number} duration - 持续时间
   * @param {string} animationId - 动画ID
   * @param {Function} onComplete - 完成回调
   */
  createScaleAnimation(object, startScale, endScale, duration, animationId, onComplete = null) {
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数
      const easeProgress = this.easeOutCubic(progress);
      
      // 插值缩放
      object.scale.lerpVectors(startScale, endScale, easeProgress);
      
      if (progress < 1) {
        this.activeAnimations.set(animationId, requestAnimationFrame(animate));
      } else {
        this.activeAnimations.delete(animationId);
        if (onComplete) onComplete();
      }
    };
    
    this.activeAnimations.set(animationId, requestAnimationFrame(animate));
  }

  /**
   * 创建脉冲动画
   * Create pulse animation
   * @param {THREE.Object3D} object - 目标对象
   * @param {number} duration - 持续时间
   * @param {string} animationId - 动画ID
   */
  animatePulse(object, duration, animationId) {
    const startTime = performance.now();
    const originalIntensity = object.material?.emissiveIntensity || 0;
    const maxIntensity = this.feedbackConfig.interaction.pulseIntensity;
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = (elapsed % duration) / duration;
      
      // 正弦波脉冲
      const pulseValue = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
      const intensity = originalIntensity + (maxIntensity - originalIntensity) * pulseValue;
      
      if (object.material && object.material.emissiveIntensity !== undefined) {
        object.material.emissiveIntensity = intensity;
      }
      
      this.activeAnimations.set(animationId, requestAnimationFrame(animate));
    };
    
    this.activeAnimations.set(animationId, requestAnimationFrame(animate));
  }

  /**
   * 动画涟漪扩散
   * Animate ripple expansion
   * @param {THREE.Mesh} rippleMesh - 涟漪网格
   * @param {number} intensity - 强度
   * @param {string} rippleId - 涟漪ID
   */
  animateRippleExpansion(rippleMesh, intensity, rippleId) {
    const startTime = performance.now();
    const duration = this.feedbackConfig.interaction.rippleDuration;
    const maxRadius = 2.0 * intensity;
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        this.scene.remove(rippleMesh);
        rippleMesh.geometry.dispose();
        rippleMesh.material.dispose();
        this.activeAnimations.delete(rippleId);
        return;
      }
      
      // 更新涟漪大小和透明度
      const radius = maxRadius * progress;
      const opacity = (1 - progress) * 0.6;
      
      rippleMesh.geometry.dispose();
      rippleMesh.geometry = new THREE.RingGeometry(radius * 0.8, radius, 16);
      rippleMesh.material.opacity = opacity;
      
      this.activeAnimations.set(rippleId, requestAnimationFrame(animate));
    };
    
    this.activeAnimations.set(rippleId, requestAnimationFrame(animate));
  }

  /**
   * 创建选择轮廓
   * Create selection outline
   * @param {THREE.Object3D} object - 目标对象
   */
  createSelectionOutline(object) {
    // 暂时禁用轮廓效果，避免影响复杂模型的渲染
    // 在复杂的FBX模型上创建轮廓可能导致性能问题和渲染错误
    console.log('选择轮廓已禁用，避免影响复杂模型渲染');
    
    // 如果需要轮廓效果，可以考虑使用后处理着色器或其他方法
    // 而不是直接复制几何体
  }

  /**
   * 移除选择轮廓
   * Remove selection outline
   * @param {THREE.Object3D} object - 目标对象
   */
  removeSelectionOutline(object) {
    // 由于禁用了轮廓创建，这里也不需要清理
    if (object.userData.selectionOutline) {
      const outline = object.userData.selectionOutline;
      
      if (outline.parent) {
        outline.parent.remove(outline);
      }
      
      if (outline.geometry) outline.geometry.dispose();
      if (outline.material) outline.material.dispose();
      
      delete object.userData.selectionOutline;
    }
  }

  /**
   * 停止动画
   * Stop animation
   * @param {string} animationId - 动画ID
   */
  stopAnimation(animationId) {
    if (this.activeAnimations.has(animationId)) {
      cancelAnimationFrame(this.activeAnimations.get(animationId));
      this.activeAnimations.delete(animationId);
    }
  }

  /**
   * 缓动函数 - 三次方缓出
   * Easing function - cubic ease out
   * @param {number} t - 进度值 (0-1)
   * @returns {number} 缓动后的值
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * 更新视觉反馈系统
   * Update visual feedback system
   */
  update() {
    // 更新所有活动效果的状态
    for (const [effectId, effect] of this.activeEffects) {
      const elapsed = performance.now() - effect.startTime;
      
      // 可以在这里添加基于时间的效果更新逻辑
      if (effect.type === 'hover' && elapsed > 5000) {
        // 长时间悬停后自动淡化效果
        this.removeHoverEffect(effect.object);
      }
    }
  }

  /**
   * 清除所有效果
   * Clear all effects
   */
  clearAllEffects() {
    // 停止所有动画
    for (const [animationId, animationFrame] of this.activeAnimations) {
      cancelAnimationFrame(animationFrame);
    }
    this.activeAnimations.clear();
    
    // 移除所有效果
    for (const [effectId, effect] of this.activeEffects) {
      if (effect.type === 'hover') {
        this.removeHoverEffect(effect.object);
      } else if (effect.type === 'selection') {
        this.removeSelectionEffect(effect.object);
      }
    }
    this.activeEffects.clear();
  }

  /**
   * 销毁视觉反馈系统
   * Destroy visual feedback system
   */
  destroy() {
    this.clearAllEffects();
    
    // 清理材质
    this.hoverMaterial.dispose();
    this.selectionMaterial.dispose();
    this.rippleMaterial.dispose();
    
    this.materialCache.clear();
  }
}