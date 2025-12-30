# Sophicar 3D平台编码规范
# Sophicar 3D Platform Coding Standards

## 中文注释规范 (Chinese Comment Standards)

### 1. 文件头注释 (File Header Comments)

每个源代码文件必须包含文件头注释，说明文件的用途：

```javascript
/**
 * 文件名称 - 简短描述
 * FileName - Brief description
 */
```

### 2. 类注释 (Class Comments)

每个类必须包含详细的中英文注释：

```javascript
/**
 * 类名 - 类的用途说明
 * ClassName - Purpose of the class
 */
export class ClassName {
  // 类实现
}
```

### 3. 方法注释 (Method Comments)

所有公共方法必须包含完整的JSDoc注释：

```javascript
/**
 * 方法描述 - 说明方法的功能
 * Method description - Explain what the method does
 * @param {Type} paramName - 参数说明
 * @returns {Type} 返回值说明
 */
methodName(paramName) {
  // 方法实现
}
```

### 4. 复杂逻辑注释 (Complex Logic Comments)

对于复杂的算法或业务逻辑，必须添加详细的中文注释：

```javascript
// 计算车辆动力学参数
// Calculate vehicle dynamics parameters
const dynamics = calculateDynamics();

// 应用物理约束条件
// Apply physics constraints
if (constraint.isValid()) {
  // 约束有效，应用到模型
  // Constraint is valid, apply to model
  applyConstraint(constraint);
}
```

### 5. 变量注释 (Variable Comments)

重要的变量声明应包含注释说明：

```javascript
// 场景对象映射表 - 存储所有3D对象的引用
// Scene object map - Store references to all 3D objects
this.objects = new Map();
```

## 代码组织规范 (Code Organization Standards)

### 1. 目录结构 (Directory Structure)

```
src/
├── core/              # 核心模块 (Core modules)
│   ├── SceneManager.js
│   └── InteractionController.js
├── engines/           # 引擎模块 (Engine modules)
│   ├── ParametricModelingEngine.js
│   └── SimulationFramework.js
├── managers/          # 管理器模块 (Manager modules)
│   └── EducationalContentManager.js
├── interfaces/        # 接口定义 (Interface definitions)
│   ├── IVehicleModel.js
│   ├── ISimulationScenario.js
│   └── IEducationalModule.js
├── utils/            # 工具函数 (Utility functions)
└── constants/        # 常量定义 (Constants)
```

### 2. 模块导入顺序 (Module Import Order)

```javascript
// 1. 第三方库 (Third-party libraries)
import * as THREE from 'three';

// 2. 核心模块 (Core modules)
import { SceneManager } from './core/SceneManager.js';

// 3. 工具函数 (Utilities)
import { validateInput } from './utils/validation.js';

// 4. 常量 (Constants)
import { DEFAULT_CONFIG } from './constants/config.js';
```

### 3. 类成员顺序 (Class Member Order)

```javascript
export class ExampleClass {
  // 1. 构造函数 (Constructor)
  constructor() {}
  
  // 2. 公共方法 (Public methods)
  publicMethod() {}
  
  // 3. 私有方法 (Private methods)
  #privateMethod() {}
  
  // 4. Getter/Setter
  get property() {}
  set property(value) {}
}
```

## 命名规范 (Naming Conventions)

### 1. 变量命名 (Variable Naming)

- 使用驼峰命名法 (Use camelCase)
- 布尔变量使用is/has/can前缀 (Boolean variables use is/has/can prefix)

```javascript
const vehicleModel = {};
const isActive = true;
const hasPermission = false;
const canEdit = true;
```

### 2. 常量命名 (Constant Naming)

- 使用全大写和下划线 (Use UPPER_CASE with underscores)

```javascript
const MAX_SPEED = 300;
const DEFAULT_COLOR = '#ff0000';
const API_ENDPOINT = 'https://api.example.com';
```

### 3. 类命名 (Class Naming)

- 使用帕斯卡命名法 (Use PascalCase)
- 名称应该是名词 (Names should be nouns)

```javascript
class SceneManager {}
class VehicleModel {}
class SimulationEngine {}
```

### 4. 方法命名 (Method Naming)

- 使用驼峰命名法 (Use camelCase)
- 名称应该是动词或动词短语 (Names should be verbs or verb phrases)

