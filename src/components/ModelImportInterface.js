/**
 * 模型导入界面 - 提供文件选择、拖拽上传和导入进度管理
 * Model Import Interface - Provides file selection, drag-and-drop upload, and import progress management
 */
import { ModelFileLoader } from '../loaders/ModelFileLoader.js';

export class ModelImportInterface {
  /**
   * 构造函数 - 初始化模型导入界面
   * Constructor - Initialize model import interface
   * @param {HTMLElement} container - 容器元素
   * @param {Object} options - 配置选项
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      maxFileSize: 50 * 1024 * 1024, // 默认50MB
      allowedFormats: ['gltf', 'glb', 'obj', 'fbx'],
      showPreview: true,
      autoImport: false,
      ...options
    };
    
    // 初始化模型加载器
    this.modelLoader = new ModelFileLoader();
    
    // 界面元素
    this.interfaceElement = null;
    this.dropZone = null;
    this.fileInput = null;
    this.previewContainer = null;
    this.progressContainer = null;
    this.statusContainer = null;
    
    // 状态管理
    this.currentFile = null;
    this.currentModel = null;
    this.importProgress = {
      status: 'idle', // idle, uploading, processing, preview, complete, error
      progress: 0,
      message: ''
    };
    
    // 事件回调
    this.onModelLoaded = options.onModelLoaded || null;
    this.onImportProgress = options.onImportProgress || null;
    this.onError = options.onError || null;
    
    this.init();
  }

  /**
   * 初始化界面
   * Initialize interface
   */
  init() {
    this.createInterface();
    this.bindEvents();
    this.setupDragAndDrop();
    
    console.log('ModelImportInterface: 模型导入界面初始化完成');
  }

  /**
   * 创建用户界面
   * Create user interface
   */
  createInterface() {
    this.interfaceElement = document.createElement('div');
    this.interfaceElement.className = 'model-import-interface';
    
    this.interfaceElement.innerHTML = `
      <div class="import-header">
        <h3>模型导入</h3>
        <button class="close-btn" title="关闭">×</button>
      </div>
      
      <div class="import-content">
        <!-- 文件选择区域 -->
        <div class="file-selection-area">
          <div class="drop-zone" id="dropZone">
            <div class="drop-zone-content">
              <div class="drop-icon">📁</div>
              <h4>拖拽文件到此处</h4>
              <p>或点击选择文件</p>
              <div class="supported-formats">
                <span>支持格式：</span>
                ${this.options.allowedFormats.map(format => 
                  `<span class="format-tag">${format.toUpperCase()}</span>`
                ).join('')}
              </div>
            </div>
            <input type="file" id="fileInput" accept="${this.getAcceptString()}" style="display: none;">
          </div>
        </div>
        
        <!-- 文件信息显示 -->
        <div class="file-info-section" style="display: none;">
          <h4>文件信息</h4>
          <div class="file-details">
            <div class="file-detail">
              <span class="label">文件名：</span>
              <span class="value" id="fileName">-</span>
            </div>
            <div class="file-detail">
              <span class="label">文件大小：</span>
              <span class="value" id="fileSize">-</span>
            </div>
            <div class="file-detail">
              <span class="label">文件格式：</span>
              <span class="value" id="fileFormat">-</span>
            </div>
          </div>
        </div>
        
        <!-- 进度显示区域 -->
        <div class="progress-section" style="display: none;">
          <h4>导入进度</h4>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="progress-text">
              <span id="progressPercent">0%</span>
              <span id="progressMessage">准备中...</span>
            </div>
          </div>
        </div>
        
        <!-- 模型预览区域 -->
        <div class="preview-section" style="display: none;">
          <h4>模型预览</h4>
          <div class="preview-container" id="previewContainer">
            <div class="preview-placeholder">
              <div class="preview-icon">🎯</div>
              <p>模型预览将在此显示</p>
            </div>
          </div>
          <div class="preview-info">
            <div class="model-stats">
              <div class="stat-item">
                <span class="stat-label">顶点数：</span>
                <span class="stat-value" id="vertexCount">-</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">面数：</span>
                <span class="stat-value" id="faceCount">-</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">材质数：</span>
                <span class="stat-value" id="materialCount">-</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 导入选项 -->
        <div class="import-options" style="display: none;">
          <h4>导入选项</h4>
          <div class="option-group">
            <label class="option-item">
              <input type="checkbox" id="centerModel" checked>
              <span>居中模型</span>
            </label>
            <label class="option-item">
              <input type="checkbox" id="enableShadows" checked>
              <span>启用阴影</span>
            </label>
            <label class="option-item">
              <input type="checkbox" id="optimizeMaterials" checked>
              <span>优化材质</span>
            </label>
          </div>
          
          <div class="scale-option">
            <label>缩放比例：</label>
            <input type="range" id="scaleSlider" min="0.1" max="5" step="0.1" value="1">
            <span id="scaleValue">1.0</span>
          </div>
        </div>
        
        <!-- 状态消息 -->
        <div class="status-section">
          <div class="status-message" id="statusMessage"></div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button class="btn btn-secondary" id="cancelBtn" style="display: none;">取消</button>
          <button class="btn btn-primary" id="importBtn" style="display: none;">导入模型</button>
          <button class="btn btn-success" id="confirmBtn" style="display: none;">确认导入</button>
        </div>
      </div>
    `;
    
    this.container.appendChild(this.interfaceElement);
    
    // 获取关键元素引用
    this.dropZone = this.interfaceElement.querySelector('#dropZone');
    this.fileInput = this.interfaceElement.querySelector('#fileInput');
    this.previewContainer = this.interfaceElement.querySelector('#previewContainer');
    this.progressContainer = this.interfaceElement.querySelector('.progress-section');
    this.statusContainer = this.interfaceElement.querySelector('#statusMessage');
    
    // 添加样式
    this.addStyles();
  }

