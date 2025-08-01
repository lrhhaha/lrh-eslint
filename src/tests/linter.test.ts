import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as nodePath from 'node:path';
import * as espree from 'espree';
import * as estraverse from 'estraverse';
import { run, worker, getCode, getAST, getAllJsFile } from '../linter';

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
  });

  describe('getAllJsFile', () => {
    it('应该处理目录读取错误', () => {
      const mockError = new Error('Permission denied');
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        throw mockError;
      });

      const result = getAllJsFile('/test');
      
      expect(console.error).toHaveBeenCalledWith('读取目录时出错:', mockError);
      expect(result).toEqual([]);
    });

    it('应该正确识别JS文件', () => {
      const mockDirPath = '/test';
      const mockFiles = ['file1.js', 'file2.txt', 'file3.js'];
      
      vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any);
      vi.mocked(fs.statSync).mockImplementation((path: any) => {
        const pathStr = path.toString();
        if (pathStr.endsWith('.js')) {
          return { isFile: () => true, isDirectory: () => false } as any;
        } else {
          return { isFile: () => true, isDirectory: () => false } as any;
        }
      });
      vi.mocked(nodePath.join).mockImplementation((...args) => args.join('/'));

      const result = getAllJsFile(mockDirPath);
      
      expect(fs.readdirSync).toHaveBeenCalledWith(mockDirPath);
      expect(result).toContain('/test/file1.js');
      expect(result).toContain('/test/file3.js');
      expect(result).not.toContain('/test/file2.txt');
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

    it('应该处理全局模式', () => {
      const mockFiles = ['file1.js', 'file2.js'];
      const mockCode = 'const a = 1;';
      const mockAST = { type: 'Program', body: [] };
      
      vi.mocked(fs.readdirSync).mockReturnValue(['file1.js', 'file2.js'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);
      vi.mocked(nodePath.join).mockImplementation((...args) => args.join('/'));
      vi.mocked(fs.readFileSync).mockReturnValue(mockCode);
      vi.mocked(espree.parse).mockReturnValue(mockAST as any);
      vi.mocked(estraverse.traverse).mockImplementation(() => {});

      run({ isGlobal: true });
      
      expect(fs.readdirSync).toHaveBeenCalledWith(process.cwd());
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('应该在没有参数时正常退出', () => {
      run({});
      
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });
});
