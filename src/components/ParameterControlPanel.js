/**
 * 参数控制面板 - 提供参数调整的用户界面
 * ParameterControlPanel - Provides user interface for parameter adjustment
 */
export class ParameterControlPanel {
  /**
   * 构造函数 - 初始化参数控制面板
   * Constructor - Initialize parameter control panel
   * @param {ParametricModelingEngine} modelingEngine - 参数化建模引擎
   * @param {HTMLElement} container - 容器元素
   */
  constructor(modelingEngine, container) {
    this.modelingEngine = modelingEngine;
    this.container = container;
    this.controlElements = new Map();
    this.presets = new Map();
    
    // 预设配置
    this.setupPresets();
    
    // 创建UI
    this.createUI();
    
    // 绑定事件
    this.bindEvents();
  }

  /**
   * 设置预设配置
   * Setup preset configurations
   */
  setupPresets() {
    this.presets.set('compact', {
      name: '紧凑型车',
      description: '城市通勤的理想选择',
      parameters: {
        length: 3.8,
        width: 1.6,
        height: 1.4,
        wheelbase: 2.4,
        maxSpeed: 160,
        acceleration: 9.0,
        color: '#0066cc'
      }
    });
    
    this.presets.set('sedan', {
      name: '轿车',
      description: '舒适的家庭用车',
      parameters: {
        length: 4.5,
        width: 1.8,
        height: 1.5,
        wheelbase: 2.7,
        maxSpeed: 180,
        acceleration: 8.5,
        color: '#cc0000'
      }
    });
    
    this.presets.set('suv', {
      name: 'SUV',
      description: '多功能运动型车辆',
      parameters: {
        length: 5.2,
        width: 2.0,
        height: 1.8,
        wheelbase: 3.0,
        maxSpeed: 200,
        acceleration: 7.5,
        color: '#006600'
      }
    });
  }

  /**
   * 创建用户界面
   * Create user interface
   */
  createUI() {
    this.container.innerHTML = '';
    this.container.className = 'parameter-control-panel';
    
    // 创建面板标题
    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = `
      <h3>参数控制面板</h3>
      <div class="panel-actions">
        <button id="undo-btn" title="撤销">↶</button>
        <button id="redo-btn" title="重做">↷</button>
        <button id="reset-btn" title="重置">⟲</button>
      </div>
    `;
    this.container.appendChild(header);
    
    // 创建预设选择区域
    this.createPresetSection();
    
    // 创建参数控制区域
    this.createParameterControls();
    
    // 创建导出/导入区域
    this.createImportExportSection();
    
    // 添加样式
    this.addStyles();
  }

  /**
   * 创建预设选择区域
   * Create preset selection section
   */
  createPresetSection() {
    const presetSection = document.createElement('div');
    presetSection.className = 'preset-section';
    presetSection.innerHTML = '<h4>车型预设</h4>';
    
    const presetContainer = document.createElement('div');
    presetContainer.className = 'preset-container';
    
    for (const [key, preset] of this.presets.entries()) {
      const presetButton = document.createElement('button');
      presetButton.className = 'preset-button';
      presetButton.dataset.preset = key;
      presetButton.innerHTML = `
        <div class="preset-name">${preset.name}</div>
        <div class="preset-description">${preset.description}</div>
      `;
      presetContainer.appendChild(presetButton);
    }
    
    presetSection.appendChild(presetContainer);
    this.container.appendChild(presetSection);
  }

  /**
   * 创建参数控制区域
   * Create parameter controls section
   */
  createParameterControls() {
    const controlsSection = document.createElement('div');
    controlsSection.className = 'controls-section';
    controlsSection.innerHTML = '<h4>参数调整</h4>';
    
    const parameters = this.modelingEngine.getAllParameters();
    
    // 按类别组织参数
    const categories = {
      dimensions: { name: '尺寸参数', params: ['length', 'width', 'height', 'wheelbase'] },
      performance: { name: '性能参数', params: ['maxSpeed', 'acceleration', 'brakingDistance'] },
      visual: { name: '视觉参数', params: ['color', 'material', 'transparency'] }
    };
    
    for (const [categoryKey, category] of Object.entries(categories)) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'parameter-category';
      categoryDiv.innerHTML = `<h5>${category.name}</h5>`;
      
      const categoryControls = document.createElement('div');
      categoryControls.className = 'category-controls';
      
      for (const paramName of category.params) {
        if (parameters.has(paramName)) {
          const control = this.createParameterControl(paramName, parameters.get(paramName));
          categoryControls.appendChild(control);
        }
      }
      
      categoryDiv.appendChild(categoryControls);
      controlsSection.appendChild(categoryDiv);
    }
    
