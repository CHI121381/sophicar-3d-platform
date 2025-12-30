/**
 * 加载动画组件 - 赛博朋克风格的SOPHICAR标题和粒子汽车动画
 * Loading Animation Component - Cyberpunk style SOPHICAR title and particle car animation
 */
import * as THREE from 'three';

export class LoadingAnimation {
  /**
   * 构造函数 - 初始化加载动画
   * Constructor - Initialize loading animation
   * @param {HTMLElement} container - 容器元素
   */
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationId = null;
    
    // 动画状态
    this.animationPhase = 'title'; // 'title', 'particles', 'display', 'complete'
    this.startTime = performance.now();
    this.titleDuration = 2000; // 标题动画持续时间（恢复原来的时间）
    this.particleDuration = 4000; // 粒子聚集动画持续时间
    this.displayDuration = 1000; // 爆炸图展示持续时间（新增1秒）
    
    // 文字和粒子对象
    this.titleMeshes = [];
    this.particles = null;
    this.carParticles = [];
    
    // 赛博朋克颜色配置
    this.colors = {
      primary: 0x00ffff,    // 青色
      secondary: 0x0080ff,  // 蓝色
      accent: 0x40e0d0,     // 青绿色
      glow: 0x00bfff,       // 深天蓝
      background: 0x0a0a0a  // 深黑色
    };
    
