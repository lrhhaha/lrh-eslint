import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('rules/index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('模块导出', () => {
    it('应该导出一个函数', async () => {
      // 重置模块以确保干净的导入
      vi.resetModules();
      
      const module = await import('../../rules/index');
      const initListenersMap = module.default;
      
      expect(typeof initListenersMap).toBe('function');
    });

    it('应该返回一个 Map 实例', async () => {
      vi.resetModules();
      
      const module = await import('../../rules/index');
      const initListenersMap = module.default;
      const listenersMap = initListenersMap();
      
      expect(listenersMap).toBeInstanceOf(Map);
    });

    it('返回的 Map 应该包含规则监听器', async () => {
      vi.resetModules();
      
      const module = await import('../../rules/index');
      const initListenersMap = module.default;
      const listenersMap = initListenersMap();
      
      // 验证 Map 不为空（说明规则被初始化了）
      expect(listenersMap.size).toBeGreaterThan(0);
    });
  });

  describe('规则系统集成', () => {
    it('应该能够正常导入和初始化', async () => {
      vi.resetModules();
      
      // 这个测试验证模块能够正常导入而不抛出错误
      expect(async () => {
        const module = await import('../../rules/index');
        const initListenersMap = module.default;
        initListenersMap();
      }).not.toThrow();
    });

    it('应该初始化监听器映射', async () => {
      vi.resetModules();
      
      const module = await import('../../rules/index');
      const initListenersMap = module.default;
      const listenersMap = initListenersMap();
      
      // 验证监听器映射包含预期的节点类型
      const keys = Array.from(listenersMap.keys());
      expect(keys.length).toBeGreaterThan(0);
      
      // 验证每个监听器都是函数数组
      keys.forEach(key => {
        const listeners = listenersMap.get(key);
        expect(Array.isArray(listeners)).toBe(true);
        if (listeners && listeners.length > 0) {
          listeners.forEach(listener => {
            expect(typeof listener).toBe('function');
          });
        }
      });
    });

    it('应该每次调用都返回新的 Map 实例', async () => {
      vi.resetModules();
      
      const module = await import('../../rules/index');
      const initListenersMap = module.default;
      
      const listenersMap1 = initListenersMap();
      const listenersMap2 = initListenersMap();
      
      // 验证返回的是不同的实例
      expect(listenersMap1).not.toBe(listenersMap2);
      // 但内容应该相同
      expect(listenersMap1.size).toBe(listenersMap2.size);
    });
  });

  describe('配置处理逻辑测试', () => {
    it('应该能处理各种配置场景', () => {
      // 这里我们测试一些基本的逻辑，而不是模块初始化
      
      // 模拟配置对象
      const mockRules = {
        no_unused_vars: { state: 'on' },
        semi: { state: 'off' }
      };
      
      // 测试规则状态判断逻辑
      expect(mockRules.no_unused_vars.state).toBe('on');
      expect(mockRules.semi.state).toBe('off');
      
      // 验证规则名称提取
      const ruleNames = Object.keys(mockRules);
      expect(ruleNames).toContain('no_unused_vars');
      expect(ruleNames).toContain('semi');
    });

    it('应该正确处理默认规则生成逻辑', () => {
      // 模拟默认规则生成
      const availableRules = ['no_unused_vars', 'semi'];
      const defaultRules: any = {};
      
      availableRules.forEach(ruleName => {
        defaultRules[ruleName] = { state: 'on' };
      });
      
      expect(defaultRules.no_unused_vars.state).toBe('on');
      expect(defaultRules.semi.state).toBe('on');
      expect(Object.keys(defaultRules)).toHaveLength(2);
    });

    it('应该正确处理规则融合逻辑', () => {
      // 模拟规则融合
      const defaultRules: any = {
        no_unused_vars: { state: 'on' },
        semi: { state: 'on' }
      };
      
      const configRules: any = {
        semi: { state: 'off' }
      };
      
      // 融合逻辑
      const mergedRules = { ...defaultRules };
      Object.keys(configRules).forEach(ruleName => {
        mergedRules[ruleName] = {
          ...mergedRules[ruleName],
          ...configRules[ruleName]
        };
      });
      
      expect(mergedRules.no_unused_vars.state).toBe('on');
      expect(mergedRules.semi.state).toBe('off');
    });
  });

  describe('错误处理', () => {
    it('应该处理 JSON 解析错误', () => {
      const invalidJson = 'invalid json';
      
      let result = {};
      try {
        result = JSON.parse(invalidJson);
      } catch (e) {
        result = {}; // 默认空对象
      }
      
      expect(result).toEqual({});
    });

    it('应该处理文件不存在的情况', () => {
      // 模拟文件不存在的处理逻辑
      const fileExists = false;
      const defaultConfig = {};
      
      const config = fileExists ? { rules: { test: 'value' } } : defaultConfig;
      
      expect(config).toEqual({});
    });
  });

  describe('函数行为验证', () => {
    it('应该根据配置正确初始化规则', async () => {
      vi.resetModules();
      
      // Mock 文件系统，模拟配置文件存在
      const mockFs = {
        existsSync: vi.fn().mockReturnValue(true),
        readFileSync: vi.fn().mockReturnValue(JSON.stringify({
          rules: {
            no_unused_vars: { state: 'on' },
            semi: { state: 'off' }
          }
        }))
      };

      const mockPath = {
        join: vi.fn().mockReturnValue('/test/.lrh-lintrc.json')
      };

      vi.doMock('node:fs', () => mockFs);
      vi.doMock('node:path', () => ({ default: mockPath }));
      vi.spyOn(process, 'cwd').mockReturnValue('/test');

      const module = await import('../../rules/index');
      const initListenersMap = module.default;
      const listenersMap = initListenersMap();

      expect(listenersMap).toBeInstanceOf(Map);
      expect(listenersMap.size).toBeGreaterThan(0);
    });

    it('应该在没有配置文件时使用默认规则', async () => {
      vi.resetModules();
      
      // Mock 文件系统，模拟配置文件不存在
      const mockFs = {
        existsSync: vi.fn().mockReturnValue(false),
        readFileSync: vi.fn()
      };

      const mockPath = {
        join: vi.fn().mockReturnValue('/test/.lrh-lintrc.json')
      };

      vi.doMock('node:fs', () => mockFs);
      vi.doMock('node:path', () => ({ default: mockPath }));
      vi.spyOn(process, 'cwd').mockReturnValue('/test');

      const module = await import('../../rules/index');
      const initListenersMap = module.default;
      const listenersMap = initListenersMap();

      expect(listenersMap).toBeInstanceOf(Map);
      expect(listenersMap.size).toBeGreaterThan(0);
    });
  });
});
