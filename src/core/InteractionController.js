/**
 * 交互控制器 - 处理用户输入和3D对象交互
 * InteractionController - Handle user input and 3D object interactions
 */
import * as THREE from 'three';
import { VisualFeedbackSystem } from './VisualFeedbackSystem.js';

export class InteractionController {
  /**
   * 构造函数 - 初始化交互控制器
   * Constructor - Initialize interaction controller
   * @param {THREE.Scene} scene - 3D场景
   * @param {THREE.Camera} camera - 相机
   * @param {THREE.WebGLRenderer} renderer - 渲染器
   */
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.domElement = renderer.domElement;
    
    // 交互状态
    this.isMouseDown = false;
    this.selectedObject = null;
    this.hoveredObject = null;
    this.objectSelectionEnabled = false; // 默认禁用，需要手动启用
    
    // 鼠标位置
    this.mouse = new THREE.Vector2();
    this.previousMouse = new THREE.Vector2();
    
    // 射线投射器用于对象选择
    this.raycaster = new THREE.Raycaster();
    
    // 视觉反馈系统
    this.visualFeedback = new VisualFeedbackSystem(scene);
    
    // 相机控制参数
    this.cameraControls = {
      enabled: true,
      rotateSpeed: 1.0,
      zoomSpeed: 1.2,
      panSpeed: 0.8,
      minDistance: 1,
      maxDistance: 100,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI
    };
    
    // 相机状态
    this.cameraState = {
      spherical: new THREE.Spherical(),
      target: new THREE.Vector3(),
      lastPosition: new THREE.Vector3(),
      lastQuaternion: new THREE.Quaternion()
    };
    
