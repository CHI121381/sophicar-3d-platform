# Sophicar 3D数字交互平台

一个基于Three.js/WebGL的汽车研究和教育3D数字交互平台。

## 🌐 在线演示

- **GitHub Pages**: [https://chi121381.github.io/sophicar-3d-platform](https://chi121381.github.io/sophicar-3d-platform)
- **Vercel**: [https://sophicar-3d-platform.vercel.app](https://sophicar-3d-platform.vercel.app)

## ✨ 功能特性

- 🚗 **3D车辆模型展示** - 支持FBX/GLTF/OBJ格式
- 🎮 **交互式控制** - 鼠标/键盘操作，相机控制
- 🚀 **隧道驾驶效果** - 沉浸式驾驶体验
- 📁 **模型导入** - 拖拽导入3D模型文件
- 🎨 **赛博朋克风格** - 科技感UI和视觉效果
- 📱 **响应式设计** - 支持桌面和移动设备

## 项目结构

```
sophicar-3d-platform/
├── src/                          # 源代码目录
│   ├── core/                     # 核心模块
│   │   ├── SceneManager.js       # 场景管理器
│   │   └── InteractionController.js # 交互控制器
│   ├── engines/                  # 引擎模块
│   │   └── ParametricModelingEngine.js # 参数化建模引擎
│   └── interfaces/               # 接口定义
│       ├── IVehicleModel.js      # 车辆模型接口
│       ├── ISimulationScenario.js # 仿真场景接口
│       └── IEducationalModule.js # 教育模块接口
├── test/                         # 测试目录
│   ├── setup.js                  # 测试环境设置
│   ├── core/                     # 核心模块测试
│   ├── interfaces/               # 接口测试
│   └── main.test.js              # 主应用测试
├── docs/                         # 文档目录
│   └── coding-standards.md       # 编码规范
├── main.js                       # 主入口文件
├── package.json                  # 项目配置
├── vitest.config.js              # 测试配置
└── README.md                     # 项目说明
```

## 核心功能

### 已实现的基础架构

1. **场景管理系统** (`SceneManager`)
   - 3D场景初始化和管理
   - 对象添加、移除和更新
   - 渲染循环和性能优化
   - 光照系统设置

2. **交互控制系统** (`InteractionController`)
   - 鼠标、键盘和触摸事件处理
   - 3D对象选择和操作
   - 相机控制和导航
   - 交互反馈和视觉提示

3. **参数化建模引擎** (`ParametricModelingEngine`)
   - 车辆模型加载和参数管理
   - 实时参数调整和模型更新
   - 撤销/重做功能
   - 模型配置导入导出

4. **接口定义**
   - 车辆模型接口 (`IVehicleModel`)
   - 仿真场景接口 (`ISimulationScenario`)
   - 教育模块接口 (`IEducationalModule`)

## 技术栈

- **3D渲染**: Three.js + WebGL
- **构建工具**: Vite
- **测试框架**: Vitest + fast-check (属性测试)
- **开发环境**: Node.js + ES模块

## 开发规范

- 所有代码必须包含详细的中英文注释
- 遵循模块化设计原则
- 使用属性测试验证核心功能
- 严格的错误处理和输入验证

## 🚀 快速开始

### 在线访问
直接访问在线演示：
- [GitHub Pages 版本](https://chi121381.github.io/sophicar-3d-platform)
- [Vercel 版本](https://sophicar-3d-platform.vercel.app)

### 本地开发

#### 安装依赖
```bash
npm install
```

#### 运行开发服务器
```bash
npm run dev
```
访问 http://localhost:5173

#### 运行测试
```bash
npm test
```

#### 构建项目
```bash
npm run build
```

## 🎮 操作说明

- **鼠标左键拖拽**：旋转视角
- **鼠标右键拖拽**：平移视角  
- **鼠标滚轮**：缩放
- **R键**：重置相机
- **I键**：打开模型导入界面
- **ESC键**：取消选择
- **右上角按钮**：启动隧道驾驶效果

## 📦 部署

### GitHub Pages 部署
1. Fork 这个仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择 GitHub Actions 作为部署源
4. 推送代码到 main 分支即可自动部署

### Vercel 部署
1. 在 [Vercel](https://vercel.com) 导入这个仓库
2. 选择 Vite 框架预设
3. 点击部署即可

## 测试覆盖

当前测试覆盖了以下功能：
- ✅ 场景管理器基础功能
- ✅ 接口定义验证
- ✅ 主应用程序初始化
- ✅ WebGL环境模拟

## 下一步开发

根据任务列表，接下来需要实现：
1. 3D场景管理系统的完整功能
2. 虚拟仿真系统
3. 教育内容管理系统
4. 信息架构和导航系统
5. 数据管理和导出系统

## 贡献指南

请参考 `docs/coding-standards.md` 了解详细的编码规范和开发流程。