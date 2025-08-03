import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as nodePath from 'node:path';
import * as espree from 'espree';
import * as estraverse from 'estraverse';
import { run, worker, getCode, getAST, traverseAST } from '../linter';

// Mock 依赖
vi.mock('node:fs');
vi.mock('node:path');
vi.mock('espree');
vi.mock('estraverse');
vi.mock('../rules', () => ({
  default: new Map([
    ['all', [vi.fn()]],
    ['VariableDeclarator', [vi.fn()]],
    ['Identifier', [vi.fn()]],
    ['report', [vi.fn(() => [{ message: 'test error' }])]]
  ])
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    red: vi.fn((text) => text)
  },
  red: vi.fn((text) => text)
}));

describe('linter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock process.exit
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    // Mock console.log
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCode', () => {
    it('应该成功读取文件内容', () => {
      const mockContent = 'const a = 1;';
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const result = getCode('test.js');
      
      expect(fs.readFileSync).toHaveBeenCalledWith('test.js', 'utf8');
      expect(result).toBe(mockContent);
    });

    it('应该处理文件读取错误', () => {
      const mockError = new Error('File not found');
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw mockError;
      });

      const result = getCode('nonexistent.js');
      
      expect(console.error).toHaveBeenCalledWith('读取文件失败:', mockError);
      expect(result).toBeUndefined();
    });
  });

  describe('getAST', () => {
    it('应该正确解析代码生成AST', () => {
      const mockCode = 'const a = 1;';
      const mockAST = { type: 'Program', body: [] };
      vi.mocked(espree.parse).mockReturnValue(mockAST as any);

      const result = getAST(mockCode);
      
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

      expect(() => getAST(mockCode)).toThrow('Unexpected token');
    });
  });

  describe('traverseAST', () => {
    it('应该正确调用estraverse.traverse', () => {
      const mockAST = { type: 'Program', body: [] };
      const mockFilePath = 'test.js';

      vi.mocked(estraverse.traverse).mockImplementation(() => {});

      traverseAST(mockAST as any, mockFilePath);
      
      expect(estraverse.traverse).toHaveBeenCalledWith(mockAST, expect.any(Object));
    });
  });

  describe('worker', () => {
    it('应该处理单个文件', () => {
      const mockPath = 'test.js';
      const mockCode = 'const a = 1;';
      const mockAST = { type: 'Program', body: [] };
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockCode);
      vi.mocked(espree.parse).mockReturnValue(mockAST as any);
      vi.mocked(estraverse.traverse).mockImplementation(() => {});

      worker(mockPath);
      
      expect(fs.readFileSync).toHaveBeenCalledWith(mockPath, 'utf8');
      expect(espree.parse).toHaveBeenCalledWith(mockCode, {
        ecmaVersion: 2022,
        tokens: true,
        loc: true,
      });
      expect(estraverse.traverse).toHaveBeenCalled();
    });

    it('应该处理文件读取失败的情况', () => {
      const mockPath = 'nonexistent.js';
      
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      worker(mockPath);
      
      expect(console.error).toHaveBeenCalledWith('读取文件失败:', expect.any(Error));
    });

    it('应该处理AST解析失败的情况', () => {
      const mockPath = 'test.js';
      const mockCode = 'invalid syntax {';
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockCode);
      vi.mocked(espree.parse).mockImplementation(() => {
        throw new Error('Unexpected token');
      });

      expect(() => worker(mockPath)).toThrow('Unexpected token');
    });
  });

  describe('run', () => {
    it('应该处理指定路径的文件', () => {
      const mockPath = 'test.js';
      const mockCode = 'const a = 1;';
      const mockAST = { type: 'Program', body: [] };
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockCode);
      vi.mocked(espree.parse).mockReturnValue(mockAST as any);
      vi.mocked(estraverse.traverse).mockImplementation(() => {});

      run({ path: mockPath });
      
      expect(fs.readFileSync).toHaveBeenCalledWith(mockPath, 'utf8');
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('应该在没有参数时正常退出', () => {
      run({});
      
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('应该处理参数优先级：path优先于isGlobal', () => {
      const mockPath = 'test.js';
      const mockCode = 'const a = 1;';
      const mockAST = { type: 'Program', body: [] };
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockCode);
      vi.mocked(espree.parse).mockReturnValue(mockAST as any);
      vi.mocked(estraverse.traverse).mockImplementation(() => {});

      run({ path: mockPath, isGlobal: true });
      
      expect(fs.readFileSync).toHaveBeenCalledWith(mockPath, 'utf8');
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });
});