  /**
   * 获取文件接受字符串
   * Get file accept string
   * @returns {string} 接受的文件类型字符串
   */
  getAcceptString() {
    const mimeTypes = {
      'gltf': '.gltf,model/gltf+json',
      'glb': '.glb,model/gltf-binary',
      'obj': '.obj,text/plain',
      'fbx': '.fbx,application/octet-stream'
    };
    
    return this.options.allowedFormats
      .map(format => mimeTypes[format] || `.${format}`)
      .join(',');
  }

  /**
   * 绑定事件处理器
   * Bind event handlers
   */
  bindEvents() {
    // 关闭按钮
    const closeBtn = this.interfaceElement.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => this.hide());
    
    // 拖拽区域点击
    this.dropZone.addEventListener('click', () => {
      if (this.importProgress.status === 'idle') {
        this.fileInput.click();
      }
    });
    
    // 文件选择
    this.fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file) {
        this.handleFileSelection(file);
      }
    });
    
    // 缩放滑块
    const scaleSlider = this.interfaceElement.querySelector('#scaleSlider');
    const scaleValue = this.interfaceElement.querySelector('#scaleValue');
    scaleSlider.addEventListener('input', () => {
      scaleValue.textContent = parseFloat(scaleSlider.value).toFixed(1);
    });
    
    // 操作按钮
    const cancelBtn = this.interfaceElement.querySelector('#cancelBtn');
    const importBtn = this.interfaceElement.querySelector('#importBtn');
    const confirmBtn = this.interfaceElement.querySelector('#confirmBtn');
    
    cancelBtn.addEventListener('click', () => this.cancelImport());
    importBtn.addEventListener('click', () => this.startImport());
    confirmBtn.addEventListener('click', () => this.confirmImport());
    
    // 监听模型加载进度事件
    window.addEventListener('modelLoadProgress', (event) => {
      this.handleLoadProgress(event.detail);
    });
  }

  /**
   * 设置拖拽功能
   * Setup drag and drop functionality
   */
  setupDragAndDrop() {
    // 防止默认拖拽行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
    
    // 拖拽进入和悬停
    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, () => {
        if (this.importProgress.status === 'idle') {
          this.dropZone.classList.add('drag-over');
        }
      });
    });
    
    // 拖拽离开
    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone.classList.remove('drag-over');
    });
    
    // 文件放置
    this.dropZone.addEventListener('drop', (e) => {
      this.dropZone.classList.remove('drag-over');
      
      if (this.importProgress.status !== 'idle') return;
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileSelection(files[0]);
      }
    });
  }

  /**
   * 处理文件选择
   * Handle file selection
   * @param {File} file - 选择的文件
   */
  async handleFileSelection(file) {
    try {
      // 验证文件
      const validation = this.validateFile(file);
      if (!validation.valid) {
        this.showError(validation.message);
        return;
      }
      
      this.currentFile = file;
      
      // 显示文件信息
      this.displayFileInfo(file);
      
      // 更新界面状态
      this.updateInterfaceState('file-selected');
      
      // 如果启用自动导入，直接开始导入
      if (this.options.autoImport) {
        await this.startImport();
      }
      
    } catch (error) {
      console.error('ModelImportInterface: 文件选择处理失败', error);
      this.showError('文件处理失败：' + error.message);
    }
  }

  /**
   * 验证文件
   * Validate file
   * @param {File} file - 要验证的文件
   * @returns {Object} 验证结果
   */
  validateFile(file) {
    // 检查文件大小
    if (file.size > this.options.maxFileSize) {
      return {
        valid: false,
        message: `文件过大：${this.formatFileSize(file.size)} > ${this.formatFileSize(this.options.maxFileSize)}`
      };
    }
    
    // 检查文件格式
    const format = this.modelLoader.detectFileFormat(file);
    if (!format || !this.options.allowedFormats.includes(format)) {
      return {
        valid: false,
        message: `不支持的文件格式。支持的格式：${this.options.allowedFormats.join(', ')}`
      };
    }
    
    return { valid: true, format };
  }

  /**
   * 显示文件信息
   * Display file information
   * @param {File} file - 文件对象
   */
  displayFileInfo(file) {
    const format = this.modelLoader.detectFileFormat(file);
    
    this.interfaceElement.querySelector('#fileName').textContent = file.name;
    this.interfaceElement.querySelector('#fileSize').textContent = this.formatFileSize(file.size);
    this.interfaceElement.querySelector('#fileFormat').textContent = format ? format.toUpperCase() : '未知';
    
    // 显示文件信息区域
    this.interfaceElement.querySelector('.file-info-section').style.display = 'block';
  }

  /**
   * 开始导入模型
   * Start model import
   */
  async startImport() {
    if (!this.currentFile) {
      this.showError('请先选择文件');
      return;
    }
    
    try {
      this.updateImportProgress('uploading', 0, '开始导入...');
      this.updateInterfaceState('importing');
      
      // 获取导入选项
      const options = this.getImportOptions();
      
      // 加载模型
      this.currentModel = await this.modelLoader.loadModel(this.currentFile, options);
      
      // 显示预览
      if (this.options.showPreview) {
        this.displayModelPreview(this.currentModel);
      }
      
      this.updateImportProgress('complete', 100, '导入完成');
      this.updateInterfaceState('preview');
      
    } catch (error) {
      console.error('ModelImportInterface: 模型导入失败', error);
      this.updateImportProgress('error', 0, '导入失败：' + error.message);
      this.updateInterfaceState('error');
    }
  }

  /**
   * 获取导入选项
   * Get import options
   * @returns {Object} 导入选项
   */
  getImportOptions() {
    const centerModel = this.interfaceElement.querySelector('#centerModel').checked;
    const enableShadows = this.interfaceElement.querySelector('#enableShadows').checked;
    const optimizeMaterials = this.interfaceElement.querySelector('#optimizeMaterials').checked;
    const scale = parseFloat(this.interfaceElement.querySelector('#scaleSlider').value);
    
    return {
      center: centerModel,
      castShadow: enableShadows,
      receiveShadow: enableShadows,
      optimizeMaterials: optimizeMaterials,
      scale: scale,
      maxFileSize: this.options.maxFileSize
    };
  }

  /**
   * 显示模型预览
   * Display model preview
   * @param {THREE.Object3D} model - 3D模型对象
   */
  displayModelPreview(model) {
    // 清空预览容器
    this.previewContainer.innerHTML = '';
    
    // 创建预览场景
    const previewScene = this.createPreviewScene(model);
    this.previewContainer.appendChild(previewScene.domElement);
    
    // 显示模型统计信息
    this.displayModelStats(model);
    
    // 显示预览区域
    this.interfaceElement.querySelector('.preview-section').style.display = 'block';
  }

  /**
   * 创建预览场景
   * Create preview scene
   * @param {THREE.Object3D} model - 3D模型对象
   * @returns {Object} 预览场景对象
   */
  createPreviewScene(model) {
    const THREE = window.THREE;
    
    // 创建预览场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    
    // 创建相机
    const camera = new THREE.PerspectiveCamera(45, 300 / 200, 0.1, 1000);
    
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(300, 200);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 添加光照
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // 克隆模型以避免影响原始模型
    const previewModel = model.clone();
    scene.add(previewModel);
    
    // 计算模型边界框并调整相机位置
    const box = new THREE.Box3().setFromObject(previewModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;
    
    camera.position.set(distance, distance * 0.5, distance);
    camera.lookAt(center);
    
    // 添加轨道控制（简化版）
    let isRotating = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    renderer.domElement.addEventListener('mousedown', (event) => {
      isRotating = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    });
    
    renderer.domElement.addEventListener('mousemove', (event) => {
      if (!isRotating) return;
      
      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };
      
      previewModel.rotation.y += deltaMove.x * 0.01;
      previewModel.rotation.x += deltaMove.y * 0.01;
      
      previousMousePosition = { x: event.clientX, y: event.clientY };
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
      isRotating = false;
    });
    
    // 渲染循环
    const animate = () => {
      requestAnimationFrame(animate);
      
      // 自动旋转
      if (!isRotating) {
        previewModel.rotation.y += 0.005;
      }
      
      renderer.render(scene, camera);
    };
    animate();
    
    return renderer;
  }

  /**
   * 显示模型统计信息
   * Display model statistics
   * @param {THREE.Object3D} model - 3D模型对象
   */
  displayModelStats(model) {
    let vertexCount = 0;
    let faceCount = 0;
    let materialCount = 0;
    const materials = new Set();
    
    model.traverse((child) => {
      if (child.geometry) {
        const geometry = child.geometry;
        if (geometry.attributes.position) {
          vertexCount += geometry.attributes.position.count;
        }
        if (geometry.index) {
          faceCount += geometry.index.count / 3;
        } else if (geometry.attributes.position) {
          faceCount += geometry.attributes.position.count / 3;
        }
      }
      
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => materials.add(mat.uuid));
        } else {
          materials.add(child.material.uuid);
        }
      }
    });
    
    materialCount = materials.size;
    
    this.interfaceElement.querySelector('#vertexCount').textContent = vertexCount.toLocaleString();
    this.interfaceElement.querySelector('#faceCount').textContent = Math.floor(faceCount).toLocaleString();
    this.interfaceElement.querySelector('#materialCount').textContent = materialCount;
  }

  /**
   * 确认导入
   * Confirm import
   */
  confirmImport() {
    if (!this.currentModel) {
      this.showError('没有可导入的模型');
      return;
    }
    
    // 触发模型加载完成事件
    if (this.onModelLoaded) {
      this.onModelLoaded(this.currentModel, this.currentFile);
    }
    
    // 触发自定义事件
    const event = new CustomEvent('modelImported', {
      detail: {
        model: this.currentModel,
        file: this.currentFile,
        options: this.getImportOptions()
      }
    });
    this.container.dispatchEvent(event);
    
    this.showSuccess('模型导入成功');
    
    // 延迟关闭界面
    setTimeout(() => {
      this.hide();
      this.reset();
    }, 1500);
  }

  /**
   * 取消导入
   * Cancel import
   */
  cancelImport() {
    // 清理当前状态
    this.reset();
    this.hide();
  }

  /**
   * 处理加载进度
   * Handle loading progress
   * @param {Object} progressData - 进度数据
   */
  handleLoadProgress(progressData) {
    if (progressData.status === 'loading') {
      this.updateImportProgress('processing', progressData.progress || 0, progressData.message);
    } else if (progressData.status === 'processing') {
      this.updateImportProgress('processing', 90, progressData.message);
    }
    
    // 触发进度回调
    if (this.onImportProgress) {
      this.onImportProgress(progressData);
    }
  }

  /**
   * 更新导入进度
   * Update import progress
   * @param {string} status - 状态
   * @param {number} progress - 进度百分比
   * @param {string} message - 消息
   */
  updateImportProgress(status, progress, message) {
    this.importProgress = { status, progress, message };
    
    // 更新进度条
    const progressFill = this.interfaceElement.querySelector('#progressFill');
    const progressPercent = this.interfaceElement.querySelector('#progressPercent');
    const progressMessage = this.interfaceElement.querySelector('#progressMessage');
    
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }
    if (progressPercent) {
      progressPercent.textContent = `${Math.round(progress)}%`;
    }
    if (progressMessage) {
      progressMessage.textContent = message;
    }
    
    // 显示进度区域
    if (status !== 'idle') {
      this.progressContainer.style.display = 'block';
    }
  }

  /**
   * 更新界面状态
   * Update interface state
   * @param {string} state - 界面状态
   */
  updateInterfaceState(state) {
    const sections = {
      'file-info': this.interfaceElement.querySelector('.file-info-section'),
      'progress': this.interfaceElement.querySelector('.progress-section'),
      'preview': this.interfaceElement.querySelector('.preview-section'),
      'options': this.interfaceElement.querySelector('.import-options')
    };
    
    const buttons = {
      'cancel': this.interfaceElement.querySelector('#cancelBtn'),
      'import': this.interfaceElement.querySelector('#importBtn'),
      'confirm': this.interfaceElement.querySelector('#confirmBtn')
    };
    
    // 隐藏所有可选区域
    Object.values(sections).forEach(section => {
      if (section) section.style.display = 'none';
    });
    Object.values(buttons).forEach(button => {
      if (button) button.style.display = 'none';
    });
    
    // 根据状态显示相应区域
    switch (state) {
      case 'file-selected':
        sections['file-info'].style.display = 'block';
        sections['options'].style.display = 'block';
        buttons['cancel'].style.display = 'inline-block';
        buttons['import'].style.display = 'inline-block';
        this.dropZone.classList.add('file-selected');
        break;
        
      case 'importing':
        sections['file-info'].style.display = 'block';
        sections['progress'].style.display = 'block';
        buttons['cancel'].style.display = 'inline-block';
        break;
        
      case 'preview':
        sections['file-info'].style.display = 'block';
        sections['preview'].style.display = 'block';
        buttons['cancel'].style.display = 'inline-block';
        buttons['confirm'].style.display = 'inline-block';
        break;
        
      case 'error':
        sections['file-info'].style.display = 'block';
        buttons['cancel'].style.display = 'inline-block';
        break;
        
      default: // idle
        this.dropZone.classList.remove('file-selected');
        break;
    }
  }

  /**
   * 显示错误消息
   * Show error message
   * @param {string} message - 错误消息
   */
  showError(message) {
    this.statusContainer.className = 'status-message error';
    this.statusContainer.textContent = message;
    this.statusContainer.style.display = 'block';
    
    if (this.onError) {
      this.onError(message);
    }
    
    // 自动隐藏错误消息
    setTimeout(() => {
      this.statusContainer.style.display = 'none';
    }, 5000);
  }

  /**
   * 显示成功消息
   * Show success message
   * @param {string} message - 成功消息
   */
  showSuccess(message) {
    this.statusContainer.className = 'status-message success';
    this.statusContainer.textContent = message;
    this.statusContainer.style.display = 'block';
    
    // 自动隐藏成功消息
    setTimeout(() => {
      this.statusContainer.style.display = 'none';
    }, 3000);
  }

  /**
   * 格式化文件大小
   * Format file size
   * @param {number} bytes - 字节数
   * @returns {string} 格式化的文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 重置界面状态
   * Reset interface state
   */
  reset() {
    this.currentFile = null;
    this.currentModel = null;
    this.importProgress = {
      status: 'idle',
      progress: 0,
      message: ''
    };
    
    // 重置文件输入
    this.fileInput.value = '';
    
    // 重置界面状态
    this.updateInterfaceState('idle');
    
    // 清空预览容器
    if (this.previewContainer) {
      this.previewContainer.innerHTML = `
        <div class="preview-placeholder">
          <div class="preview-icon">🎯</div>
          <p>模型预览将在此显示</p>
        </div>
      `;
    }
    
    // 隐藏状态消息
    this.statusContainer.style.display = 'none';
  }

  /**
   * 显示界面
   * Show interface
   */
  show() {
    this.interfaceElement.style.display = 'block';
    this.interfaceElement.classList.add('show');
  }

  /**
   * 隐藏界面
   * Hide interface
   */
  hide() {
    this.interfaceElement.classList.remove('show');
    setTimeout(() => {
      this.interfaceElement.style.display = 'none';
    }, 300);
  }

  /**
   * 添加样式
   * Add styles
   */
  addStyles() {
    if (document.querySelector('#model-import-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'model-import-styles';
    style.textContent = `
      .model-import-interface {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 600px;
        max-width: 90vw;
        max-height: 90vh;
        background: rgba(10, 10, 10, 0.95);
        border: 2px solid #00ffff;
        border-radius: 12px;
        box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
        color: white;
        font-family: 'Microsoft YaHei', Arial, sans-serif;
        z-index: 1000;
        backdrop-filter: blur(10px);
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .model-import-interface.show {
        opacity: 1;
      }
      
      .import-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #333;
        background: linear-gradient(90deg, rgba(0, 255, 255, 0.1), rgba(0, 128, 255, 0.1));
      }
      
      .import-header h3 {
        margin: 0;
        color: #00ffff;
        font-size: 1.5em;
        text-shadow: 0 0 10px #00ffff;
      }
      
      .close-btn {
        background: none;
        border: none;
        color: #00ffff;
        font-size: 24px;
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .import-content {
        padding: 20px;
        max-height: 70vh;
        overflow-y: auto;
      }
      
      .drop-zone {
        border: 2px dashed #00ffff;
        border-radius: 8px;
        padding: 40px 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background: rgba(0, 255, 255, 0.05);
        margin-bottom: 20px;
      }
      
      .drop-zone:hover, .drop-zone.drag-over {
        border-color: #40e0d0;
        background: rgba(0, 255, 255, 0.1);
        transform: scale(1.02);
      }
      
      .drop-zone.file-selected {
        border-color: #00ff00;
        background: rgba(0, 255, 0, 0.1);
      }
      
      .drop-zone-content .drop-icon {
        font-size: 48px;
        margin-bottom: 15px;
      }
      
      .drop-zone-content h4 {
        margin: 0 0 10px 0;
        color: #00ffff;
        font-size: 1.2em;
      }
      
      .drop-zone-content p {
        margin: 0 0 15px 0;
        color: #ccc;
      }
      
      .supported-formats {
        display: flex;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .supported-formats span {
        color: #40e0d0;
        font-size: 0.9em;
      }
      
      .format-tag {
        background: rgba(0, 255, 255, 0.2);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8em !important;
        color: #00ffff !important;
      }
      
      .file-info-section, .progress-section, .preview-section, .import-options {
        margin-bottom: 20px;
        padding: 15px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        border: 1px solid #333;
      }
      
      .file-info-section h4, .progress-section h4, .preview-section h4, .import-options h4 {
        margin: 0 0 15px 0;
        color: #00ffff;
        font-size: 1.1em;
      }
      
      .file-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .file-detail {
        display: flex;
        justify-content: space-between;
      }
      
      .file-detail .label {
        color: #ccc;
        font-weight: 500;
      }
      
      .file-detail .value {
        color: #00ffff;
        font-weight: bold;
      }
      
      .progress-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .progress-bar {
        width: 100%;
        height: 8px;
        background: rgba(0, 255, 255, 0.2);
        border-radius: 4px;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00ffff, #40e0d0);
        width: 0%;
        transition: width 0.3s ease;
        border-radius: 4px;
      }
      
      .progress-text {
        display: flex;
        justify-content: space-between;
        font-size: 0.9em;
      }
      
      .progress-text #progressPercent {
        color: #00ffff;
        font-weight: bold;
      }
      
      .progress-text #progressMessage {
        color: #ccc;
      }
      
      .preview-container {
        width: 100%;
        height: 200px;
        background: #222;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 15px;
        overflow: hidden;
      }
      
      .preview-placeholder {
        text-align: center;
        color: #666;
      }
      
      .preview-placeholder .preview-icon {
        font-size: 48px;
        margin-bottom: 10px;
      }
      
      .model-stats {
        display: flex;
        justify-content: space-around;
        gap: 15px;
      }
      
      .stat-item {
        text-align: center;
      }
      
      .stat-label {
        display: block;
        color: #ccc;
        font-size: 0.9em;
        margin-bottom: 5px;
      }
      
      .stat-value {
        display: block;
        color: #00ffff;
        font-weight: bold;
        font-size: 1.1em;
      }
      
      .option-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .option-item {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        color: #ccc;
      }
      
      .option-item input[type="checkbox"] {
        accent-color: #00ffff;
      }
      
      .scale-option {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .scale-option label {
        color: #ccc;
        min-width: 80px;
      }
      
      .scale-option input[type="range"] {
        flex: 1;
        accent-color: #00ffff;
      }
      
      .scale-option span {
        color: #00ffff;
        font-weight: bold;
        min-width: 30px;
      }
      
      .status-section {
        margin-bottom: 20px;
      }
      
      .status-message {
        padding: 10px 15px;
        border-radius: 6px;
        font-size: 0.9em;
        display: none;
      }
      
      .status-message.error {
        background: rgba(255, 0, 0, 0.2);
        border: 1px solid #ff4444;
        color: #ff6666;
      }
      
      .status-message.success {
        background: rgba(0, 255, 0, 0.2);
        border: 1px solid #44ff44;
        color: #66ff66;
      }
      
      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding-top: 15px;
        border-top: 1px solid #333;
      }
      
      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9em;
        font-weight: 500;
        transition: all 0.2s ease;
        min-width: 100px;
      }
      
      .btn-secondary {
        background: rgba(100, 100, 100, 0.3);
        color: #ccc;
        border: 1px solid #666;
      }
      
      .btn-secondary:hover {
        background: rgba(100, 100, 100, 0.5);
        color: white;
      }
      
      .btn-primary {
        background: rgba(0, 255, 255, 0.2);
        color: #00ffff;
        border: 1px solid #00ffff;
      }
      
      .btn-primary:hover {
        background: rgba(0, 255, 255, 0.3);
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
      }
      
      .btn-success {
        background: rgba(0, 255, 0, 0.2);
        color: #00ff00;
        border: 1px solid #00ff00;
      }
      
      .btn-success:hover {
        background: rgba(0, 255, 0, 0.3);
        box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
      }
      
      /* 滚动条样式 */
      .import-content::-webkit-scrollbar {
        width: 8px;
      }
      
      .import-content::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
      }
      
      .import-content::-webkit-scrollbar-thumb {
        background: rgba(0, 255, 255, 0.3);
        border-radius: 4px;
      }
      
      .import-content::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 255, 255, 0.5);
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * 销毁界面
   * Destroy interface
   */
  destroy() {
    if (this.interfaceElement && this.interfaceElement.parentNode) {
      this.interfaceElement.parentNode.removeChild(this.interfaceElement);
    }
    
    // 清理模型加载器
    if (this.modelLoader) {
      this.modelLoader.destroy();
    }
    
    console.log('ModelImportInterface: 模型导入界面已销毁');
  }
}