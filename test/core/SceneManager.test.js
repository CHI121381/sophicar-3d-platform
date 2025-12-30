/**
 * SceneManager 单元测试
 * SceneManager unit tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { SceneManager } from '../../src/core/SceneManager.js';

describe('SceneManager', () => {
  let container;
  let sceneManager;

  beforeEach(() => {
    // 创建测试容器
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    
    // 创建场景管理器实例
    sceneManager = new SceneManager(container);
  });

  afterEach(() => {
    // 清理资源
    if (sceneManager) {
      sceneManager.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('初始化 (Initialization)', () => {
    it('应该正确初始化场景管理器', () => {
      expect(sceneManager.scene).toBeInstanceOf(THREE.Scene);
      expect(sceneManager.camera).toBeInstanceOf(THREE.PerspectiveCamera);
      expect(sceneManager.renderer).toBeInstanceOf(THREE.WebGLRenderer);
      expect(sceneManager.objects).toBeInstanceOf(Map);
    });

    it('应该设置正确的相机参数', () => {
      expect(sceneManager.camera.fov).toBe(75);
      expect(sceneManager.camera.near).toBe(0.1);
      expect(sceneManager.camera.far).toBe(1000);
    });

    it('应该将渲染器添加到容器中', () => {
      expect(container.children.length).toBe(1);
      expect(container.children[0]).toBe(sceneManager.renderer.domElement);
    });
  });

  describe('对象管理 (Object Management)', () => {
    it('应该能够添加3D对象到场景', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      
      const objectId = sceneManager.addObject(cube);
      
      expect(objectId).toBeTruthy();
      expect(sceneManager.objects.has(objectId)).toBe(true);
      expect(sceneManager.scene.children).toContain(cube);
    });

    it('应该能够通过ID获取对象', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      
      const objectId = sceneManager.addObject(cube);
      const retrievedObject = sceneManager.getObject(objectId);
      
      expect(retrievedObject).toBe(cube);
    });

    it('应该能够移除场景中的对象', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      
      const objectId = sceneManager.addObject(cube);
      const removed = sceneManager.removeObject(objectId);
      
      expect(removed).toBe(true);
      expect(sceneManager.objects.has(objectId)).toBe(false);
      expect(sceneManager.scene.children).not.toContain(cube);
    });

    it('应该拒绝无效的3D对象', () => {
      const result = sceneManager.addObject(null);
      expect(result).toBe(false);
      
      const result2 = sceneManager.addObject('not an object');
      expect(result2).toBe(false);
    });
  });

  describe('场景清理 (Scene Cleanup)', () => {
    it('应该能够清空所有场景对象', () => {
      // 添加多个对象
      for (let i = 0; i < 3; i++) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        sceneManager.addObject(cube);
      }
      
      expect(sceneManager.objects.size).toBe(3);
      
      sceneManager.clearScene();
      
      expect(sceneManager.objects.size).toBe(0);
    });
  });

  describe('窗口大小调整 (Window Resize)', () => {
    it('应该正确处理窗口大小变化', () => {
      // 模拟容器大小变化
      // 在测试环境中，我们需要模拟 clientWidth 和 clientHeight
      Object.defineProperty(container, 'clientWidth', {
        value: 1200,
        configurable: true
      });
      Object.defineProperty(container, 'clientHeight', {
        value: 800,
        configurable: true
      });
      
      sceneManager.handleResize();
      
      expect(sceneManager.camera.aspect).toBe(1200 / 800);
      // 注意：在测试环境中，renderer.domElement 的 width/height 可能不会实际改变
      // 我们主要测试相机的 aspect ratio 是否正确更新
    });
  });
});