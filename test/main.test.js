/**
 * 主应用程序测试
 * Main application tests
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SophicarApp } from '../main.js';

describe('SophicarApp', () => {
  let app;

  beforeEach(() => {
    // 清理 DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // 清理应用实例
    if (app) {
      app.destroy();
      app = null;
    }
  });

  describe('应用初始化 (Application Initialization)', () => {
    it('应该成功创建应用实例', () => {
      app = new SophicarApp();
      
      expect(app).toBeDefined();
      expect(app.sceneManager).toBeDefined();
      expect(app.interactionController).toBeDefined();
      expect(app.modelingEngine).toBeDefined();
    });

    it('应该创建主容器', () => {
      app = new SophicarApp();
      
      const container = document.getElementById('sophicar-container');
      expect(container).toBeTruthy();
      expect(container.style.width).toBe('100vw');
      expect(container.style.height).toBe('100vh');
    });

    it('应该提供访问核心组件的方法', () => {
      app = new SophicarApp();
      
      expect(app.getSceneManager()).toBe(app.sceneManager);
      expect(app.getInteractionController()).toBe(app.interactionController);
      expect(app.getModelingEngine()).toBe(app.modelingEngine);
    });
  });

  describe('应用销毁 (Application Destruction)', () => {
    it('应该正确清理所有资源', () => {
      app = new SophicarApp();
      const container = document.getElementById('sophicar-container');
      
      expect(container).toBeTruthy();
      
      app.destroy();
      
      // 检查容器是否被移除
      const containerAfterDestroy = document.getElementById('sophicar-container');
      expect(containerAfterDestroy).toBeFalsy();
      
      app = null; // 防止 afterEach 中重复销毁
    });
  });
});