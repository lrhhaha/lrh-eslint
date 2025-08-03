import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as nodePath from 'node:path';
import * as espree from 'espree';
import * as estraverse from 'estraverse';

// Mock 依赖
vi.mock('node:fs');
vi.mock('node:path');
vi.mock('espree');
vi.mock('estraverse');

// Mock initListenersMap 函数
vi.mock('../rules', () => ({
  default: vi.fn()
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    red: vi.fn((text) => text)
  },
  red: vi.fn((text) => text)
}));

describe('linter', () => {
  let mockInitListenersMap: any;
  let linterModule: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules(); // 重置模块以清除 errorFlag 状态
    
    // Mock process.exit
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    // Mock console.log
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // 获取 mock 函数并设置默认返回值
    const rulesModule = await import('../rules');
    mockInitListenersMap = vi.mocked(rulesModule.default);
    mockInitListenersMap.mockReturnValue(new Map());
    
    // 动态导入 linter 模块以获取新的实例
    linterModule = await import('../linter');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCode', () => {
    it('应该成功读取文件内容', () => {
      const mockContent = 'const a = 1;';
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const result = linterModule.getCode('test.js');
      
      expect(fs.readFileSync).toHaveBeenCalledWith('test.js', 'utf8');
      expect(result).toBe(mockContent);
    });

    it('应该处理文件读取错误', () => {
      const mockError = new Error('File not found');
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw mockError;
      });

      const result = linterModule.getCode('nonexistent.js');
      
      expect(console.error).toHaveBeenCalledWith('读取文件失败:', mockError);
      expect(result).toBeUndefined();
    });
  });

  describe('getAST', () => {
    it('应该正确解析代码生成AST', () => {
      const mockCode = 'const a = 1;';
      const mockAST = { type: 'Program', body: [] };
      vi.mocked(espree.parse).mockReturnValue(mockAST as any);

      const result = linterModule.getAST(mockCode);
      
      expect(espree.parse).toHaveBeenCalledWith(mockCode, {
        ecmaVersion: 2022,
        tokens: true,
        loc: true,
      });
      expect(result).toBe(mockAST);
    });

    it('应该处理AST解析错误', () => {
      const mockCode = 'invalid syntax {';
      const mockError = new Error('Unexpected token');
      vi.mocked(espree.parse).mockImplementation(() => {
        throw mockError;
      });

      expect(() => linterModule.getAST(mockCode)).toThrow('Unexpected token');
    });
  });

  describe('traverseAST', () => {
    it('应该正确调用estraverse.traverse', () => {
      const mockListenersMap = new Map();
      const mockAST = { type: 'Program', body: [] };
      const mockFilePath = 'test.js';

      vi.mocked(estraverse.traverse).mockImplementation(() => {});

      linterModule.traverseAST(mockListenersMap, mockAST as any, mockFilePath);
      
      expect(estraverse.traverse).toHaveBeenCalledWith(mockAST, expect.any(Object));
    });

    it('应该正确处理监听器映射', () => {
      const mockListenersMap = new Map();
      mockListenersMap.set('all', [vi.fn()]);
      mockListenersMap.set('VariableDeclarator', [vi.fn()]);
      // Mock report 函数返回正确的格式
      mockListenersMap.set('report', [vi.fn().mockReturnValue([{ message: 'test error' }])]);
      
      const mockAST = { type: 'Program', body: [] };
      const mockFilePath = 'test.js';

      // Mock estraverse.traverse 来模拟节点访问
      vi.mocked(estraverse.traverse).mockImplementation((ast, visitor) => {
        // 模拟 enter 阶段
        if (visitor.enter) {
          (visitor.enter as any)({ type: 'VariableDeclarator' }, null);
        }
        // 模拟 leave 阶段
        if (visitor.leave) {
          (visitor.leave as any)({ type: 'Program' }, null);
        }
      });

      linterModule.traverseAST(mockListenersMap, mockAST as any, mockFilePath);
      
      expect(estraverse.traverse).toHaveBeenCalled();
    });
  });

  describe('worker', () => {
    it('应该处理单个文件', () => {
      const mockPath = 'test.js';
      const mockCode = 'const a = 1;';
      const mockAST = { type: 'Program', body: [] };
      const mockListenersMap = new Map();
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockCode);
      vi.mocked(espree.parse).mockReturnValue(mockAST as any);
      vi.mocked(estraverse.traverse).mockImplementation(() => {});
      mockInitListenersMap.mockReturnValue(mockListenersMap);

      linterModule.worker(mockPath);
      
      expect(fs.readFileSync).toHaveBeenCalledWith(mockPath, 'utf8');
      expect(espree.parse).toHaveBeenCalledWith(mockCode, {
        ecmaVersion: 2022,
        tokens: true,
        loc: true,
      });
      expect(mockInitListenersMap).toHaveBeenCalled();
      expect(estraverse.traverse).toHaveBeenCalled();
    });

    it('应该处理文件读取失败的情况', () => {
      const mockPath = 'nonexistent.js';
      
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      linterModule.worker(mockPath);
      
      expect(console.error).toHaveBeenCalledWith('读取文件失败:', expect.any(Error));
    });

    it('应该处理AST解析失败的情况', () => {
      const mockPath = 'test.js';
      const mockCode = 'invalid syntax {';
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockCode);
      vi.mocked(espree.parse).mockImplementation(() => {
        throw new Error('Unexpected token');
      });

      expect(() => linterModule.worker(mockPath)).toThrow('Unexpected token');
    });
  });

  describe('run', () => {
    it('应该处理指定路径的文件且无错误时退出码为0', () => {
      const mockPath = 'test.js';
      const mockCode = 'const a = 1;';
      const mockAST = { type: 'Program', body: [] };
      // 创建一个不会触发错误的 listenersMap
      const mockListenersMap = new Map();
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockCode);
      vi.mocked(espree.parse).mockReturnValue(mockAST as any);
      vi.mocked(estraverse.traverse).mockImplementation(() => {});
      mockInitListenersMap.mockReturnValue(mockListenersMap);

      linterModule.run({ path: mockPath });
      
      expect(fs.readFileSync).toHaveBeenCalledWith(mockPath, 'utf8');
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('应该处理指定路径的文件且有错误时退出码为1', () => {
      const mockPath = 'test.js';
      const mockCode = 'const a = 1;';
      const mockAST = { type: 'Program', body: [] };
      // 创建一个会触发错误的 listenersMap
      const mockListenersMap = new Map();
      mockListenersMap.set('report', [vi.fn().mockReturnValue([{ message: 'test error' }])]);
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockCode);
      vi.mocked(espree.parse).mockReturnValue(mockAST as any);
      vi.mocked(estraverse.traverse).mockImplementation((ast, visitor) => {
        // 模拟 leave 阶段触发 report
        if (visitor.leave) {
          (visitor.leave as any)({ type: 'Program' }, null);
        }
      });
      mockInitListenersMap.mockReturnValue(mockListenersMap);

      linterModule.run({ path: mockPath });
      
      expect(fs.readFileSync).toHaveBeenCalledWith(mockPath, 'utf8');
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('应该在没有参数时正常退出', () => {
      linterModule.run({});
      
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('应该处理参数优先级：path优先于isGlobal', () => {
      const mockPath = 'test.js';
      const mockCode = 'const a = 1;';
      const mockAST = { type: 'Program', body: [] };
      const mockListenersMap = new Map();
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockCode);
      vi.mocked(espree.parse).mockReturnValue(mockAST as any);
      vi.mocked(estraverse.traverse).mockImplementation(() => {});
      mockInitListenersMap.mockReturnValue(mockListenersMap);

      linterModule.run({ path: mockPath, isGlobal: true });
      
      expect(fs.readFileSync).toHaveBeenCalledWith(mockPath, 'utf8');
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });
});