    this.container.appendChild(controlsSection);
  }

  /**
   * 创建单个参数控制元素
   * Create individual parameter control element
   * @param {string} name - 参数名称
   * @param {Object} config - 参数配置
   * @returns {HTMLElement} 控制元素
   */
  createParameterControl(name, config) {
    const controlDiv = document.createElement('div');
    controlDiv.className = 'parameter-control';
    
    const label = document.createElement('label');
    label.textContent = `${this.getParameterDisplayName(name)} (${config.unit || ''})`;
    label.className = 'parameter-label';
    
    let input;
    
    if (config.type === 'color') {
      input = document.createElement('input');
      input.type = 'color';
      input.value = config.value;
    } else if (config.type === 'select') {
      input = document.createElement('select');
      for (const option of config.options) {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        optionElement.selected = option === config.value;
        input.appendChild(optionElement);
      }
    } else {
      // 数值输入
      const inputContainer = document.createElement('div');
      inputContainer.className = 'number-input-container';
      
      input = document.createElement('input');
      input.type = 'range';
      input.min = config.min;
      input.max = config.max;
      input.step = config.step;
      input.value = config.value;
      input.className = 'parameter-slider';
      
      const numberInput = document.createElement('input');
      numberInput.type = 'number';
      numberInput.min = config.min;
      numberInput.max = config.max;
      numberInput.step = config.step;
      numberInput.value = config.value;
      numberInput.className = 'parameter-number';
      
      inputContainer.appendChild(input);
      inputContainer.appendChild(numberInput);
      
      // 同步滑块和数字输入
      input.addEventListener('input', () => {
        numberInput.value = input.value;
      });
      
      numberInput.addEventListener('input', () => {
        input.value = numberInput.value;
      });
      
      controlDiv.appendChild(label);
      controlDiv.appendChild(inputContainer);
      
      this.controlElements.set(name, { slider: input, number: numberInput });
      return controlDiv;
    }
    
    input.className = 'parameter-input';
    input.dataset.parameter = name;
    
    controlDiv.appendChild(label);
    controlDiv.appendChild(input);
    
    this.controlElements.set(name, input);
    return controlDiv;
  }

  /**
   * 获取参数显示名称
   * Get parameter display name
   * @param {string} name - 参数名称
   * @returns {string} 显示名称
   */
  getParameterDisplayName(name) {
    const displayNames = {
      length: '车长',
      width: '车宽',
      height: '车高',
      wheelbase: '轴距',
      maxSpeed: '最高速度',
      acceleration: '加速度',
      brakingDistance: '制动距离',
      color: '车身颜色',
      material: '材质类型',
      transparency: '透明度'
    };
    
    return displayNames[name] || name;
  }

  /**
   * 创建导入/导出区域
   * Create import/export section
   */
  createImportExportSection() {
    const importExportSection = document.createElement('div');
    importExportSection.className = 'import-export-section';
    importExportSection.innerHTML = `
      <h4>配置管理</h4>
      <div class="import-export-controls">
        <button id="export-btn">导出配置</button>
        <input type="file" id="import-file" accept=".json" style="display: none;">
        <button id="import-btn">导入配置</button>
      </div>
    `;
    
    this.container.appendChild(importExportSection);
  }

  /**
   * 绑定事件处理器
   * Bind event handlers
   */
  bindEvents() {
    // 撤销/重做/重置按钮
    const undoBtn = this.container.querySelector('#undo-btn');
    const redoBtn = this.container.querySelector('#redo-btn');
    const resetBtn = this.container.querySelector('#reset-btn');
    
    undoBtn.addEventListener('click', () => {
      if (this.modelingEngine.undo()) {
        this.updateUI();
      }
    });
    
    redoBtn.addEventListener('click', () => {
      if (this.modelingEngine.redo()) {
        this.updateUI();
      }
    });
    
    resetBtn.addEventListener('click', () => {
      this.modelingEngine.resetToDefaults();
      this.updateUI();
    });
    
    // 预设按钮
    const presetButtons = this.container.querySelectorAll('.preset-button');
    presetButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.applyPreset(button.dataset.preset);
      });
    });
    
    // 参数控制
    for (const [name, element] of this.controlElements.entries()) {
      if (element.slider && element.number) {
        // 数值参数
        const updateParameter = () => {
          const value = parseFloat(element.slider.value);
          this.modelingEngine.updateParameter(name, value);
          this.updateUndoRedoButtons();
        };
        
        element.slider.addEventListener('input', updateParameter);
        element.number.addEventListener('change', updateParameter);
      } else {
        // 其他类型参数
        element.addEventListener('change', () => {
          let value = element.value;
          if (element.type === 'range' || element.type === 'number') {
            value = parseFloat(value);
          }
          this.modelingEngine.updateParameter(name, value);
          this.updateUndoRedoButtons();
        });
      }
    }
    
    // 导入/导出
    const exportBtn = this.container.querySelector('#export-btn');
    const importBtn = this.container.querySelector('#import-btn');
    const importFile = this.container.querySelector('#import-file');
    
    exportBtn.addEventListener('click', () => {
      this.exportConfiguration();
    });
    
    importBtn.addEventListener('click', () => {
      importFile.click();
    });
    
    importFile.addEventListener('change', (event) => {
      this.importConfiguration(event.target.files[0]);
    });
  }

  /**
   * 应用预设配置
   * Apply preset configuration
   * @param {string} presetKey - 预设键值
   */
  applyPreset(presetKey) {
    const preset = this.presets.get(presetKey);
    if (!preset) return;
    
    for (const [paramName, value] of Object.entries(preset.parameters)) {
      this.modelingEngine.updateParameter(paramName, value);
    }
    
    this.updateUI();
  }

  /**
   * 更新用户界面
   * Update user interface
   */
  updateUI() {
    const parameters = this.modelingEngine.getAllParameters();
    
    for (const [name, element] of this.controlElements.entries()) {
      const paramConfig = parameters.get(name);
      if (!paramConfig) continue;
      
      if (element.slider && element.number) {
        element.slider.value = paramConfig.value;
        element.number.value = paramConfig.value;
      } else {
        element.value = paramConfig.value;
      }
    }
    
    this.updateUndoRedoButtons();
  }

  /**
   * 更新撤销/重做按钮状态
   * Update undo/redo button states
   */
  updateUndoRedoButtons() {
    const undoBtn = this.container.querySelector('#undo-btn');
    const redoBtn = this.container.querySelector('#redo-btn');
    
    undoBtn.disabled = !this.modelingEngine.canUndo();
    redoBtn.disabled = !this.modelingEngine.canRedo();
  }

  /**
   * 导出配置
   * Export configuration
   */
  exportConfiguration() {
    try {
      const config = this.modelingEngine.exportModelConfiguration();
      const dataStr = JSON.stringify(config, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `vehicle_config_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('ParameterControlPanel: 配置导出失败', error);
      alert('配置导出失败，请检查控制台错误信息');
    }
  }

  /**
   * 导入配置
   * Import configuration
   * @param {File} file - 配置文件
   */
  importConfiguration(file) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target.result);
        if (this.modelingEngine.importModelConfiguration(config)) {
          this.updateUI();
          alert('配置导入成功');
        } else {
          alert('配置导入失败，请检查文件格式');
        }
      } catch (error) {
        console.error('ParameterControlPanel: 配置导入失败', error);
        alert('配置文件格式错误');
      }
    };
    
    reader.readAsText(file);
  }

  /**
   * 添加样式
   * Add styles
   */
  addStyles() {
    if (document.querySelector('#parameter-control-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'parameter-control-styles';
    style.textContent = `
      .parameter-control-panel {
        width: 300px;
        max-height: 80vh;
        overflow-y: auto;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 14px;
      }
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        border-bottom: 1px solid #333;
        padding-bottom: 10px;
      }
      
      .panel-header h3 {
        margin: 0;
        color: #00ccff;
      }
      
      .panel-actions button {
        background: #333;
        border: 1px solid #555;
        color: white;
        padding: 5px 8px;
        margin-left: 5px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }
      
      .panel-actions button:hover:not(:disabled) {
        background: #555;
      }
      
      .panel-actions button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .preset-section, .controls-section, .import-export-section {
        margin-bottom: 20px;
      }
      
      .preset-section h4, .controls-section h4, .import-export-section h4 {
        margin: 0 0 10px 0;
        color: #00ccff;
        font-size: 16px;
      }
      
      .preset-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .preset-button {
        background: #222;
        border: 1px solid #444;
        color: white;
        padding: 10px;
        border-radius: 6px;
        cursor: pointer;
        text-align: left;
        transition: background 0.2s;
      }
      
      .preset-button:hover {
        background: #333;
        border-color: #00ccff;
      }
      
      .preset-name {
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .preset-description {
        font-size: 12px;
        color: #ccc;
      }
      
      .parameter-category {
        margin-bottom: 15px;
      }
      
      .parameter-category h5 {
        margin: 0 0 8px 0;
        color: #ffcc00;
        font-size: 14px;
      }
      
      .category-controls {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .parameter-control {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .parameter-label {
        font-size: 12px;
        color: #ccc;
      }
      
      .number-input-container {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .parameter-slider {
        flex: 1;
        height: 6px;
        background: #333;
        border-radius: 3px;
        outline: none;
        -webkit-appearance: none;
      }
      
      .parameter-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #00ccff;
        border-radius: 50%;
        cursor: pointer;
      }
      
      .parameter-number {
        width: 60px;
        background: #333;
        border: 1px solid #555;
        color: white;
        padding: 4px 6px;
        border-radius: 4px;
        font-size: 12px;
      }
      
      .parameter-input {
        background: #333;
        border: 1px solid #555;
        color: white;
        padding: 6px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
      
      .parameter-input:focus {
        border-color: #00ccff;
        outline: none;
      }
      
      .import-export-controls {
        display: flex;
        gap: 10px;
      }
      
      .import-export-controls button {
        flex: 1;
        background: #333;
        border: 1px solid #555;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .import-export-controls button:hover {
        background: #555;
        border-color: #00ccff;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * 销毁控制面板
   * Destroy control panel
   */
  destroy() {
    this.container.innerHTML = '';
    this.controlElements.clear();
    this.presets.clear();
  }
}