    this.setupControls();
  }

  /**
   * 设置相机控制
   * Set up camera controls
   */
  setupControls() {
    // 初始化相机状态
    this.cameraState.target.set(0, 0, 0); // 设置相机目标为原点
    this.cameraState.lastPosition.copy(this.camera.position);
    this.cameraState.lastQuaternion.copy(this.camera.quaternion);
    
    // 绑定事件监听器
    this.domElement.addEventListener('mousedown', (event) => this.onMouseDown(event));
    this.domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
    this.domElement.addEventListener('mouseup', (event) => this.onMouseUp(event));
    this.domElement.addEventListener('wheel', (event) => this.onMouseWheel(event));
    this.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
    
    // 键盘事件
    document.addEventListener('keydown', (event) => this.onKeyDown(event));
    document.addEventListener('keyup', (event) => this.onKeyUp(event));
    
    // 触摸事件支持
    this.domElement.addEventListener('touchstart', (event) => this.onTouchStart(event));
    this.domElement.addEventListener('touchmove', (event) => this.onTouchMove(event));
    this.domElement.addEventListener('touchend', (event) => this.onTouchEnd(event));
  }

  /**
   * 启用对象选择功能
   * Enable object selection functionality
   */
  enableObjectSelection() {
    this.objectSelectionEnabled = true;
  }

  /**
   * 禁用对象选择功能
   * Disable object selection functionality
   */
  disableObjectSelection() {
    this.objectSelectionEnabled = false;
    this.clearSelection();
  }

  /**
   * 处理鼠标按下事件
   * Handle mouse down events
   * @param {MouseEvent} event - 鼠标事件
   */
  onMouseDown(event) {
    event.preventDefault();
    
    this.isMouseDown = true;
    this.mouseButton = event.button; // 记录按下的按钮
    
    // 更新鼠标位置
    this.updateMousePosition(event);
    this.previousMouse.copy(this.mouse);
    
    console.log('鼠标按下 (Mouse down):', event.button, 'Selection enabled:', this.objectSelectionEnabled);
    
    // 对象选择检测
    if (this.objectSelectionEnabled && event.button === 0) {
      this.performObjectSelection();
    }
  }

  /**
   * 处理鼠标移动事件
   * Handle mouse move events
   * @param {MouseEvent} event - 鼠标事件
   */
  onMouseMove(event) {
    event.preventDefault();
    
    // 先保存之前的鼠标位置
    this.previousMouse.copy(this.mouse);
    
    // 更新当前鼠标位置
    this.updateMousePosition(event);
    
    if (this.isMouseDown && this.cameraControls.enabled) {
      this.handleCameraControl(event);
    } else if (this.objectSelectionEnabled && !this.isMouseDown) {
      // 悬停检测 - 只在没有按下鼠标时进行
      this.performHoverDetection();
    }
  }

  /**
   * 处理鼠标释放事件
   * Handle mouse up events
   * @param {MouseEvent} event - 鼠标事件
   */
  onMouseUp(event) {
    event.preventDefault();
    this.isMouseDown = false;
    this.mouseButton = null; // 清除按钮记录
  }

  /**
   * 处理鼠标滚轮事件
   * Handle mouse wheel events
   * @param {WheelEvent} event - 滚轮事件
   */
  onMouseWheel(event) {
    event.preventDefault();
    
    if (!this.cameraControls.enabled) return;
    
    const delta = event.deltaY > 0 ? 1.1 : 0.9;
    this.zoomCamera(delta);
  }

  /**
   * 处理键盘按下事件
   * Handle keyboard down events
   * @param {KeyboardEvent} event - 键盘事件
   */
  onKeyDown(event) {
    switch (event.code) {
      case 'Escape':
        this.clearSelection();
        break;
      case 'KeyR':
        this.resetCamera();
        break;
    }
  }

  /**
   * 处理键盘释放事件
   * Handle keyboard up events
   * @param {KeyboardEvent} event - 键盘事件
   */
  onKeyUp(event) {
    // 键盘释放处理逻辑
  }

  /**
   * 处理触摸开始事件
   * Handle touch start events
   * @param {TouchEvent} event - 触摸事件
   */
  onTouchStart(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      this.updateMousePositionFromTouch(event.touches[0]);
      this.isMouseDown = true;
    }
  }

  /**
   * 处理触摸移动事件
   * Handle touch move events
   * @param {TouchEvent} event - 触摸事件
   */
  onTouchMove(event) {
    event.preventDefault();
    
    if (event.touches.length === 1 && this.isMouseDown) {
      this.updateMousePositionFromTouch(event.touches[0]);
      this.handleCameraControl(event);
    }
  }

  /**
   * 处理触摸结束事件
   * Handle touch end events
   * @param {TouchEvent} event - 触摸事件
   */
  onTouchEnd(event) {
    event.preventDefault();
    this.isMouseDown = false;
  }

  /**
   * 更新鼠标位置
   * Update mouse position
   * @param {MouseEvent} event - 鼠标事件
   */
  updateMousePosition(event) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * 从触摸事件更新鼠标位置
   * Update mouse position from touch event
   * @param {Touch} touch - 触摸对象
   */
  updateMousePositionFromTouch(touch) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * 处理相机控制
   * Handle camera control
   * @param {Event} event - 事件对象
   */
  handleCameraControl(event) {
    const deltaX = this.mouse.x - this.previousMouse.x;
    const deltaY = this.mouse.y - this.previousMouse.y;
    
    // 添加相机操作的视觉反馈
    const interactionIntensity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (interactionIntensity > 0.01) {
      // 在相机目标位置添加微弱的涟漪效果
      this.visualFeedback.addInteractionRipple(this.cameraState.target, interactionIntensity * 0.3);
    }
    
    // 使用记录的按钮状态而不是事件中的按钮
    if (this.mouseButton === 0 || event.touches) {
      // 左键或触摸：旋转
      this.rotateCamera(deltaX, deltaY);
    } else if (this.mouseButton === 2) {
      // 右键：平移
      this.panCamera(deltaX, deltaY);
    }
  }

  /**
   * 旋转相机
   * Rotate camera
   * @param {number} deltaX - X轴变化量
   * @param {number} deltaY - Y轴变化量
   */
  rotateCamera(deltaX, deltaY) {
    const spherical = this.cameraState.spherical;
    spherical.setFromVector3(this.camera.position.clone().sub(this.cameraState.target));
    
    spherical.theta -= deltaX * this.cameraControls.rotateSpeed;
    spherical.phi += deltaY * this.cameraControls.rotateSpeed;
    
    // 限制极角范围
    spherical.phi = Math.max(this.cameraControls.minPolarAngle, 
                           Math.min(this.cameraControls.maxPolarAngle, spherical.phi));
    
    spherical.makeSafe();
    
    this.camera.position.setFromSpherical(spherical).add(this.cameraState.target);
    this.camera.lookAt(this.cameraState.target);
  }

  /**
   * 平移相机
   * Pan camera
   * @param {number} deltaX - X轴变化量
   * @param {number} deltaY - Y轴变化量
   */
  panCamera(deltaX, deltaY) {
    const distance = this.camera.position.distanceTo(this.cameraState.target);
    const panOffset = new THREE.Vector3();
    
    // 计算平移向量
    const panLeft = new THREE.Vector3();
    panLeft.setFromMatrixColumn(this.camera.matrix, 0);
    panLeft.multiplyScalar(-deltaX * distance * this.cameraControls.panSpeed);
    
    const panUp = new THREE.Vector3();
    panUp.setFromMatrixColumn(this.camera.matrix, 1);
    panUp.multiplyScalar(deltaY * distance * this.cameraControls.panSpeed);
    
    panOffset.add(panLeft).add(panUp);
    
    this.camera.position.add(panOffset);
    this.cameraState.target.add(panOffset);
  }

  /**
   * 缩放相机
   * Zoom camera
   * @param {number} scale - 缩放比例
   */
  zoomCamera(scale) {
    const distance = this.camera.position.distanceTo(this.cameraState.target);
    const newDistance = distance * scale;
    
    // 限制缩放范围
    if (newDistance < this.cameraControls.minDistance || 
        newDistance > this.cameraControls.maxDistance) {
      // 添加边界反馈效果
      this.addBoundaryFeedback();
      return;
    }
    
    const direction = this.camera.position.clone().sub(this.cameraState.target).normalize();
    this.camera.position.copy(this.cameraState.target).add(direction.multiplyScalar(newDistance));
    
    // 添加缩放操作的视觉反馈
    const zoomIntensity = Math.abs(scale - 1.0) * 2.0;
    this.visualFeedback.addInteractionRipple(this.cameraState.target, zoomIntensity);
  }

  /**
   * 执行对象选择
   * Perform object selection
   */
  performObjectSelection() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      // 查找第一个可选择的对象
      let selectedObject = null;
      for (const intersect of intersects) {
        const object = intersect.object;
        // 检查对象是否可选择（默认为可选择，除非明确设置为false）
        if (object.userData.selectable !== false) {
          selectedObject = object;
          break;
        }
      }
      
      if (selectedObject) {
        this.setSelectedObject(selectedObject);
      } else {
        this.clearSelection();
      }
    } else {
      this.clearSelection();
    }
  }

  /**
   * 执行悬停检测
   * Perform hover detection
   */
  performHoverDetection() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      // 查找第一个可悬停的对象
      let hoveredObject = null;
      for (const intersect of intersects) {
        const object = intersect.object;
        // 检查对象是否可悬停（默认为可悬停，除非明确设置为false）
        if (object.userData.selectable !== false) {
          hoveredObject = object;
          break;
        }
      }
      
      if (hoveredObject) {
        this.setHoveredObject(hoveredObject);
      } else {
        this.clearHover();
      }
    } else {
      this.clearHover();
    }
  }

  /**
   * 设置选中对象
   * Set selected object
   * @param {THREE.Object3D} object - 选中的对象
   */
  setSelectedObject(object) {
    if (this.selectedObject === object) return;
    
    // 清除之前的选择
    this.clearSelection();
    
    this.selectedObject = object;
    
    // 使用视觉反馈系统添加选择效果
    this.visualFeedback.addSelectionEffect(object);
    
    // 添加选择交互涟漪效果
    const worldPosition = new THREE.Vector3();
    object.getWorldPosition(worldPosition);
    this.visualFeedback.addInteractionRipple(worldPosition, 1.0);
    
    // 添加脉冲效果以增强选择反馈
    this.visualFeedback.addPulseEffect(object, 1500);
    
    // 触发选择事件
    this.dispatchEvent('objectSelected', { object });
  }

  /**
   * 设置悬停对象
   * Set hovered object
   * @param {THREE.Object3D} object - 悬停的对象
   */
  setHoveredObject(object) {
    if (this.hoveredObject === object) return;
    
    // 清除之前的悬停
    this.clearHover();
    
    this.hoveredObject = object;
    
    // 使用视觉反馈系统添加悬停效果
    this.visualFeedback.addHoverEffect(object);
    
    // 添加交互涟漪效果
    const worldPosition = new THREE.Vector3();
    object.getWorldPosition(worldPosition);
    this.visualFeedback.addInteractionRipple(worldPosition, 0.5);
    
    // 触发悬停事件
    this.dispatchEvent('objectHovered', { object });
  }

  /**
   * 清除选择
   * Clear selection
   */
  clearSelection() {
    if (this.selectedObject) {
      // 使用视觉反馈系统移除选择效果
      this.visualFeedback.removeSelectionEffect(this.selectedObject);
      this.selectedObject = null;
      this.dispatchEvent('selectionCleared');
    }
  }

  /**
   * 清除悬停
   * Clear hover
   */
  clearHover() {
    if (this.hoveredObject) {
      // 使用视觉反馈系统移除悬停效果
      this.visualFeedback.removeHoverEffect(this.hoveredObject);
      this.hoveredObject = null;
      this.dispatchEvent('hoverCleared');
    }
  }

  /**
   * 添加选择高亮效果
   * Add selection highlight effect
   * @param {THREE.Object3D} object - 对象
   */
  addSelectionHighlight(object) {
    // 实现选择高亮效果
    if (object.material) {
      object.userData.originalEmissive = object.material.emissive?.clone();
      if (object.material.emissive) {
        object.material.emissive.setHex(0x444444);
      }
    }
  }

  /**
   * 添加悬停高亮效果
   * Add hover highlight effect
   * @param {THREE.Object3D} object - 对象
   */
  addHoverHighlight(object) {
    // 实现悬停高亮效果
    if (object.material && !object.userData.originalEmissive) {
      object.userData.originalEmissive = object.material.emissive?.clone();
      if (object.material.emissive) {
        object.material.emissive.setHex(0x222222);
      }
    }
  }

  /**
   * 移除选择高亮效果
   * Remove selection highlight effect
   * @param {THREE.Object3D} object - 对象
   */
  removeSelectionHighlight(object) {
    if (object.material && object.userData.originalEmissive) {
      if (object.material.emissive) {
        object.material.emissive.copy(object.userData.originalEmissive);
      }
      delete object.userData.originalEmissive;
    }
  }

  /**
   * 移除悬停高亮效果
   * Remove hover highlight effect
   * @param {THREE.Object3D} object - 对象
   */
  removeHoverHighlight(object) {
    if (object.material && object.userData.originalEmissive && !this.selectedObject) {
      if (object.material.emissive) {
        object.material.emissive.copy(object.userData.originalEmissive);
      }
      delete object.userData.originalEmissive;
    }
  }

  /**
   * 重置相机位置
   * Reset camera position
   */
  resetCamera() {
    this.camera.position.set(0, 5, 10);
    this.cameraState.target.set(0, 0, 0);
    this.camera.lookAt(this.cameraState.target);
  }

  /**
   * 更新交互状态
   * Update interaction state
   */
  updateInteractions() {
    // 更新视觉反馈系统
    this.visualFeedback.update();
    
    // 更新交互相关的状态
  }

  /**
   * 添加边界反馈效果
   * Add boundary feedback effect
   */
  addBoundaryFeedback() {
    // 在相机目标位置添加红色警告涟漪
    const warningPosition = this.cameraState.target.clone();
    
    // 创建临时的红色涟漪材质
    const warningGeometry = new THREE.RingGeometry(0, 0.1, 16);
    const warningMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const warningRipple = new THREE.Mesh(warningGeometry, warningMaterial);
    warningRipple.position.copy(warningPosition);
    warningRipple.lookAt(warningPosition.clone().add(new THREE.Vector3(0, 1, 0)));
    
    this.scene.add(warningRipple);
    
    // 动画警告涟漪
    const startTime = performance.now();
    const duration = 400;
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        this.scene.remove(warningRipple);
        warningRipple.geometry.dispose();
        warningRipple.material.dispose();
        return;
      }
      
      const radius = 1.5 * progress;
      const opacity = (1 - progress) * 0.8;
      
      warningRipple.geometry.dispose();
      warningRipple.geometry = new THREE.RingGeometry(radius * 0.8, radius, 16);
      warningRipple.material.opacity = opacity;
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * 添加操作成功反馈
   * Add operation success feedback
   * @param {THREE.Vector3} position - 反馈位置
   */
  addSuccessFeedback(position) {
    // 绿色成功涟漪效果
    this.visualFeedback.addInteractionRipple(position, 0.8);
    
    // 可以添加音效或其他反馈（在实际项目中）
    this.dispatchEvent('operationSuccess', { position });
  }

  /**
   * 添加操作失败反馈
   * Add operation failure feedback
   * @param {THREE.Vector3} position - 反馈位置
   */
  addFailureFeedback(position) {
    // 使用边界反馈的红色效果
    this.addBoundaryFeedback();
    
    this.dispatchEvent('operationFailure', { position });
  }

  /**
   * 分发自定义事件
   * Dispatch custom event
   * @param {string} type - 事件类型
   * @param {Object} detail - 事件详情
   */
  dispatchEvent(type, detail = {}) {
    const event = new CustomEvent(type, { detail });
    this.domElement.dispatchEvent(event);
  }

  /**
   * 销毁交互控制器
   * Destroy interaction controller
   */
  destroy() {
    // 移除事件监听器
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onMouseWheel);
    this.domElement.removeEventListener('contextmenu', (event) => event.preventDefault());
    
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    
    this.domElement.removeEventListener('touchstart', this.onTouchStart);
    this.domElement.removeEventListener('touchmove', this.onTouchMove);
    this.domElement.removeEventListener('touchend', this.onTouchEnd);
    
    // 清除选择和悬停状态
    this.clearSelection();
    this.clearHover();
    
    // 销毁视觉反馈系统
    this.visualFeedback.destroy();
  }
}