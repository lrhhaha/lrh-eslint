import { describe, it, expect, vi, beforeEach } from 'vitest';
import semiRule from '../../rules/semi';

describe('rules/semi', () => {
  let ruleInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    ruleInstance = semiRule.create(null);
  });

  describe('规则元数据', () => {
    it('应该包含正确的元数据', () => {
      expect(semiRule.meta).toEqual({
        docs: "semi"
      });
    });
  });

  describe('分号检测', () => {
    it('应该检测缺少分号的语句', () => {
      // 模拟 Program 节点，包含 tokens
      const mockTokens = [
        {
          type: 'Identifier',
          value: 'console',
          end: 7,
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 7 } }
        },
        {
          type: 'Punctuator',
          value: '.',
          end: 8,
          loc: { start: { line: 1, column: 7 }, end: { line: 1, column: 8 } }
        },
        {
          type: 'Identifier',
          value: 'log',
          end: 11,
          loc: { start: { line: 1, column: 8 }, end: { line: 1, column: 11 } }
        },
        {
          type: 'Punctuator',
          value: '(',
          end: 12,
          loc: { start: { line: 1, column: 11 }, end: { line: 1, column: 12 } }
        },
        {
          type: 'String',
          value: '"hello"',
          end: 19,
          loc: { start: { line: 1, column: 12 }, end: { line: 1, column: 19 } }
        },
        {
          type: 'Punctuator',
          value: ')',
          end: 20,
          loc: { start: { line: 1, column: 19 }, end: { line: 1, column: 20 } }
        }
      ];

      const mockProgramNode = {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            end: 20 // 语句结束位置，对应最后一个 token
          }
        ],
        tokens: mockTokens
      };

      ruleInstance.all(mockProgramNode, null);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toContain('line:1 - column:20 => semi');
    });

    it('应该允许有分号的语句', () => {
      // 模拟 Program 节点，包含 tokens（有分号）
      const mockTokens = [
        {
          type: 'Identifier',
          value: 'console',
          end: 7,
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 7 } }
        },
        {
          type: 'Punctuator',
          value: '.',
          end: 8,
          loc: { start: { line: 1, column: 7 }, end: { line: 1, column: 8 } }
        },
        {
          type: 'Identifier',
          value: 'log',
          end: 11,
          loc: { start: { line: 1, column: 8 }, end: { line: 1, column: 11 } }
        },
        {
          type: 'Punctuator',
          value: '(',
          end: 12,
          loc: { start: { line: 1, column: 11 }, end: { line: 1, column: 12 } }
        },
        {
          type: 'String',
          value: '"hello"',
          end: 19,
          loc: { start: { line: 1, column: 12 }, end: { line: 1, column: 19 } }
        },
        {
          type: 'Punctuator',
          value: ')',
          end: 20,
          loc: { start: { line: 1, column: 19 }, end: { line: 1, column: 20 } }
        },
        {
          type: 'Punctuator',
          value: ';',
          end: 21,
          loc: { start: { line: 1, column: 20 }, end: { line: 1, column: 21 } }
        }
      ];

      const mockProgramNode = {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            end: 21 // 语句结束位置，对应分号 token
          }
        ],
        tokens: mockTokens
      };

      ruleInstance.all(mockProgramNode, null);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0); // 有分号，不应该报告
    });

    it('应该处理多个语句', () => {
      const mockTokens = [
        // 第一个语句（缺少分号）
        {
          type: 'Keyword',
          value: 'let',
          end: 3,
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 3 } }
        },
        {
          type: 'Identifier',
          value: 'a',
          end: 5,
          loc: { start: { line: 1, column: 4 }, end: { line: 1, column: 5 } }
        },
        {
          type: 'Punctuator',
          value: '=',
          end: 7,
          loc: { start: { line: 1, column: 6 }, end: { line: 1, column: 7 } }
        },
        {
          type: 'Numeric',
          value: '1',
          end: 9,
          loc: { start: { line: 1, column: 8 }, end: { line: 1, column: 9 } }
        },
        // 第二个语句（有分号）
        {
          type: 'Keyword',
          value: 'let',
          end: 14,
          loc: { start: { line: 2, column: 0 }, end: { line: 2, column: 3 } }
        },
        {
          type: 'Identifier',
          value: 'b',
          end: 16,
          loc: { start: { line: 2, column: 4 }, end: { line: 2, column: 5 } }
        },
        {
          type: 'Punctuator',
          value: '=',
          end: 18,
          loc: { start: { line: 2, column: 6 }, end: { line: 2, column: 7 } }
        },
        {
          type: 'Numeric',
          value: '2',
          end: 20,
          loc: { start: { line: 2, column: 8 }, end: { line: 2, column: 9 } }
        },
        {
          type: 'Punctuator',
          value: ';',
          end: 21,
          loc: { start: { line: 2, column: 9 }, end: { line: 2, column: 10 } }
        }
      ];

      const mockProgramNode = {
        type: 'Program',
        body: [
          {
            type: 'VariableDeclaration',
            end: 9 // 第一个语句结束位置（无分号）
          },
          {
            type: 'VariableDeclaration',
            end: 21 // 第二个语句结束位置（有分号）
          }
        ],
        tokens: mockTokens
      };

      ruleInstance.all(mockProgramNode, null);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(1); // 只有第一个语句缺少分号
      expect(reports[0].message).toContain('line:1 - column:9 => semi');
    });

    it('应该忽略非 Program 节点', () => {
      const mockNode = {
        type: 'FunctionDeclaration',
        body: []
      };

      ruleInstance.all(mockNode, null);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0);
    });

    it('应该忽略没有 body 的节点', () => {
      const mockNode = {
        type: 'Program'
        // 没有 body 属性
      };

      ruleInstance.all(mockNode, null);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0);
    });

    it('应该忽略 body 不是数组的节点', () => {
      const mockNode = {
        type: 'Program',
        body: 'not an array'
      };

      ruleInstance.all(mockNode, null);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0);
    });

    it('应该处理找不到对应 token 的情况', () => {
      const mockTokens = [
        {
          type: 'Identifier',
          value: 'test',
          end: 4,
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 4 } }
        }
      ];

      const mockProgramNode = {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            end: 999 // 找不到对应的 token
          }
        ],
        tokens: mockTokens
      };

      ruleInstance.all(mockProgramNode, null);
      
      expect(console.error).toHaveBeenCalledWith('can not find target token');
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0);
    });

    it('应该处理空 body 的情况', () => {
      const mockProgramNode = {
        type: 'Program',
        body: [],
        tokens: []
      };

      ruleInstance.all(mockProgramNode, null);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0);
    });
  });

  describe('tokens 处理', () => {
    it('应该正确设置 tokens', () => {
      const mockTokens = [
        {
          type: 'Identifier',
          value: 'test',
          end: 4,
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 4 } }
        }
      ];

      const mockProgramNode = {
        type: 'Program',
        body: [],
        tokens: mockTokens
      };

      ruleInstance.all(mockProgramNode, null);
      
      // tokens 应该被设置（这是内部状态，我们通过后续调用来验证）
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0);
    });

    it('应该处理非 Punctuator 类型的结束 token', () => {
      const mockTokens = [
        {
          type: 'Identifier', // 不是 Punctuator
          value: 'test',
          end: 4,
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 4 } }
        }
      ];

      const mockProgramNode = {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            end: 4
          }
        ],
        tokens: mockTokens
      };

      ruleInstance.all(mockProgramNode, null);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toContain('line:1 - column:4 => semi');
    });

    it('应该处理 Punctuator 但不是分号的 token', () => {
      const mockTokens = [
        {
          type: 'Punctuator',
          value: '}', // 不是分号
          end: 1,
          loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } }
        }
      ];

      const mockProgramNode = {
        type: 'Program',
        body: [
          {
            type: 'BlockStatement',
            end: 1
          }
        ],
        tokens: mockTokens
      };

      ruleInstance.all(mockProgramNode, null);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toContain('line:1 - column:1 => semi');
    });
  });

  describe('报告格式', () => {
    it('应该生成正确格式的报告', () => {
      const mockTokens = [
        {
          type: 'Identifier',
          value: 'test',
          end: 4,
          loc: { start: { line: 5, column: 10 }, end: { line: 5, column: 14 } }
        }
      ];

      const mockProgramNode = {
        type: 'Program',
        body: [
          {
            type: 'ExpressionStatement',
            end: 4
          }
        ],
        tokens: mockTokens
      };

      ruleInstance.all(mockProgramNode, null);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(1);
      expect(reports[0]).toEqual({
        message: 'line:5 - column:14 => semi'
      });
    });

    it('应该在没有问题时返回空报告', () => {
      const reports = ruleInstance.report();
      expect(reports).toEqual([]);
    });
  });
});
