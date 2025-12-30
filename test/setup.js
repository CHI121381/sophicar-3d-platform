/**
 * 测试环境设置文件
 * Test environment setup file
 */

// 模拟 WebGL 上下文（用于 Three.js 测试）
// Mock WebGL context (for Three.js testing)
global.WebGLRenderingContext = class WebGLRenderingContext {};
global.WebGL2RenderingContext = class WebGL2RenderingContext {};

// WebGL 常量
const GL_CONSTANTS = {
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  HIGH_FLOAT: 36338,
  MEDIUM_FLOAT: 36337,
  LOW_FLOAT: 36336,
  HIGH_INT: 36341,
  MEDIUM_INT: 36340,
  LOW_INT: 36339,
  DEPTH_TEST: 2929,
  CULL_FACE: 2884,
  BLEND: 3042,
  ARRAY_BUFFER: 34962,
  ELEMENT_ARRAY_BUFFER: 34963,
  STATIC_DRAW: 35044,
  DYNAMIC_DRAW: 35048,
  TRIANGLES: 4,
  LINES: 1,
  POINTS: 0,
  VERSION: 7938,
  RENDERER: 7937,
  VENDOR: 7936,
  SHADING_LANGUAGE_VERSION: 35724,
  VIEWPORT: 2978,
  SCISSOR_BOX: 3088,
  TEXTURE_2D: 3553,
  TEXTURE_3D: 32879,
  TEXTURE_2D_ARRAY: 35866,
  RGBA: 6408,
  FLOAT: 5126,
  FLOAT_VEC3: 35665
};