```javascript
loadModel()
updateParameter()
calculatePhysics()
validateInput()
```

## 代码质量规范 (Code Quality Standards)

### 1. 函数长度 (Function Length)

- 单个函数不应超过50行 (Single function should not exceed 50 lines)
- 复杂函数应拆分为多个小函数 (Complex functions should be split into smaller ones)

### 2. 参数数量 (Parameter Count)

- 函数参数不应超过5个 (Function parameters should not exceed 5)
- 超过3个参数时考虑使用对象参数 (Consider using object parameters when more than 3)

```javascript
// 不推荐 (Not recommended)
function createVehicle(id, name, length, width, height, color, material) {}

// 推荐 (Recommended)
function createVehicle(config) {
  const { id, name, length, width, height, color, material } = config;
}
```

### 3. 错误处理 (Error Handling)

- 所有可能失败的操作必须包含错误处理 (All operations that may fail must include error handling)
- 使用try-catch处理异步操作 (Use try-catch for async operations)

```javascript
async function loadModel(path) {
  try {
    const model = await loader.load(path);
    return model;
  } catch (error) {
    console.error('模型加载失败 (Model loading failed):', error);
    throw error;
  }
}
```

### 4. 输入验证 (Input Validation)

- 所有公共方法必须验证输入参数 (All public methods must validate input parameters)

```javascript
updateParameter(name, value) {
  if (!name || typeof name !== 'string') {
    console.warn('参数名称无效 (Invalid parameter name)');
    return false;
  }
  
  if (value === undefined || value === null) {
    console.warn('参数值无效 (Invalid parameter value)');
    return false;
  }
  
  // 继续处理
}
```

## 测试规范 (Testing Standards)

### 1. 测试文件命名 (Test File Naming)

- 测试文件应与源文件同名，添加.test.js后缀
- Test files should have the same name as source files with .test.js suffix

```
src/core/SceneManager.js
test/core/SceneManager.test.js
```

### 2. 测试结构 (Test Structure)

```javascript
describe('类名或模块名 (Class or Module Name)', () => {
  describe('功能分组 (Feature Group)', () => {
    it('应该执行特定行为 (Should perform specific behavior)', () => {
      // 测试代码
    });
  });
});
```

### 3. 测试覆盖率 (Test Coverage)

- 核心功能代码覆盖率应达到80%以上
- Core functionality code coverage should reach 80% or above
- 所有公共API必须有测试
- All public APIs must have tests

## 性能规范 (Performance Standards)

### 1. 避免不必要的计算 (Avoid Unnecessary Calculations)

```javascript
// 不推荐 (Not recommended)
for (let i = 0; i < array.length; i++) {
  // array.length在每次迭代时都会计算
}

// 推荐 (Recommended)
const length = array.length;
for (let i = 0; i < length; i++) {
  // 只计算一次
}
```

### 2. 使用对象池 (Use Object Pooling)

对于频繁创建和销毁的对象，使用对象池模式：

```javascript
class ObjectPool {
  constructor(createFn, resetFn) {
    this.pool = [];
    this.createFn = createFn;
    this.resetFn = resetFn;
  }
  
  acquire() {
    return this.pool.length > 0 
      ? this.pool.pop() 
      : this.createFn();
  }
  
  release(obj) {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}
```

### 3. 及时清理资源 (Clean Up Resources Promptly)

```javascript
destroy() {
  // 停止动画循环
  this.stopRenderLoop();
  
  // 清理场景对象
  this.clearScene();
  
  // 释放渲染器资源
  if (this.renderer) {
    this.renderer.dispose();
  }
  
  // 移除事件监听器
  window.removeEventListener('resize', this.handleResize);
}
```

## Git提交规范 (Git Commit Standards)

### 提交信息格式 (Commit Message Format)

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 (Types)

- feat: 新功能 (New feature)
- fix: 修复bug (Bug fix)
- docs: 文档更新 (Documentation update)
- style: 代码格式调整 (Code style adjustment)
- refactor: 代码重构 (Code refactoring)
- test: 测试相关 (Test related)
- chore: 构建或辅助工具变动 (Build or auxiliary tool changes)

### 示例 (Example)

```
feat(scene): 添加场景对象管理功能

- 实现对象添加和移除方法
- 添加对象ID映射表
- 实现场景清理功能

Closes #123
```