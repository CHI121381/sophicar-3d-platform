/**
 * 模型文件加载器测试
 * ModelFileLoader tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ModelFileLoader } from '../../src/loaders/ModelFileLoader.js';
import * as THREE from 'three';

describe('ModelFileLoader', () => {
  let loader;

  beforeEach(() => {
    loader = new ModelFileLoader();
  });

  afterEach(() => {
    if (loader) {
      loader.destroy();
    }
  });

  describe('初始化 (Initialization)', () => {
    it('应该正确初始化加载器 (should initialize loader correctly)', () => {
      expect(loader).toBeDefined();
      expect(loader.gltfLoader).toBeDefined();
      expect(loader.objLoader).toBeDefined();
      expect(loader.fbxLoader).toBeDefined();
      expect(loader.supportedFormats).toBeDefined();
      expect(loader.loadingProgress).toBeDefined();
      expect(loader.loadedModels).toBeDefined();
    });

    it('应该包含所有支持的格式 (should contain all supported formats)', () => {
      const formats = loader.getSupportedFormats();
      expect(formats).toHaveProperty('gltf');
      expect(formats).toHaveProperty('glb');
      expect(formats).toHaveProperty('obj');
      expect(formats).toHaveProperty('fbx');
    });
  });

  describe('格式检测 (Format Detection)', () => {
    it('应该正确检测GLTF格式 (should correctly detect GLTF format)', () => {
      expect(loader.detectFileFormat('model.gltf')).toBe('gltf');
      expect(loader.detectFileFormat('path/to/model.gltf')).toBe('gltf');
      expect(loader.detectFileFormat('MODEL.GLTF')).toBe('gltf');
    });

    it('应该正确检测GLB格式 (should correctly detect GLB format)', () => {
      expect(loader.detectFileFormat('model.glb')).toBe('glb');
      expect(loader.detectFileFormat('path/to/model.glb')).toBe('glb');
    });

    it('应该正确检测OBJ格式 (should correctly detect OBJ format)', () => {
      expect(loader.detectFileFormat('model.obj')).toBe('obj');
      expect(loader.detectFileFormat('path/to/model.obj')).toBe('obj');
    });

    it('应该正确检测FBX格式 (should correctly detect FBX format)', () => {
      expect(loader.detectFileFormat('model.fbx')).toBe('fbx');
      expect(loader.detectFileFormat('path/to/model.fbx')).toBe('fbx');
    });

    it('应该对不支持的格式返回null (should return null for unsupported formats)', () => {
      expect(loader.detectFileFormat('model.dae')).toBeNull();
      expect(loader.detectFileFormat('model.3ds')).toBeNull();
      expect(loader.detectFileFormat('model.blend')).toBeNull();
    });

    it('应该通过File对象检测格式 (should detect format from File object)', () => {
      const gltfFile = new File([''], 'model.gltf', { type: 'model/gltf+json' });
      const objFile = new File([''], 'model.obj', { type: 'text/plain' });
      
      expect(loader.detectFileFormat(gltfFile)).toBe('gltf');
      expect(loader.detectFileFormat(objFile)).toBe('obj');
    });
  });

  describe('格式支持检查 (Format Support Check)', () => {
    it('应该正确识别支持的格式 (should correctly identify supported formats)', () => {
      expect(loader.isFormatSupported('gltf')).toBe(true);
      expect(loader.isFormatSupported('glb')).toBe(true);
      expect(loader.isFormatSupported('obj')).toBe(true);
      expect(loader.isFormatSupported('fbx')).toBe(true);
      expect(loader.isFormatSupported('GLTF')).toBe(true); // 大小写不敏感
    });

    it('应该正确识别不支持的格式 (should correctly identify unsupported formats)', () => {
      expect(loader.isFormatSupported('dae')).toBe(false);
      expect(loader.isFormatSupported('3ds')).toBe(false);
      expect(loader.isFormatSupported('blend')).toBe(false);
      expect(loader.isFormatSupported('')).toBe(false);
    });
  });

  describe('加载ID生成 (Load ID Generation)', () => {
    it('应该为字符串路径生成唯一ID (should generate unique ID for string path)', () => {
      const id1 = loader.generateLoadId('model.gltf');
      const id2 = loader.generateLoadId('model.gltf');
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toContain('model.gltf');
    });

    it('应该为File对象生成唯一ID (should generate unique ID for File object)', () => {
      const file = new File([''], 'test-model.gltf', { type: 'model/gltf+json' });
      const id = loader.generateLoadId(file);
      
      expect(id).toBeDefined();
      expect(id).toContain('test-model.gltf');
    });
  });

  describe('进度跟踪 (Progress Tracking)', () => {
    it('应该正确初始化加载进度 (should correctly initialize loading progress)', () => {
      const loadId = 'test-load-id';
      loader.initializeLoadingProgress(loadId);
      
      const progress = loader.getLoadingProgress(loadId);
      expect(progress).toBeDefined();
      expect(progress.status).toBe('initializing');
      expect(progress.message).toBe('初始化加载...');
      expect(progress.progress).toBe(0);
      expect(progress.startTime).toBeDefined();
    });

    it('应该正确更新加载进度 (should correctly update loading progress)', () => {
      const loadId = 'test-load-id';
      loader.initializeLoadingProgress(loadId);
      loader.updateLoadingProgress(loadId, 'loading', '加载中...', 50);
      
      const progress = loader.getLoadingProgress(loadId);
      expect(progress.status).toBe('loading');
      expect(progress.message).toBe('加载中...');
      expect(progress.progress).toBe(50);
    });

    it('应该正确完成加载进度 (should correctly complete loading progress)', () => {
      const loadId = 'test-load-id';
      loader.initializeLoadingProgress(loadId);
      loader.completeLoadingProgress(loadId);
      
      const progress = loader.getLoadingProgress(loadId);
      expect(progress.status).toBe('completed');
      expect(progress.message).toBe('加载完成');
      expect(progress.progress).toBe(100);
      expect(progress.endTime).toBeDefined();
      expect(progress.duration).toBeDefined();
    });
  });

  describe('模型验证 (Model Validation)', () => {
    it('应该验证有效的Three.js对象 (should validate valid Three.js object)', () => {
      const validModel = new THREE.Group();
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      validModel.add(mesh);
      
      expect(() => loader.validateLoadedModel(validModel)).not.toThrow();
    });

    it('应该拒绝空模型 (should reject null model)', () => {
      expect(() => loader.validateLoadedModel(null)).toThrow('模型加载结果为空');
    });

    it('应该拒绝非Three.js对象 (should reject non-Three.js object)', () => {
      const invalidModel = { notAThreeObject: true };
      expect(() => loader.validateLoadedModel(invalidModel)).toThrow('加载的对象不是有效的Three.js 3D对象');
    });

    it('应该警告没有几何体的模型 (should warn about models without geometry)', () => {
      const emptyGroup = new THREE.Group();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      expect(() => loader.validateLoadedModel(emptyGroup)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('ModelFileLoader: 警告 - 模型不包含可见的几何体');
      
      consoleSpy.mockRestore();
    });
  });

  describe('后处理 (Post Processing)', () => {
    let testModel;

    beforeEach(() => {
      testModel = new THREE.Group();
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      testModel.add(mesh);
    });

    it('应该应用缩放 (should apply scaling)', () => {
      const options = { scale: 2.0 };
      const processedModel = loader.postProcessModel(testModel, options);
      
      expect(processedModel.scale.x).toBe(2.0);
      expect(processedModel.scale.y).toBe(2.0);
      expect(processedModel.scale.z).toBe(2.0);
    });

    it('应该应用位置 (should apply position)', () => {
      const options = { position: { x: 1, y: 2, z: 3 } };
      const processedModel = loader.postProcessModel(testModel, options);
      
      expect(processedModel.position.x).toBe(1);
      expect(processedModel.position.y).toBe(2);
      expect(processedModel.position.z).toBe(3);
    });

    it('应该应用旋转 (should apply rotation)', () => {
      const options = { rotation: { x: Math.PI / 2, y: Math.PI, z: Math.PI / 4 } };
      const processedModel = loader.postProcessModel(testModel, options);
      
      expect(processedModel.rotation.x).toBeCloseTo(Math.PI / 2);
      expect(processedModel.rotation.y).toBeCloseTo(Math.PI);
      expect(processedModel.rotation.z).toBeCloseTo(Math.PI / 4);
    });

    it('应该启用阴影 (should enable shadows)', () => {
      const options = { castShadow: true, receiveShadow: true };
      const processedModel = loader.postProcessModel(testModel, options);
      
      processedModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          expect(child.castShadow).toBe(true);
          expect(child.receiveShadow).toBe(true);
        }
      });
    });
  });

  describe('材质优化 (Material Optimization)', () => {
    it('应该优化重复材质 (should optimize duplicate materials)', () => {
      const model = new THREE.Group();
      
      // 创建两个具有相同属性的材质
      const material1 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const material2 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      
      const mesh1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material1);
      const mesh2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material2);
      
      model.add(mesh1);
      model.add(mesh2);
      
      loader.optimizeMaterials(model);
      
      // 优化后，两个网格应该共享同一个材质实例
      expect(mesh1.material).toBe(mesh2.material);
    });
  });

  describe('材质键生成 (Material Key Generation)', () => {
    it('应该为基础材质生成正确的键 (should generate correct key for basic material)', () => {
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const key = loader.generateMaterialKey(material);
      
      expect(key).toContain('MeshBasicMaterial');
      expect(key).toContain('color:ff0000');
    });

    it('应该为具有纹理的材质生成正确的键 (should generate correct key for textured material)', () => {
      const texture = new THREE.Texture();
      texture.uuid = 'test-texture-uuid';
      
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        map: texture
      });
      
      const key = loader.generateMaterialKey(material);
      
      expect(key).toContain('MeshBasicMaterial');
      expect(key).toContain('color:00ff00');
      expect(key).toContain('map:test-texture-uuid');
    });
  });

  describe('模型缓存管理 (Model Cache Management)', () => {
    it('应该缓存已加载的模型 (should cache loaded models)', () => {
      const loadId = 'test-model-id';
      const model = new THREE.Group();
      
      loader.loadedModels.set(loadId, model);
      
      const cachedModel = loader.getLoadedModel(loadId);
      expect(cachedModel).toBe(model);
    });

    it('应该清理已加载的模型 (should clear loaded models)', () => {
      const loadId = 'test-model-id';
      const model = new THREE.Group();
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      model.add(mesh);
      
      loader.loadedModels.set(loadId, model);
      
      const cleared = loader.clearLoadedModel(loadId);
      expect(cleared).toBe(true);
      expect(loader.getLoadedModel(loadId)).toBeNull();
    });

    it('应该处理不存在的模型清理 (should handle clearing non-existent models)', () => {
      const cleared = loader.clearLoadedModel('non-existent-id');
      expect(cleared).toBe(false);
    });
  });

  describe('错误处理 (Error Handling)', () => {
    it('应该处理空源参数 (should handle empty source parameter)', async () => {
      await expect(loader.loadModel(null)).rejects.toThrow('模型源不能为空');
      await expect(loader.loadModel('')).rejects.toThrow('模型源不能为空');
    });

    it('应该处理不支持的文件格式 (should handle unsupported file formats)', async () => {
      await expect(loader.loadModel('model.unsupported')).rejects.toThrow('不支持的文件格式');
    });

    it('应该处理无效的源类型 (should handle invalid source types)', async () => {
      await expect(loader.loadModel(123)).rejects.toThrow('不支持的文件格式');
      await expect(loader.loadModel({})).rejects.toThrow('不支持的文件格式');
    });
  });

  describe('销毁 (Destruction)', () => {
    it('应该正确销毁加载器 (should properly destroy loader)', () => {
      const loadId = 'test-model-id';
      const model = new THREE.Group();
      
      loader.loadedModels.set(loadId, model);
      loader.initializeLoadingProgress(loadId);
      
      expect(loader.loadedModels.size).toBe(1);
      expect(loader.loadingProgress.size).toBe(1);
      
      loader.destroy();
      
      expect(loader.loadedModels.size).toBe(0);
      expect(loader.loadingProgress.size).toBe(0);
    });
  });
});