    this.init();
  }

  /**
   * 初始化动画场景
   * Initialize animation scene
   */
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.colors.background);
    
    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      60, // 稍微减小视野角度，让字母显得更大
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 15; // 调整相机距离以适应更大的字母
    
    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
    
    // 设置光照
    this.setupLighting();
    
    // 创建标题文字
    this.createTitleText();
    
    // 创建粒子系统
    this.createParticleSystem();
    
    // 开始动画循环
    this.animate();
  }

  /**
   * 设置光照系统
   * Setup lighting system
   */
  setupLighting() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(this.colors.primary, 0.3);
    this.scene.add(ambientLight);
    
    // 主光源
    const directionalLight = new THREE.DirectionalLight(this.colors.secondary, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
    
    // 补充光源
    const fillLight = new THREE.DirectionalLight(this.colors.accent, 0.5);
    fillLight.position.set(-5, -5, 2);
    this.scene.add(fillLight);
  }

  /**
   * 创建SOPHICAR标题文字
   * Create SOPHICAR title text
   */
  createTitleText() {
    // 直接使用备用文字方案，避免字体加载复杂性
    this.createFallbackTitleText();
  }

  /**
   * 创建备用标题文字（使用几何体拼接）
   * Create fallback title text using geometry shapes
   */
  createFallbackTitleText() {
    const letters = 'SOPHICAR'.split('');
    
    // 调整字母大小和间距以占据视觉重心
    const letterWidth = 2.2; // 增加字母间距
    const letterScale = 2.5; // 增加字母基础大小
    const startX = -(letters.length * letterWidth) / 2;
    
    letters.forEach((letter, index) => {
      // 为每个字母创建一个简化的几何体表示
      const letterGroup = this.createLetterGeometry(letter);
      
      // 设置字母位置 - 居中显示
      letterGroup.position.x = startX + index * letterWidth;
      letterGroup.position.y = 0; // 垂直居中
      letterGroup.position.z = 0;
      
      // 设置基础大小
      letterGroup.scale.set(letterScale, letterScale, letterScale);
      
      // 初始状态：透明且缩小
      letterGroup.children.forEach(mesh => {
        if (mesh.material) {
          mesh.material.opacity = 0;
        }
      });
      letterGroup.scale.multiplyScalar(0.1); // 初始缩放
      
      this.scene.add(letterGroup);
      this.titleMeshes.push(letterGroup);
    });
  }

  /**
   * 创建字母几何体
   * Create letter geometry
   * @param {string} letter - 字母
   * @returns {THREE.Group} 字母组合
   */
  createLetterGeometry(letter) {
    const letterGroup = new THREE.Group();
    
    // 创建强烈荧光材质
    const glowMaterial = new THREE.MeshLambertMaterial({
      color: this.colors.primary,
      emissive: this.colors.primary,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0
    });
    
    // 创建外发光材质
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
      color: this.colors.primary,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    
    // 根据字母创建精确的几何体
    let mainGeometry, outerGlowGeometry;
    
    switch (letter) {
      case 'S':
        // S形状 - 使用多个弯曲的矩形组合
        mainGeometry = this.createSGeometry();
        outerGlowGeometry = this.createSGeometry(1.2);
        break;
      case 'O':
        // O形状 - 环形
        mainGeometry = new THREE.RingGeometry(0.35, 0.65, 32);
        outerGlowGeometry = new THREE.RingGeometry(0.3, 0.7, 32);
        break;
      case 'P':
        // P形状 - 组合几何体
        mainGeometry = this.createPGeometry();
        outerGlowGeometry = this.createPGeometry(1.2);
        break;
      case 'H':
        // H形状 - 三个矩形组合
        mainGeometry = this.createHGeometry();
        outerGlowGeometry = this.createHGeometry(1.2);
        break;
      case 'I':
        // I形状 - 三个矩形（上横线、中竖线、下横线）
        mainGeometry = this.createIGeometry();
        outerGlowGeometry = this.createIGeometry(1.2);
        break;
      case 'C':
        // C形状 - 部分环形
        mainGeometry = new THREE.RingGeometry(0.35, 0.65, 32, 1, 0.3, Math.PI * 1.4);
        outerGlowGeometry = new THREE.RingGeometry(0.3, 0.7, 32, 1, 0.3, Math.PI * 1.4);
        break;
      case 'A':
        // A形状 - 三角形框架
        mainGeometry = this.createAGeometry();
        outerGlowGeometry = this.createAGeometry(1.2);
        break;
      case 'R':
        // R形状 - P形状加斜线
        mainGeometry = this.createRGeometry();
        outerGlowGeometry = this.createRGeometry(1.2);
        break;
      default:
        mainGeometry = new THREE.BoxGeometry(0.6, 1.4, 0.1);
        outerGlowGeometry = new THREE.BoxGeometry(0.72, 1.68, 0.12);
    }
    
    // 创建主字母网格
    const mainMesh = new THREE.Mesh(mainGeometry, glowMaterial);
    
    // 创建外发光网格
    const glowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    glowMesh.scale.set(1.1, 1.1, 1.1);
    
    // 添加到组合中
    letterGroup.add(glowMesh); // 先添加发光层
    letterGroup.add(mainMesh); // 再添加主体
    
    return letterGroup;
  }

  /**
   * 创建S字母几何体
   * Create S letter geometry
   * @param {number} scale - 缩放比例
   * @returns {THREE.BufferGeometry} S字母几何体
   */
  createSGeometry(scale = 1) {
    const shape = new THREE.Shape();
    const size = 0.6 * scale;
    const thickness = 0.15 * scale;
    
    // 绘制S形状路径
    shape.moveTo(-size/2, size);
    shape.lineTo(size/2 - thickness, size);
    shape.lineTo(size/2 - thickness, size/3);
    shape.lineTo(-size/2 + thickness, size/3);
    shape.lineTo(-size/2 + thickness, -size/3);
    shape.lineTo(size/2, -size/3);
    shape.lineTo(size/2, -size);
    shape.lineTo(-size/2 + thickness, -size);
    shape.lineTo(-size/2 + thickness, -size/3 - thickness);
    shape.lineTo(size/2 - thickness, -size/3 - thickness);
    shape.lineTo(size/2 - thickness, size/3 - thickness);
    shape.lineTo(-size/2, size/3 - thickness);
    shape.lineTo(-size/2, size);
    
    return new THREE.ShapeGeometry(shape);
  }

  /**
   * 创建P字母几何体
   * Create P letter geometry
   * @param {number} scale - 缩放比例
   * @returns {THREE.BufferGeometry} P字母几何体
   */
  createPGeometry(scale = 1) {
    const shape = new THREE.Shape();
    const size = 0.6 * scale;
    const thickness = 0.12 * scale;
    
    // P字母外轮廓
    shape.moveTo(-size/2, size);
    shape.lineTo(size/3, size);
    shape.lineTo(size/3, size/6);
    shape.lineTo(-size/2 + thickness, size/6);
    shape.lineTo(-size/2 + thickness, -size);
    shape.lineTo(-size/2, -size);
    shape.lineTo(-size/2, size);
    
    // P字母上半部分的横线
    const hole = new THREE.Path();
    hole.moveTo(-size/2 + thickness, size - thickness);
    hole.lineTo(size/3 - thickness, size - thickness);
    hole.lineTo(size/3 - thickness, size/6 + thickness);
    hole.lineTo(-size/2 + thickness, size/6 + thickness);
    shape.holes.push(hole);
    
    return new THREE.ShapeGeometry(shape);
  }

  /**
   * 创建H字母几何体
   * Create H letter geometry
   * @param {number} scale - 缩放比例
   * @returns {THREE.BufferGeometry} H字母几何体
   */
  createHGeometry(scale = 1) {
    const shape = new THREE.Shape();
    const size = 0.6 * scale;
    const thickness = 0.12 * scale;
    
    // H字母 - 左竖线
    shape.moveTo(-size/2, size);
    shape.lineTo(-size/2 + thickness, size);
    shape.lineTo(-size/2 + thickness, thickness/2);
    shape.lineTo(size/2 - thickness, thickness/2);
    shape.lineTo(size/2 - thickness, size);
    shape.lineTo(size/2, size);
    shape.lineTo(size/2, -size);
    shape.lineTo(size/2 - thickness, -size);
    shape.lineTo(size/2 - thickness, -thickness/2);
    shape.lineTo(-size/2 + thickness, -thickness/2);
    shape.lineTo(-size/2 + thickness, -size);
    shape.lineTo(-size/2, -size);
    shape.lineTo(-size/2, size);
    
    return new THREE.ShapeGeometry(shape);
  }

  /**
   * 创建I字母几何体
   * Create I letter geometry
   * @param {number} scale - 缩放比例
   * @returns {THREE.BufferGeometry} I字母几何体
   */
  createIGeometry(scale = 1) {
    const shape = new THREE.Shape();
    const size = 0.6 * scale;
    const thickness = 0.12 * scale;
    const width = 0.4 * scale;
    
    // I字母形状
    shape.moveTo(-width/2, size);
    shape.lineTo(width/2, size);
    shape.lineTo(width/2, size - thickness);
    shape.lineTo(thickness/2, size - thickness);
    shape.lineTo(thickness/2, -size + thickness);
    shape.lineTo(width/2, -size + thickness);
    shape.lineTo(width/2, -size);
    shape.lineTo(-width/2, -size);
    shape.lineTo(-width/2, -size + thickness);
    shape.lineTo(-thickness/2, -size + thickness);
    shape.lineTo(-thickness/2, size - thickness);
    shape.lineTo(-width/2, size - thickness);
    shape.lineTo(-width/2, size);
    
    return new THREE.ShapeGeometry(shape);
  }

  /**
   * 创建A字母几何体
   * Create A letter geometry
   * @param {number} scale - 缩放比例
   * @returns {THREE.BufferGeometry} A字母几何体
   */
  createAGeometry(scale = 1) {
    const shape = new THREE.Shape();
    const size = 0.6 * scale;
    const thickness = 0.12 * scale;
    
    // A字母外轮廓
    shape.moveTo(0, size);
    shape.lineTo(size/2, -size);
    shape.lineTo(size/2 - thickness, -size);
    shape.lineTo(thickness/4, size/3);
    shape.lineTo(-thickness/4, size/3);
    shape.lineTo(-size/2 + thickness, -size);
    shape.lineTo(-size/2, -size);
    shape.lineTo(0, size);
    
    // A字母中间的洞
    const hole = new THREE.Path();
    hole.moveTo(0, size - thickness);
    hole.lineTo(-thickness/2, size/3 + thickness);
    hole.lineTo(thickness/2, size/3 + thickness);
    hole.lineTo(0, size - thickness);
    shape.holes.push(hole);
    
    return new THREE.ShapeGeometry(shape);
  }

  /**
   * 创建R字母几何体
   * Create R letter geometry
   * @param {number} scale - 缩放比例
   * @returns {THREE.BufferGeometry} R字母几何体
   */
  createRGeometry(scale = 1) {
    const shape = new THREE.Shape();
    const size = 0.6 * scale;
    const thickness = 0.12 * scale;
    
    // R字母基于P字母加斜线
    shape.moveTo(-size/2, size);
    shape.lineTo(size/3, size);
    shape.lineTo(size/3, size/6);
    shape.lineTo(size/2, -size);
    shape.lineTo(size/2 - thickness, -size);
    shape.lineTo(size/6, size/6);
    shape.lineTo(-size/2 + thickness, size/6);
    shape.lineTo(-size/2 + thickness, -size);
    shape.lineTo(-size/2, -size);
    shape.lineTo(-size/2, size);
    
    // R字母上半部分的洞
    const hole = new THREE.Path();
    hole.moveTo(-size/2 + thickness, size - thickness);
    hole.lineTo(size/3 - thickness, size - thickness);
    hole.lineTo(size/3 - thickness, size/6 + thickness);
    hole.lineTo(-size/2 + thickness, size/6 + thickness);
    shape.holes.push(hole);
    
    return new THREE.ShapeGeometry(shape);
  }

  /**
   * 创建粒子系统
   * Create particle system
   */
  createParticleSystem() {
    // 创建汽车轮廓的粒子点
    const carPoints = this.generateCarOutlinePoints();
    
    // 创建粒子几何体
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = carPoints.length;
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // 初始化粒子属性
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // 初始位置（随机分散）
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;
      
      // 颜色（赛博朋克蓝色系）
      const color = new THREE.Color();
      color.setHSL(0.55 + Math.random() * 0.1, 0.8, 0.6);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      // 大小
      sizes[i] = Math.random() * 0.1 + 0.05;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // 创建粒子材质
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    // 创建粒子系统
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(this.particles);
    
    // 保存目标位置（汽车轮廓）
    this.carTargetPositions = carPoints;
  }

  /**
   * 生成汽车轮廓点 - 爆炸图样式
   * Generate car outline points - exploded view style
   * @returns {Array} 汽车轮廓点数组
   */
  generateCarOutlinePoints() {
    const points = [];
    
    // 汽车爆炸图 - 各个部件分离显示
    
    // 1. 底盘框架（最下层）
    this.generateChassisPoints(points, 0, -3, 0);
    
    // 2. 四个车轮（分离位置）
    this.generateWheelPoints(points, -3.5, -2, -0.5); // 左前轮
    this.generateWheelPoints(points, 3.5, -2, -0.5);  // 右前轮
    this.generateWheelPoints(points, -3.5, -2, 0.5);  // 左后轮
    this.generateWheelPoints(points, 3.5, -2, 0.5);   // 右后轮
    
    // 3. 发动机舱（前部分离）
    this.generateEnginePoints(points, 0, -1, 0);
    
    // 4. 车身主体（中间层）
    this.generateBodyPoints(points, 0, 1, 0);
    
    // 5. 车顶和车窗（上层分离）
    this.generateRoofPoints(points, 0, 3, 0);
    
    // 6. 车门（两侧分离）
    this.generateDoorPoints(points, -2.5, 1, 0); // 左门
    this.generateDoorPoints(points, 2.5, 1, 0);  // 右门
    
    // 7. 前后保险杠（分离）
    this.generateBumperPoints(points, 0, 0, -2); // 前保险杠
    this.generateBumperPoints(points, 0, 0, 2);  // 后保险杠
    
    // 8. 内部组件（散布）
    this.generateInternalComponents(points);
    
    return points;
  }

  /**
   * 生成底盘框架点
   * Generate chassis frame points
   */
  generateChassisPoints(points, offsetX, offsetY, offsetZ) {
    // 底盘框架 - 矩形框架结构
    const width = 2.5;
    const length = 4;
    const height = 0.3;
    
    // 框架边缘
    for (let x = -length/2; x <= length/2; x += 0.3) {
      points.push(new THREE.Vector3(x + offsetX, offsetY, -width/2 + offsetZ));
      points.push(new THREE.Vector3(x + offsetX, offsetY, width/2 + offsetZ));
      points.push(new THREE.Vector3(x + offsetX, offsetY + height, -width/2 + offsetZ));
      points.push(new THREE.Vector3(x + offsetX, offsetY + height, width/2 + offsetZ));
    }
    
    // 横梁
    for (let z = -width/2; z <= width/2; z += 0.3) {
      points.push(new THREE.Vector3(-length/2 + offsetX, offsetY, z + offsetZ));
      points.push(new THREE.Vector3(length/2 + offsetX, offsetY, z + offsetZ));
    }
  }

  /**
   * 生成车轮点
   * Generate wheel points
   */
  generateWheelPoints(points, offsetX, offsetY, offsetZ) {
    const radius = 0.6;
    const thickness = 0.3;
    
    // 轮胎外圈
    for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x + offsetX, y + offsetY, offsetZ));
      points.push(new THREE.Vector3(x + offsetX, y + offsetY, offsetZ + thickness));
    }
    
    // 轮毂辐条
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      for (let r = 0; r < radius * 0.8; r += 0.2) {
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        points.push(new THREE.Vector3(x + offsetX, y + offsetY, offsetZ + thickness/2));
      }
    }
  }

  /**
   * 生成发动机舱点
   * Generate engine compartment points
   */
  generateEnginePoints(points, offsetX, offsetY, offsetZ) {
    const width = 2;
    const length = 1.5;
    const height = 1;
    
    // 发动机舱外壳
    for (let x = -length/2; x <= length/2; x += 0.25) {
      for (let z = -width/2; z <= width/2; z += 0.25) {
        points.push(new THREE.Vector3(x + offsetX, offsetY, z + offsetZ));
        points.push(new THREE.Vector3(x + offsetX, offsetY + height, z + offsetZ));
      }
    }
    
    // 发动机内部组件
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * length + offsetX;
      const y = Math.random() * height + offsetY;
      const z = (Math.random() - 0.5) * width + offsetZ;
      points.push(new THREE.Vector3(x, y, z));
    }
  }

  /**
   * 生成车身主体点
   * Generate body points
   */
  generateBodyPoints(points, offsetX, offsetY, offsetZ) {
    const width = 2.2;
    const length = 3.5;
    const height = 1.2;
    
    // 车身外壳
    for (let x = -length/2; x <= length/2; x += 0.3) {
      for (let z = -width/2; z <= width/2; z += 0.3) {
        points.push(new THREE.Vector3(x + offsetX, offsetY, z + offsetZ));
        points.push(new THREE.Vector3(x + offsetX, offsetY + height, z + offsetZ));
      }
    }
    
    // 车身侧面轮廓
    for (let x = -length/2; x <= length/2; x += 0.2) {
      points.push(new THREE.Vector3(x + offsetX, offsetY + height/2, -width/2 + offsetZ));
      points.push(new THREE.Vector3(x + offsetX, offsetY + height/2, width/2 + offsetZ));
    }
  }

  /**
   * 生成车顶点
   * Generate roof points
   */
  generateRoofPoints(points, offsetX, offsetY, offsetZ) {
    const width = 2;
    const length = 2.5;
    const height = 0.2;
    
    // 车顶面板
    for (let x = -length/2; x <= length/2; x += 0.3) {
      for (let z = -width/2; z <= width/2; z += 0.3) {
        points.push(new THREE.Vector3(x + offsetX, offsetY, z + offsetZ));
      }
    }
    
    // 车窗框架
    const windowWidth = width * 0.8;
    const windowLength = length * 0.8;
    for (let x = -windowLength/2; x <= windowLength/2; x += 0.4) {
      points.push(new THREE.Vector3(x + offsetX, offsetY - 0.1, -windowWidth/2 + offsetZ));
      points.push(new THREE.Vector3(x + offsetX, offsetY - 0.1, windowWidth/2 + offsetZ));
    }
  }

  /**
   * 生成车门点
   * Generate door points
   */
  generateDoorPoints(points, offsetX, offsetY, offsetZ) {
    const width = 0.2;
    const length = 1.5;
    const height = 1.2;
    
    // 车门面板
    for (let x = -length/2; x <= length/2; x += 0.3) {
      for (let y = 0; y <= height; y += 0.3) {
        points.push(new THREE.Vector3(x + offsetX, y + offsetY, offsetZ));
        points.push(new THREE.Vector3(x + offsetX, y + offsetY, offsetZ + width));
      }
    }
    
    // 车门把手
    points.push(new THREE.Vector3(offsetX, offsetY + height/2, offsetZ + width/2));
  }

  /**
   * 生成保险杠点
   * Generate bumper points
   */
  generateBumperPoints(points, offsetX, offsetY, offsetZ) {
    const width = 2.5;
    const height = 0.4;
    const depth = 0.3;
    
    for (let x = -width/2; x <= width/2; x += 0.3) {
      for (let y = 0; y <= height; y += 0.2) {
        points.push(new THREE.Vector3(x + offsetX, y + offsetY, offsetZ));
        points.push(new THREE.Vector3(x + offsetX, y + offsetY, offsetZ + depth));
      }
    }
  }

  /**
   * 生成内部组件点
   * Generate internal components points
   */
  generateInternalComponents(points) {
    // 座椅
    for (let i = 0; i < 4; i++) {
      const seatX = (i % 2 === 0 ? -0.8 : 0.8);
      const seatZ = (i < 2 ? 0.5 : -0.5);
      const seatY = 0.5 + Math.random() * 0.5;
      
      // 座椅点
      for (let dx = -0.3; dx <= 0.3; dx += 0.15) {
        for (let dz = -0.3; dz <= 0.3; dz += 0.15) {
          points.push(new THREE.Vector3(seatX + dx, seatY, seatZ + dz));
        }
      }
    }
    
    // 方向盘
    const steeringRadius = 0.3;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
      const x = Math.cos(angle) * steeringRadius - 0.8;
      const z = Math.sin(angle) * steeringRadius;
      points.push(new THREE.Vector3(x, 1.2, z));
    }
    
    // 仪表盘
    for (let x = -1.2; x <= -0.4; x += 0.2) {
      points.push(new THREE.Vector3(x, 1, 0));
    }
    
    // 其他小部件（随机散布）
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 6;
      const y = Math.random() * 4 - 1;
      const z = (Math.random() - 0.5) * 4;
      points.push(new THREE.Vector3(x, y, z));
    }
  }

  /**
   * 动画循环
   * Animation loop
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    
    // 根据动画阶段执行不同的动画
    if (this.animationPhase === 'title') {
      this.animateTitlePhase(elapsed);
      
      if (elapsed > this.titleDuration) {
        this.animationPhase = 'particles';
        this.startTime = currentTime; // 重置时间
      }
    } else if (this.animationPhase === 'particles') {
      this.animateParticlePhase(elapsed);
      
      if (elapsed > this.particleDuration) {
        this.animationPhase = 'display';
        this.startTime = currentTime; // 重置时间
      }
    } else if (this.animationPhase === 'display') {
      this.animateDisplayPhase(elapsed);
      
      if (elapsed > this.displayDuration) {
        this.animationPhase = 'complete';
        this.onAnimationComplete();
      }
    }
    
    // 渲染场景
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 标题动画阶段
   * Title animation phase
   * @param {number} elapsed - 已过时间
   */
  animateTitlePhase(elapsed) {
    this.titleMeshes.forEach((letterGroup, index) => {
      const letterDelay = index * 250; // 每个字母延迟250ms
      const letterElapsed = Math.max(0, elapsed - letterDelay);
      const letterProgress = Math.min(letterElapsed / 1000, 1); // 每个字母动画1000ms
      
      if (letterProgress > 0) {
        // 缓动函数：缓出效果
        const easeOut = 1 - Math.pow(1 - letterProgress, 3);
        
        // 缩放动画 - 从很小缩放到视觉重心大小
        const baseScale = 2.5; // 基础大小
        const scale = (0.1 + (1 - 0.1) * easeOut) * baseScale;
        letterGroup.scale.set(scale, scale, scale);
        
        // 更新组合中的每个网格
        letterGroup.children.forEach((mesh, meshIndex) => {
          if (mesh.material) {
            // 透明度动画
            mesh.material.opacity = easeOut * (meshIndex === 0 ? 0.3 : 1); // 发光层更透明
            
            // 强烈的荧光效果
            if (mesh.material.emissiveIntensity !== undefined) {
              const pulseIntensity = 0.8 + Math.sin(elapsed * 0.008 + index * 0.5) * 0.4;
              const flickerIntensity = 1 + Math.sin(elapsed * 0.02 + index) * 0.2;
              mesh.material.emissiveIntensity = pulseIntensity * flickerIntensity * easeOut;
            }
            
            // 颜色变化效果
            if (mesh.material.emissive) {
              const hue = 0.5 + Math.sin(elapsed * 0.003 + index * 0.3) * 0.1; // 蓝色到青色变化
              const color = new THREE.Color().setHSL(hue, 1, 0.5);
              mesh.material.emissive.copy(color);
              
              if (meshIndex === 0) { // 发光层
                mesh.material.color.copy(color);
              }
            }
          }
        });
        
        // 轻微的浮动效果 - 适应大字母
        letterGroup.position.y = Math.sin(elapsed * 0.004 + index * 0.8) * 0.3;
        
        // 轻微的旋转效果
        letterGroup.rotation.z = Math.sin(elapsed * 0.002 + index * 0.5) * 0.05;
        
        // 电流效果 - 随机闪烁
        if (Math.random() < 0.02) { // 2%概率闪烁
          letterGroup.children.forEach(mesh => {
            if (mesh.material && mesh.material.emissiveIntensity !== undefined) {
              mesh.material.emissiveIntensity *= 2; // 短暂增强发光
              setTimeout(() => {
                if (mesh.material) {
                  mesh.material.emissiveIntensity *= 0.5; // 恢复正常
                }
              }, 50);
            }
          });
        }
      }
    });
  }

  /**
   * 粒子动画阶段
   * Particle animation phase
   * @param {number} elapsed - 已过时间
   */
  animateParticlePhase(elapsed) {
    if (!this.particles) return;
    
    const progress = Math.min(elapsed / this.particleDuration, 1);
    const easeInOut = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    // 粒子透明度和亮度逐渐增强 - 为展示阶段做准备
    const baseOpacity = Math.sin(progress * Math.PI) * 0.6;
    const brightnessBoost = progress > 0.8 ? (progress - 0.8) * 5 : 0; // 最后20%时间亮度快速提升
    this.particles.material.opacity = Math.min(baseOpacity + brightnessBoost, 0.9);
    
    // 更新粒子位置
    const positions = this.particles.geometry.attributes.position.array;
    const targetPositions = this.carTargetPositions;
    
    for (let i = 0; i < targetPositions.length; i++) {
      const i3 = i * 3;
      
      if (targetPositions[i]) {
        // 从随机位置移动到汽车轮廓位置
        const startX = (Math.random() - 0.5) * 20;
        const startY = (Math.random() - 0.5) * 20;
        const startZ = (Math.random() - 0.5) * 10;
        
        positions[i3] = startX + (targetPositions[i].x - startX) * easeInOut;
        positions[i3 + 1] = startY + (targetPositions[i].y - startY) * easeInOut;
        positions[i3 + 2] = startZ + (targetPositions[i].z - startZ) * easeInOut;
      }
    }
    
    this.particles.geometry.attributes.position.needsUpdate = true;
    
    // 粒子旋转效果 - 在聚集完成时减慢旋转为展示阶段做准备
    const rotationSpeed = 0.0005 * (1 - progress * 0.5); // 逐渐减慢
    this.particles.rotation.y = elapsed * rotationSpeed;
    
    // 聚集完成时的稳定效果
    if (progress > 0.9) {
      // 最后10%时间让粒子稳定，准备进入展示阶段
      const stabilizeProgress = (progress - 0.9) / 0.1;
      this.particles.material.opacity = 0.6 + stabilizeProgress * 0.3; // 亮度平滑过渡到展示阶段
    }
    
    // 标题文字逐渐消失，但保持荧光效果
    this.titleMeshes.forEach((letterGroup, index) => {
      const fadeProgress = Math.max(0, 1 - progress * 1.5);
      
      letterGroup.children.forEach((mesh, meshIndex) => {
        if (mesh.material) {
          mesh.material.opacity = fadeProgress * (meshIndex === 0 ? 0.3 : 1);
          
          // 消失时增强荧光效果
          if (mesh.material.emissiveIntensity !== undefined) {
            const intensityBoost = 1 + (1 - fadeProgress) * 2; // 消失时发光更强
            mesh.material.emissiveIntensity = (0.8 + Math.sin(elapsed * 0.01) * 0.4) * intensityBoost;
          }
        }
      });
      
      // 消失时的特效
      if (progress > 0.7) {
        letterGroup.rotation.z += 0.02;
        // 保持基础大小的同时添加消失效果
        const baseScale = 2.5;
        const disappearScale = baseScale * (1 + (progress - 0.7) * 0.15);
        letterGroup.scale.set(disappearScale, disappearScale, disappearScale);
      }
    });
  }

  /**
   * 展示阶段动画 - 汽车爆炸图完整展示
   * Display phase animation - complete exploded car view
   * @param {number} elapsed - 已过时间
   */
  animateDisplayPhase(elapsed) {
    if (!this.particles) return;
    
    const progress = Math.min(elapsed / this.displayDuration, 1);
    
    // 亮度从粒子阶段的0.9平滑过渡到完全亮度
    const brightnessProgress = progress < 0.3 ? progress / 0.3 : 1; // 前30%时间用于亮度过渡
    this.particles.material.opacity = 0.9 + brightnessProgress * 0.1; // 从0.9到1.0
    
    // 轻微的整体旋转，让用户可以从不同角度观察
    // 继承粒子阶段的旋转，然后平滑过渡到展示旋转
    const baseRotationY = this.particleDuration * 0.0005 * 0.5; // 粒子阶段结束时的旋转
    this.particles.rotation.y = baseRotationY + elapsed * 0.0003;
    this.particles.rotation.x = Math.sin(elapsed * 0.0005) * 0.1;
    
    // 粒子轻微的呼吸效果 - 更加明显
    const breathe = 1 + Math.sin(elapsed * 0.003) * 0.03;
    this.particles.scale.set(breathe, breathe, breathe);
    
    // 添加发光效果增强
    if (progress > 0.5) {
      // 后半段时间添加发光脉冲
      const glowPulse = Math.sin((elapsed - this.displayDuration * 0.5) * 0.008) * 0.1;
      this.particles.material.opacity = Math.min(1.0 + glowPulse, 1.0);
    }
    
    // 标题文字完全消失
    this.titleMeshes.forEach((letterGroup) => {
      letterGroup.children.forEach((mesh) => {
        if (mesh.material) {
          mesh.material.opacity = 0;
        }
      });
    });
  }

  /**
   * 动画完成回调
   * Animation complete callback
   */
  onAnimationComplete() {
    // 触发自定义事件通知动画完成
    const event = new CustomEvent('loadingAnimationComplete');
    this.container.dispatchEvent(event);
  }

  /**
   * 处理窗口大小变化
   * Handle window resize
   */
  handleResize() {
    if (!this.camera || !this.renderer) return;
    
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  /**
   * 销毁动画
   * Destroy animation
   */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // 清理场景对象
    this.titleMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
      this.scene.remove(mesh);
    });
    
    if (this.particles) {
      if (this.particles.geometry) this.particles.geometry.dispose();
      if (this.particles.material) this.particles.material.dispose();
      this.scene.remove(this.particles);
    }
    
    // 清理渲染器
    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
  }
}