// 模拟 HTMLCanvasElement
// Mock HTMLCanvasElement
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function(contextType) {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        canvas: this,
        drawingBufferWidth: 800,
        drawingBufferHeight: 600,
        
        // WebGL 常量
        ...GL_CONSTANTS,
        
        // 基础方法
        getParameter: (param) => {
          switch (param) {
            case GL_CONSTANTS.HIGH_FLOAT:
            case GL_CONSTANTS.MEDIUM_FLOAT:
            case GL_CONSTANTS.LOW_FLOAT:
              return { precision: 23, rangeMin: 127, rangeMax: 127 };
            case GL_CONSTANTS.HIGH_INT:
            case GL_CONSTANTS.MEDIUM_INT:
            case GL_CONSTANTS.LOW_INT:
              return { precision: 0, rangeMin: 31, rangeMax: 30 };
            case GL_CONSTANTS.VERSION:
              return 'WebGL 1.0 (Mock)';
            case GL_CONSTANTS.RENDERER:
              return 'Mock WebGL Renderer';
            case GL_CONSTANTS.VENDOR:
              return 'Mock WebGL Vendor';
            case GL_CONSTANTS.SHADING_LANGUAGE_VERSION:
              return 'WebGL GLSL ES 1.0 (Mock)';
            case 3379: // MAX_TEXTURE_SIZE
              return 4096;
            case 34076: // MAX_CUBE_MAP_TEXTURE_SIZE
              return 4096;
            case 34024: // MAX_VERTEX_ATTRIBS
              return 16;
            case 34930: // MAX_VERTEX_UNIFORM_VECTORS
              return 256;
            case 34921: // MAX_VARYING_VECTORS
              return 8;
            case 34929: // MAX_FRAGMENT_UNIFORM_VECTORS
              return 256;
            case GL_CONSTANTS.VIEWPORT:
              return [0, 0, 800, 600];
            case GL_CONSTANTS.SCISSOR_BOX:
              return [0, 0, 800, 600];
            default:
              return null;
          }
        },
        
        getExtension: () => null,
        getSupportedExtensions: () => [],
        getContextAttributes: () => ({
          alpha: true,
          antialias: true,
          depth: true,
          failIfMajorPerformanceCaveat: false,
          powerPreference: 'default',
          premultipliedAlpha: true,
          preserveDrawingBuffer: false,
          stencil: false
        }),
        
        // 着色器精度格式
        getShaderPrecisionFormat: (shaderType, precisionType) => ({
          precision: 23,
          rangeMin: 127,
          rangeMax: 127
        }),
        
        // 程序和着色器
        createProgram: () => ({}),
        createShader: () => ({}),
        shaderSource: () => {},
        compileShader: () => {},
        attachShader: () => {},
        linkProgram: () => {},
        getProgramParameter: () => true,
        getShaderParameter: () => true,
        getProgramInfoLog: () => '',
        getShaderInfoLog: () => '',
        useProgram: () => {},
        deleteProgram: () => {},
        deleteShader: () => {},
        
        // 缓冲区
        createBuffer: () => ({}),
        bindBuffer: () => {},
        bufferData: () => {},
        deleteBuffer: () => {},
        
        // 顶点属性
        enableVertexAttribArray: () => {},
        disableVertexAttribArray: () => {},
        vertexAttribPointer: () => {},
        getAttribLocation: () => 0,
        
        // 统一变量
        getUniformLocation: () => ({}),
        getActiveUniform: (program, index) => ({
          name: `uniform_${index}`,
          type: GL_CONSTANTS.FLOAT,
          size: 1
        }),
        getActiveAttrib: (program, index) => ({
          name: `attribute_${index}`,
          type: GL_CONSTANTS.FLOAT_VEC3,
          size: 1
        }),
        uniform1f: () => {},
        uniform1i: () => {},
        uniform2f: () => {},
        uniform3f: () => {},
        uniform4f: () => {},
        uniformMatrix3fv: () => {},
        uniformMatrix4fv: () => {},
        
        // 纹理
        createTexture: () => ({}),
        bindTexture: () => {},
        texImage2D: () => {},
        texImage3D: () => {},
        texSubImage2D: () => {},
        texSubImage3D: () => {},
        texParameteri: () => {},
        texParameterf: () => {},
        generateMipmap: () => {},
        deleteTexture: () => {},
        activeTexture: () => {},
        pixelStorei: () => {},
        
        // 帧缓冲区
        createFramebuffer: () => ({}),
        bindFramebuffer: () => {},
        framebufferTexture2D: () => {},
        checkFramebufferStatus: () => 36053, // FRAMEBUFFER_COMPLETE
        deleteFramebuffer: () => {},
        
        // 渲染缓冲区
        createRenderbuffer: () => ({}),
        bindRenderbuffer: () => {},
        renderbufferStorage: () => {},
        framebufferRenderbuffer: () => {},
        deleteRenderbuffer: () => {},
        
        // 渲染状态
        clear: () => {},
        clearColor: () => {},
        clearDepth: () => {},
        clearStencil: () => {},
        enable: () => {},
        disable: () => {},
        depthFunc: () => {},
        depthMask: () => {},
        colorMask: () => {},
        stencilMask: () => {},
        stencilFunc: () => {},
        stencilOp: () => {},
        viewport: () => {},
        scissor: () => {},
        blendFunc: () => {},
        blendFuncSeparate: () => {},
        blendEquation: () => {},
        blendEquationSeparate: () => {},
        cullFace: () => {},
        frontFace: () => {},
        lineWidth: () => {}, // 添加 lineWidth 方法
        
        // 绘制
        drawArrays: () => {},
        drawElements: () => {},
        
        // 其他
        flush: () => {},
        finish: () => {},
        getError: () => 0, // NO_ERROR
        isContextLost: () => false,
        
        // WebGL 2.0 methods
        texStorage2D: () => {},
        texStorage3D: () => {},
        drawBuffers: () => {},
        
        // Additional methods
        compressedTexImage2D: () => {},
        compressedTexSubImage2D: () => {},
        readPixels: () => {},
        copyTexImage2D: () => {},
        copyTexSubImage2D: () => {},
        
        // Vertex array objects
        createVertexArray: () => ({}),
        bindVertexArray: () => {},
        deleteVertexArray: () => {},
        
        // Query objects
        createQuery: () => ({}),
        deleteQuery: () => {},
        beginQuery: () => {},
        endQuery: () => {},
        getQuery: () => null,
        getQueryParameter: () => null
      };
    }
    return null;
  };
}

// 模拟 requestAnimationFrame
// Mock requestAnimationFrame
if (typeof global !== 'undefined') {
  global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 16);
  };

  global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
  };
}

// Also set on window if it exists
if (typeof window !== 'undefined') {
  window.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 16);
  };

  window.cancelAnimationFrame = (id) => {
    clearTimeout(id);
  };
}

// 模拟 window 对象的一些属性
// Mock some window object properties
if (typeof window !== 'undefined') {
  window.innerWidth = 1024;
  window.innerHeight = 768;
  
  // 模拟 addEventListener
  if (!window.addEventListener) {
    window.addEventListener = () => {};
    window.removeEventListener = () => {};
  }
}

// 模拟 document 对象
if (typeof document !== 'undefined') {
  if (!document.addEventListener) {
    document.addEventListener = () => {};
    document.removeEventListener = () => {};
  }
}