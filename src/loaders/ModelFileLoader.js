/**
 * 模型文件加载器 - 处理各种3D模型格式的加载和验证
 * ModelFileLoader - Handle loading and validation of various 3D model formats
 */
import * as THREE from 'three';
import { GLTFLoader } from '../../jsm/loaders/GLTFLoader.js';
import { OBJLoader } from '../../jsm/loaders/OBJLoader.js';
import { FBXLoader } from '../../jsm/loaders/FBXLoader.js';

export class ModelFileLoader {
  /**
   * 构造函数 - 初始化模型文件加载器
   * Constructor - Initialize model file loader
   */
  constructor() {
    // 初始化各种格式的加载器
    this.gltfLoader = new GLTFLoader();
    this.objLoader = new OBJLoader();
    this.fbxLoader = new FBXLoader();
    
    // 支持的文件格式
    this.supportedFormats = {
      'gltf': { loader: 'gltf', extensions: ['.gltf'], mimeTypes: ['model/gltf+json'] },
      'glb': { loader: 'gltf', extensions: ['.glb'], mimeTypes: ['model/gltf-binary'] },
      'obj': { loader: 'obj', extensions: ['.obj'], mimeTypes: ['text/plain', 'application/octet-stream'] },
      'fbx': { loader: 'fbx', extensions: ['.fbx'], mimeTypes: ['application/octet-stream'] }
    };
    
    // 加载状态跟踪
    this.loadingProgress = new Map();
    this.loadedModels = new Map();
    
    // 错误处理配置
    this.maxRetries = 3;
    this.retryDelay = 1000; // 毫秒
    
    console.log('ModelFileLoader: 模型文件加载器初始化完成');
  }

  /**
   * 加载模型文件
   * Load model file
   * @param {string|File} source - 文件路径或File对象
   * @param {Object} options - 加载选项
   * @returns {Promise<THREE.Object3D>} 加载的3D对象
   */
  async loadModel(source, options = {}) {
    try {
      // 验证输入参数
      if (!source || (typeof source === 'string' && source.trim() === '')) {
        throw new Error('模型源不能为空');
      }
      
      // 确定文件格式
      const format = this.detectFileFormat(source);
      if (!format) {
        throw new Error('不支持的文件格式');
      }
      
      // 生成加载ID用于进度跟踪
      const loadId = this.generateLoadId(source);
      
      // 初始化加载进度
      this.initializeLoadingProgress(loadId);
      
      // 根据格式选择加载方法
      let model;
      if (typeof source === 'string') {
        model = await this.loadFromUrl(source, format, loadId, options);
      } else if (source instanceof File) {
        model = await this.loadFromFile(source, format, loadId, options);
      } else {
        throw new Error('无效的模型源类型');
      }
      
      // 验证加载的模型
      this.validateLoadedModel(model);
      
      // 应用后处理
      model = this.postProcessModel(model, options);
      
      // 缓存模型
      this.loadedModels.set(loadId, model);
      
      // 完成加载进度
      this.completeLoadingProgress(loadId);
      
      console.log(`ModelFileLoader: 模型加载成功 - ${loadId}`);
      return model;
      
    } catch (error) {
      console.error('ModelFileLoader: 模型加载失败', error);
      throw error;
    }
  }

  /**
   * 从URL加载模型
   * Load model from URL
   * @param {string} url - 模型文件URL
   * @param {string} format - 文件格式
   * @param {string} loadId - 加载ID
   * @param {Object} options - 加载选项
   * @returns {Promise<THREE.Object3D>} 加载的3D对象
   */
  async loadFromUrl(url, format, loadId, options) {
    const formatConfig = this.supportedFormats[format];
    let retries = 0;
    
    while (retries <= this.maxRetries) {
      try {
        this.updateLoadingProgress(loadId, 'loading', `正在加载 ${url}...`);
        
        let model;
        switch (formatConfig.loader) {
          case 'gltf':
            model = await this.loadGLTF(url, loadId);
            break;
          case 'obj':
            model = await this.loadOBJ(url, loadId);
            break;
          case 'fbx':
            model = await this.loadFBX(url, loadId);
            break;
          default:
            throw new Error(`不支持的加载器类型: ${formatConfig.loader}`);
        }
        
        return model;
        
      } catch (error) {
        retries++;
        if (retries > this.maxRetries) {
          throw new Error(`加载失败，已重试 ${this.maxRetries} 次: ${error.message}`);
        }
        
        this.updateLoadingProgress(loadId, 'retrying', `重试中 (${retries}/${this.maxRetries})...`);
        await this.delay(this.retryDelay * retries);
      }
    }
  }

