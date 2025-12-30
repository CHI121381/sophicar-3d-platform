/**
 * 模型导入界面测试
 * Model Import Interface Tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModelImportInterface } from '../../src/components/ModelImportInterface.js';

// Mock DOM environment
const Object3D = class Object3D {
  constructor() {
    this.children = [];
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = { x: 1, y: 1, z: 1 };
  }
  
  clone() {
    return new this.constructor();
  }
  
  traverse(callback) {
    callback(this);
    this.children.forEach(child => child.traverse(callback));
  }
};

Object.defineProperty(window, 'THREE', {
  value: {
    Object3D,
    Scene: class Scene extends Object3D {},
    PerspectiveCamera: class PerspectiveCamera {
      constructor(fov, aspect, near, far) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.position = { set: vi.fn() };
        this.lookAt = vi.fn();
      }
    },
    WebGLRenderer: class WebGLRenderer {
      constructor(options) {
        this.domElement = document.createElement('canvas');
        this.shadowMap = { enabled: false, type: null };
      }
      setSize() {}
      render() {}
    },
    AmbientLight: class AmbientLight extends Object3D {},
    DirectionalLight: class DirectionalLight extends Object3D {
      constructor() {
        super();
        this.position = { set: vi.fn() };
        this.castShadow = false;
      }
    },
    Box3: class Box3 {
      setFromObject() { return this; }
      getCenter() { return { x: 0, y: 0, z: 0 }; }
      getSize() { return { x: 1, y: 1, z: 1 }; }
    },
    Vector3: class Vector3 {
      constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
    },
    Color: class Color {
      constructor(color) {
        this.r = 1;
        this.g = 1;
        this.b = 1;
      }
    },
    PCFSoftShadowMap: 'PCFSoftShadowMap'
  }
});

describe('ModelImportInterface', () => {
  let container;
  let modelImportInterface;

  beforeEach(() => {
    // 创建测试容器
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Mock CustomEvent
    global.CustomEvent = class CustomEvent extends Event {
      constructor(type, options = {}) {
        super(type);
        this.detail = options.detail;
      }
    };
  });

  afterEach(() => {
    // 清理
    if (modelImportInterface) {
      modelImportInterface.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('初始化 (Initialization)', () => {
    it('应该正确初始化模型导入界面 (should initialize model import interface correctly)', () => {
      modelImportInterface = new ModelImportInterface(container);
      
      expect(modelImportInterface).toBeDefined();
      expect(modelImportInterface.container).toBe(container);
      expect(modelImportInterface.modelLoader).toBeDefined();
      expect(modelImportInterface.interfaceElement).toBeDefined();
    });

    it('应该创建必要的UI元素 (should create necessary UI elements)', () => {
      modelImportInterface = new ModelImportInterface(container);
      
      const interfaceElement = container.querySelector('.model-import-interface');
      expect(interfaceElement).toBeTruthy();
      
      const dropZone = interfaceElement.querySelector('#dropZone');
      expect(dropZone).toBeTruthy();
      
      const fileInput = interfaceElement.querySelector('#fileInput');
      expect(fileInput).toBeTruthy();
      
      const previewContainer = interfaceElement.querySelector('#previewContainer');
      expect(previewContainer).toBeTruthy();
    });

    it('应该设置默认选项 (should set default options)', () => {
      modelImportInterface = new ModelImportInterface(container);
      
      expect(modelImportInterface.options.maxFileSize).toBe(50 * 1024 * 1024);
      expect(modelImportInterface.options.allowedFormats).toEqual(['gltf', 'glb', 'obj', 'fbx']);
      expect(modelImportInterface.options.showPreview).toBe(true);
      expect(modelImportInterface.options.autoImport).toBe(false);
    });

    it('应该接受自定义选项 (should accept custom options)', () => {
      const customOptions = {
        maxFileSize: 100 * 1024 * 1024,
        allowedFormats: ['gltf', 'glb'],
        showPreview: false,
        autoImport: true
      };
      
      modelImportInterface = new ModelImportInterface(container, customOptions);
      
      expect(modelImportInterface.options.maxFileSize).toBe(100 * 1024 * 1024);
      expect(modelImportInterface.options.allowedFormats).toEqual(['gltf', 'glb']);
      expect(modelImportInterface.options.showPreview).toBe(false);
      expect(modelImportInterface.options.autoImport).toBe(true);
    });
  });

  describe('文件验证 (File Validation)', () => {
    beforeEach(() => {
      modelImportInterface = new ModelImportInterface(container);
    });

    it('应该验证有效的GLTF文件 (should validate valid GLTF file)', () => {
      const file = new File(['test'], 'model.gltf', { type: 'model/gltf+json' });
      const result = modelImportInterface.validateFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('应该验证有效的GLB文件 (should validate valid GLB file)', () => {
      const file = new File(['test'], 'model.glb', { type: 'model/gltf-binary' });
      const result = modelImportInterface.validateFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('应该拒绝过大的文件 (should reject oversized files)', () => {
      // 创建一个超过限制的文件大小
      const largeSize = 100 * 1024 * 1024; // 100MB
      const file = new File(['x'.repeat(largeSize)], 'large.gltf', { type: 'model/gltf+json' });
      
      // 模拟文件大小
      Object.defineProperty(file, 'size', { value: largeSize });
      
      const result = modelImportInterface.validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('文件过大');
    });

    it('应该拒绝不支持的文件格式 (should reject unsupported file formats)', () => {
      const file = new File(['test'], 'model.dae', { type: 'application/xml' });
      const result = modelImportInterface.validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('不支持的文件格式');
    });
  });

  describe('界面状态管理 (Interface State Management)', () => {
    beforeEach(() => {
      modelImportInterface = new ModelImportInterface(container);
    });

    it('应该正确更新界面状态 (should correctly update interface state)', () => {
      // 测试文件选择状态
      modelImportInterface.updateInterfaceState('file-selected');
      
      const fileInfoSection = modelImportInterface.interfaceElement.querySelector('.file-info-section');
      const importOptionsSection = modelImportInterface.interfaceElement.querySelector('.import-options');
      
      expect(fileInfoSection.style.display).toBe('block');
      expect(importOptionsSection.style.display).toBe('block');
    });

    it('应该显示和隐藏界面 (should show and hide interface)', () => {
      // 初始状态应该是隐藏的 (CSS sets display: none initially)
      // The interface element has display: none set in CSS by default
      const computedStyle = window.getComputedStyle(modelImportInterface.interfaceElement);
      expect(computedStyle.display === 'none' || modelImportInterface.interfaceElement.style.display === 'none').toBe(true);
      
      // 显示界面
      modelImportInterface.show();
      expect(modelImportInterface.interfaceElement.style.display).toBe('block');
      expect(modelImportInterface.interfaceElement.classList.contains('show')).toBe(true);
      
      // 隐藏界面
      modelImportInterface.hide();
      expect(modelImportInterface.interfaceElement.classList.contains('show')).toBe(false);
    });

    it('应该正确重置界面状态 (should correctly reset interface state)', () => {
      // 设置一些状态
      modelImportInterface.currentFile = new File(['test'], 'test.gltf');
      modelImportInterface.updateInterfaceState('file-selected');
      
      // 重置状态
      modelImportInterface.reset();
      
      expect(modelImportInterface.currentFile).toBeNull();
      expect(modelImportInterface.currentModel).toBeNull();
      expect(modelImportInterface.importProgress.status).toBe('idle');
    });
  });

  describe('进度管理 (Progress Management)', () => {
    beforeEach(() => {
      modelImportInterface = new ModelImportInterface(container);
    });

    it('应该正确更新导入进度 (should correctly update import progress)', () => {
      modelImportInterface.updateImportProgress('loading', 50, '加载中...');
      
      expect(modelImportInterface.importProgress.status).toBe('loading');
      expect(modelImportInterface.importProgress.progress).toBe(50);
      expect(modelImportInterface.importProgress.message).toBe('加载中...');
      
      const progressFill = modelImportInterface.interfaceElement.querySelector('#progressFill');
      const progressPercent = modelImportInterface.interfaceElement.querySelector('#progressPercent');
      const progressMessage = modelImportInterface.interfaceElement.querySelector('#progressMessage');
      
      expect(progressFill.style.width).toBe('50%');
      expect(progressPercent.textContent).toBe('50%');
      expect(progressMessage.textContent).toBe('加载中...');
    });

    it('应该处理加载进度事件 (should handle loading progress events)', () => {
      const progressData = {
        status: 'loading',
        progress: 75,
        message: '处理中...'
      };
      
      modelImportInterface.handleLoadProgress(progressData);
      
      expect(modelImportInterface.importProgress.status).toBe('processing');
      expect(modelImportInterface.importProgress.progress).toBe(75);
      expect(modelImportInterface.importProgress.message).toBe('处理中...');
    });
  });

  describe('文件信息显示 (File Information Display)', () => {
    beforeEach(() => {
      modelImportInterface = new ModelImportInterface(container);
    });

    it('应该正确显示文件信息 (should correctly display file information)', () => {
      const file = new File(['test content'], 'test-model.gltf', { type: 'model/gltf+json' });
      
      modelImportInterface.displayFileInfo(file);
      
      const fileName = modelImportInterface.interfaceElement.querySelector('#fileName');
      const fileFormat = modelImportInterface.interfaceElement.querySelector('#fileFormat');
      
      expect(fileName.textContent).toBe('test-model.gltf');
      expect(fileFormat.textContent).toBe('GLTF');
    });

    it('应该格式化文件大小 (should format file size)', () => {
      expect(modelImportInterface.formatFileSize(0)).toBe('0 Bytes');
      expect(modelImportInterface.formatFileSize(1024)).toBe('1 KB');
      expect(modelImportInterface.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(modelImportInterface.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('导入选项 (Import Options)', () => {
    beforeEach(() => {
      modelImportInterface = new ModelImportInterface(container);
    });

    it('应该获取正确的导入选项 (should get correct import options)', () => {
      // 设置一些选项
      const centerCheckbox = modelImportInterface.interfaceElement.querySelector('#centerModel');
      const shadowsCheckbox = modelImportInterface.interfaceElement.querySelector('#enableShadows');
      const optimizeCheckbox = modelImportInterface.interfaceElement.querySelector('#optimizeMaterials');
      const scaleSlider = modelImportInterface.interfaceElement.querySelector('#scaleSlider');
      
      centerCheckbox.checked = true;
      shadowsCheckbox.checked = false;
      optimizeCheckbox.checked = true;
      scaleSlider.value = '2.5';
      
      const options = modelImportInterface.getImportOptions();
      
      expect(options.center).toBe(true);
      expect(options.castShadow).toBe(false);
      expect(options.receiveShadow).toBe(false);
      expect(options.optimizeMaterials).toBe(true);
      expect(options.scale).toBe(2.5);
    });
  });

  describe('错误处理 (Error Handling)', () => {
    beforeEach(() => {
      modelImportInterface = new ModelImportInterface(container);
    });

    it('应该显示错误消息 (should show error messages)', () => {
      const errorMessage = '测试错误消息';
      modelImportInterface.showError(errorMessage);
      
      const statusMessage = modelImportInterface.interfaceElement.querySelector('#statusMessage');
      expect(statusMessage.textContent).toBe(errorMessage);
      expect(statusMessage.classList.contains('error')).toBe(true);
      expect(statusMessage.style.display).toBe('block');
    });

    it('应该显示成功消息 (should show success messages)', () => {
      const successMessage = '操作成功';
      modelImportInterface.showSuccess(successMessage);
      
      const statusMessage = modelImportInterface.interfaceElement.querySelector('#statusMessage');
      expect(statusMessage.textContent).toBe(successMessage);
      expect(statusMessage.classList.contains('success')).toBe(true);
      expect(statusMessage.style.display).toBe('block');
    });
  });

  describe('事件处理 (Event Handling)', () => {
    beforeEach(() => {
      modelImportInterface = new ModelImportInterface(container);
    });

    it('应该处理关闭按钮点击 (should handle close button click)', () => {
      const closeBtn = modelImportInterface.interfaceElement.querySelector('.close-btn');
      
      // 显示界面
      modelImportInterface.show();
      expect(modelImportInterface.interfaceElement.classList.contains('show')).toBe(true);
      
      // 点击关闭按钮
      closeBtn.click();
      expect(modelImportInterface.interfaceElement.classList.contains('show')).toBe(false);
    });

    it('应该处理拖拽区域点击 (should handle drop zone click)', () => {
      const fileInput = modelImportInterface.interfaceElement.querySelector('#fileInput');
      const clickSpy = vi.spyOn(fileInput, 'click');
      
      const dropZone = modelImportInterface.interfaceElement.querySelector('#dropZone');
      dropZone.click();
      
      expect(clickSpy).toHaveBeenCalled();
    });

    it('应该处理缩放滑块变化 (should handle scale slider changes)', () => {
      const scaleSlider = modelImportInterface.interfaceElement.querySelector('#scaleSlider');
      const scaleValue = modelImportInterface.interfaceElement.querySelector('#scaleValue');
      
      scaleSlider.value = '3.0';
      scaleSlider.dispatchEvent(new Event('input'));
      
      expect(scaleValue.textContent).toBe('3.0');
    });
  });

  describe('销毁 (Destruction)', () => {
    it('应该正确销毁界面 (should properly destroy interface)', () => {
      modelImportInterface = new ModelImportInterface(container);
      
      // 验证界面已创建
      expect(container.querySelector('.model-import-interface')).toBeTruthy();
      
      // 销毁界面
      modelImportInterface.destroy();
      
      // 验证界面已移除
      expect(container.querySelector('.model-import-interface')).toBeFalsy();
    });
  });
});