  /**
   * 从文件对象加载模型
   * Load model from File object
   * @param {File} file - 文件对象
   * @param {string} format - 文件格式
   * @param {string} loadId - 加载ID
   * @param {Object} options - 加载选项
   * @returns {Promise<THREE.Object3D>} 加载的3D对象
   */
  async loadFromFile(file, format, loadId, options) {
    try {
      this.updateLoadingProgress(loadId, 'reading', '正在读取文件...');
      
      // 验证文件大小
      const maxSize = options.maxFileSize || 50 * 1024 * 1024; // 默认50MB
      if (file.size > maxSize) {
        throw new Error(`文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB > ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
      }
      
      // 读取文件内容
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      
      // 创建临时URL
      const blob = new Blob([arrayBuffer], { type: file.type });
      const url = URL.createObjectURL(blob);
      
      try {
        // 使用临时URL加载模型
        const model = await this.loadFromUrl(url, format, loadId, options);
        return model;
      } finally {
        // 清理临时URL
        URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      throw new Error(`文件读取失败: ${error.message}`);
    }
  }

  /**
   * 加载GLTF/GLB格式模型
   * Load GLTF/GLB format model
   * @param {string} url - 模型URL
   * @param {string} loadId - 加载ID
   * @returns {Promise<THREE.Object3D>} 加载的3D对象
   */
  loadGLTF(url, loadId) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          this.updateLoadingProgress(loadId, 'processing', '正在处理GLTF模型...');
          resolve(gltf.scene);
        },
        (progress) => {
          const percent = progress.loaded / progress.total * 100;
          this.updateLoadingProgress(loadId, 'loading', `加载中... ${percent.toFixed(1)}%`);
        },
        (error) => {
          reject(new Error(`GLTF加载失败: ${error.message}`));
        }
      );
    });
  }

  /**
   * 加载OBJ格式模型
   * Load OBJ format model
   * @param {string} url - 模型URL
   * @param {string} loadId - 加载ID
   * @returns {Promise<THREE.Object3D>} 加载的3D对象
   */
  loadOBJ(url, loadId) {
    return new Promise((resolve, reject) => {
      this.objLoader.load(
        url,
        (object) => {
          this.updateLoadingProgress(loadId, 'processing', '正在处理OBJ模型...');
          resolve(object);
        },
        (progress) => {
          if (progress.lengthComputable) {
            const percent = progress.loaded / progress.total * 100;
            this.updateLoadingProgress(loadId, 'loading', `加载中... ${percent.toFixed(1)}%`);
          }
        },
        (error) => {
          reject(new Error(`OBJ加载失败: ${error.message}`));
        }
      );
    });
  }

  /**
   * 加载FBX格式模型
   * Load FBX format model
   * @param {string} url - 模型URL
   * @param {string} loadId - 加载ID
   * @returns {Promise<THREE.Object3D>} 加载的3D对象
   */
  loadFBX(url, loadId) {
    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        url,
        (object) => {
          this.updateLoadingProgress(loadId, 'processing', '正在处理FBX模型...');
          resolve(object);
        },
        (progress) => {
          if (progress.lengthComputable) {
            const percent = progress.loaded / progress.total * 100;
            this.updateLoadingProgress(loadId, 'loading', `加载中... ${percent.toFixed(1)}%`);
          }
        },
        (error) => {
          reject(new Error(`FBX加载失败: ${error.message}`));
        }
      );
    });
  }

  /**
   * 检测文件格式
   * Detect file format
   * @param {string|File} source - 文件源
   * @returns {string|null} 检测到的格式
   */
  detectFileFormat(source) {
    let filename, mimeType;
    
    if (typeof source === 'string') {
      filename = source.toLowerCase();
      mimeType = null;
    } else if (source instanceof File) {
      filename = source.name.toLowerCase();
      mimeType = source.type;
    } else {
      return null;
    }
    
    // 首先通过文件扩展名检测
    for (const [format, config] of Object.entries(this.supportedFormats)) {
      if (config.extensions.some(ext => filename.endsWith(ext))) {
        return format;
      }
    }
    
    // 如果有MIME类型，通过MIME类型检测
    if (mimeType) {
      for (const [format, config] of Object.entries(this.supportedFormats)) {
        if (config.mimeTypes.includes(mimeType)) {
          return format;
        }
      }
    }
    
    return null;
  }

  /**
   * 验证加载的模型
   * Validate loaded model
   * @param {THREE.Object3D} model - 加载的模型
   */
  validateLoadedModel(model) {
    if (!model) {
      throw new Error('模型加载结果为空');
    }
    
    if (!(model instanceof THREE.Object3D)) {
      throw new Error('加载的对象不是有效的Three.js 3D对象');
    }
    
    // 检查模型是否包含几何体
    let hasGeometry = false;
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        hasGeometry = true;
      }
    });
    
    if (!hasGeometry) {
      console.warn('ModelFileLoader: 警告 - 模型不包含可见的几何体');
    }
  }

  /**
   * 后处理模型
   * Post-process model
   * @param {THREE.Object3D} model - 原始模型
   * @param {Object} options - 处理选项
   * @returns {THREE.Object3D} 处理后的模型
   */
  postProcessModel(model, options = {}) {
    // 应用缩放
    if (options.scale) {
      if (typeof options.scale === 'number') {
        model.scale.setScalar(options.scale);
      } else if (options.scale.x !== undefined) {
        model.scale.set(options.scale.x, options.scale.y, options.scale.z);
      }
    }
    
    // 应用位置
    if (options.position) {
      model.position.set(options.position.x || 0, options.position.y || 0, options.position.z || 0);
    }
    
    // 应用旋转
    if (options.rotation) {
      model.rotation.set(options.rotation.x || 0, options.rotation.y || 0, options.rotation.z || 0);
    }
    
    // 居中模型
    if (options.center) {
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
    }
    
    // 启用阴影
    if (options.castShadow || options.receiveShadow) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (options.castShadow) child.castShadow = true;
          if (options.receiveShadow) child.receiveShadow = true;
        }
      });
    }
    
    // 优化材质
    if (options.optimizeMaterials !== false) {
      this.optimizeMaterials(model);
    }
    
    return model;
  }

  /**
   * 优化材质
   * Optimize materials
   * @param {THREE.Object3D} model - 模型对象
   */
  optimizeMaterials(model) {
    const materialMap = new Map();
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material;
        
        // 为材质生成唯一标识
        const materialKey = this.generateMaterialKey(material);
        
        if (materialMap.has(materialKey)) {
          // 重用已存在的材质
          child.material = materialMap.get(materialKey);
        } else {
          // 缓存新材质
          materialMap.set(materialKey, material);
        }
      }
    });
    
    console.log(`ModelFileLoader: 材质优化完成，共 ${materialMap.size} 个唯一材质`);
  }

  /**
   * 生成材质唯一标识
   * Generate material unique key
   * @param {THREE.Material} material - 材质对象
   * @returns {string} 材质标识
   */
  generateMaterialKey(material) {
    const props = [];
    
    if (material.color) props.push(`color:${material.color.getHexString()}`);
    if (material.map) props.push(`map:${material.map.uuid}`);
    if (material.normalMap) props.push(`normal:${material.normalMap.uuid}`);
    if (material.roughness !== undefined) props.push(`roughness:${material.roughness}`);
    if (material.metalness !== undefined) props.push(`metalness:${material.metalness}`);
    
    return `${material.type}:${props.join(',')}`;
  }

  /**
   * 读取文件为ArrayBuffer
   * Read file as ArrayBuffer
   * @param {File} file - 文件对象
   * @returns {Promise<ArrayBuffer>} 文件内容
   */
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 生成加载ID
   * Generate load ID
   * @param {string|File} source - 文件源
   * @returns {string} 加载ID
   */
  generateLoadId(source) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    
    if (typeof source === 'string') {
      const filename = source.split('/').pop() || 'unknown';
      return `${filename}_${timestamp}_${random}`;
    } else if (source instanceof File) {
      return `${source.name}_${timestamp}_${random}`;
    }
    
    return `model_${timestamp}_${random}`;
  }

  /**
   * 初始化加载进度
   * Initialize loading progress
   * @param {string} loadId - 加载ID
   */
  initializeLoadingProgress(loadId) {
    this.loadingProgress.set(loadId, {
      status: 'initializing',
      message: '初始化加载...',
      progress: 0,
      startTime: Date.now()
    });
  }

  /**
   * 更新加载进度
   * Update loading progress
   * @param {string} loadId - 加载ID
   * @param {string} status - 状态
   * @param {string} message - 消息
   * @param {number} progress - 进度百分比
   */
  updateLoadingProgress(loadId, status, message, progress = null) {
    const progressInfo = this.loadingProgress.get(loadId);
    if (progressInfo) {
      progressInfo.status = status;
      progressInfo.message = message;
      if (progress !== null) {
        progressInfo.progress = progress;
      }
      
      // 触发进度更新事件
      this.dispatchProgressEvent(loadId, progressInfo);
    }
  }

  /**
   * 完成加载进度
   * Complete loading progress
   * @param {string} loadId - 加载ID
   */
  completeLoadingProgress(loadId) {
    const progressInfo = this.loadingProgress.get(loadId);
    if (progressInfo) {
      progressInfo.status = 'completed';
      progressInfo.message = '加载完成';
      progressInfo.progress = 100;
      progressInfo.endTime = Date.now();
      progressInfo.duration = progressInfo.endTime - progressInfo.startTime;
      
      // 触发完成事件
      this.dispatchProgressEvent(loadId, progressInfo);
      
      // 清理进度信息
      setTimeout(() => {
        this.loadingProgress.delete(loadId);
      }, 5000);
    }
  }

  /**
   * 分发进度事件
   * Dispatch progress event
   * @param {string} loadId - 加载ID
   * @param {Object} progressInfo - 进度信息
   */
  dispatchProgressEvent(loadId, progressInfo) {
    const event = new CustomEvent('modelLoadProgress', {
      detail: {
        loadId,
        ...progressInfo
      }
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  /**
   * 延迟函数
   * Delay function
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise} 延迟Promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取支持的文件格式
   * Get supported file formats
   * @returns {Object} 支持的格式配置
   */
  getSupportedFormats() {
    return { ...this.supportedFormats };
  }

  /**
   * 检查格式是否支持
   * Check if format is supported
   * @param {string} format - 文件格式
   * @returns {boolean} 是否支持
   */
  isFormatSupported(format) {
    return this.supportedFormats.hasOwnProperty(format.toLowerCase());
  }

  /**
   * 获取加载进度
   * Get loading progress
   * @param {string} loadId - 加载ID
   * @returns {Object|null} 进度信息
   */
  getLoadingProgress(loadId) {
    return this.loadingProgress.get(loadId) || null;
  }

  /**
   * 获取已加载的模型
   * Get loaded model
   * @param {string} loadId - 加载ID
   * @returns {THREE.Object3D|null} 模型对象
   */
  getLoadedModel(loadId) {
    return this.loadedModels.get(loadId) || null;
  }

  /**
   * 清理已加载的模型
   * Clear loaded model
   * @param {string} loadId - 加载ID
   * @returns {boolean} 是否成功清理
   */
  clearLoadedModel(loadId) {
    const model = this.loadedModels.get(loadId);
    if (model) {
      // 清理几何体和材质
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      
      this.loadedModels.delete(loadId);
      return true;
    }
    
    return false;
  }

  /**
   * 销毁加载器
   * Destroy loader
   */
  destroy() {
    // 清理所有已加载的模型
    for (const loadId of this.loadedModels.keys()) {
      this.clearLoadedModel(loadId);
    }
    
    // 清理进度跟踪
    this.loadingProgress.clear();
    
    console.log('ModelFileLoader: 模型文件加载器已销毁');
  }
}