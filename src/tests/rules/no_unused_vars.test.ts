import { describe, it, expect, vi, beforeEach } from 'vitest';
import noUnusedVarsRule from '../../rules/no_unused_vars';

describe('rules/no_unused_vars', () => {
  let ruleInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global object
    (global as any).console = { log: vi.fn() };
    (global as any).process = { exit: vi.fn() };
    
    ruleInstance = noUnusedVarsRule.create(null);
  });

  describe('规则元数据', () => {
    it('应该包含正确的元数据', () => {
      expect(noUnusedVarsRule.meta).toEqual({
        docs: "disallow unused variables"
      });
    });
  });

  describe('变量声明处理', () => {
    it('应该正确记录 let 声明的变量', () => {
      const mockNode = {
        type: 'VariableDeclarator',
        id: { name: 'testVar' },
        loc: { start: { line: 1, column: 0 } }
      };
      const mockParent = {
        type: 'VariableDeclaration',
        kind: 'let'
      };

      ruleInstance.VariableDeclarator(mockNode, mockParent);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toContain('unused var: testVar');
      expect(reports[0].message).toContain('line:1');
    });

    it('应该正确记录 const 声明的变量', () => {
      const mockNode = {
        type: 'VariableDeclarator',
        id: { name: 'CONSTANT' },
        loc: { start: { line: 2, column: 5 } }
      };
      const mockParent = {
        type: 'VariableDeclaration',
        kind: 'const'
      };

      ruleInstance.VariableDeclarator(mockNode, mockParent);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toContain('unused var: CONSTANT');
      expect(reports[0].message).toContain('line:2 - column:5');
    });

    it('应该正确记录 var 声明的变量', () => {
      const mockNode = {
        type: 'VariableDeclarator',
        id: { name: 'oldVar' },
        loc: { start: { line: 3, column: 10 } }
      };
      const mockParent = {
        type: 'VariableDeclaration',
        kind: 'var'
      };

      ruleInstance.VariableDeclarator(mockNode, mockParent);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toContain('unused var: oldVar');
    });

    it('应该忽略非 VariableDeclarator 类型的节点', () => {
      const mockNode = {
        type: 'FunctionDeclaration',
        id: { name: 'func' }
      };
      const mockParent = {
        type: 'Program'
      };

      ruleInstance.VariableDeclarator(mockNode, mockParent);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0);
    });
  });

  describe('变量使用检测', () => {
    it('应该检测到变量被直接使用', () => {
      // 先声明变量
      const declarationNode = {
        type: 'VariableDeclarator',
        id: { name: 'usedVar' },
        loc: { start: { line: 1, column: 0 } }
      };
      const declarationParent = {
        type: 'VariableDeclaration',
        kind: 'let'
      };
      ruleInstance.VariableDeclarator(declarationNode, declarationParent);

      // 使用变量
      const usageNode = {
        type: 'Identifier',
        name: 'usedVar'
      };
      const usageParent = {
        type: 'CallExpression'
      };

      ruleInstance.Identifier(usageNode, usageParent);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0); // 变量被使用，不应该报告
    });

    it('应该检测到变量作为对象使用（obj.prop）', () => {
      // 先声明变量
      const declarationNode = {
        type: 'VariableDeclarator',
        id: { name: 'obj' },
        loc: { start: { line: 1, column: 0 } }
      };
      const declarationParent = {
        type: 'VariableDeclaration',
        kind: 'let'
      };
      ruleInstance.VariableDeclarator(declarationNode, declarationParent);

      // 作为对象使用 obj.prop
      const usageNode = {
        type: 'Identifier',
        name: 'obj'
      };
      const usageParent = {
        type: 'MemberExpression',
        object: usageNode,
        computed: false
      };

      ruleInstance.Identifier(usageNode, usageParent);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0); // 变量被使用，不应该报告
    });

    it('应该检测到变量在计算属性中使用（obj[prop]）', () => {
      // 先声明变量
      const declarationNode = {
        type: 'VariableDeclarator',
        id: { name: 'prop' },
        loc: { start: { line: 1, column: 0 } }
      };
      const declarationParent = {
        type: 'VariableDeclaration',
        kind: 'let'
      };
      ruleInstance.VariableDeclarator(declarationNode, declarationParent);

      // 在计算属性中使用 obj[prop]
      const usageNode = {
        type: 'Identifier',
        name: 'prop'
      };
      const usageParent = {
        type: 'MemberExpression',
        property: usageNode,
        computed: true
      };

      ruleInstance.Identifier(usageNode, usageParent);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0); // 变量被使用，不应该报告
    });

    it('应该忽略对象属性名（obj.prop 中的 prop）', () => {
      // 先声明变量
      const declarationNode = {
        type: 'VariableDeclarator',
        id: { name: 'prop' },
        loc: { start: { line: 1, column: 0 } }
      };
      const declarationParent = {
        type: 'VariableDeclaration',
        kind: 'let'
      };
      ruleInstance.VariableDeclarator(declarationNode, declarationParent);

      // 作为属性名使用 obj.prop（非计算属性）
      const usageNode = {
        type: 'Identifier',
        name: 'prop'
      };
      const usageParent = {
        type: 'MemberExpression',
        property: usageNode,
        computed: false
      };

      ruleInstance.Identifier(usageNode, usageParent);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(1); // 应该报告未使用，因为这只是属性名
      expect(reports[0].message).toContain('unused var: prop');
    });

    it('应该忽略全局对象属性', () => {
      // console 是全局对象，不应该被报告
      const usageNode = {
        type: 'Identifier',
        name: 'console'
      };
      const usageParent = {
        type: 'MemberExpression',
        object: usageNode,
        computed: false
      };

      ruleInstance.Identifier(usageNode, usageParent);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0);
    });

    it('应该忽略在 VariableDeclarator 中的标识符', () => {
      const usageNode = {
        type: 'Identifier',
        name: 'testVar'
      };
      const usageParent = {
        type: 'VariableDeclarator'
      };

      ruleInstance.Identifier(usageNode, usageParent);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0);
    });

    it('应该忽略非 Identifier 类型的节点', () => {
      const usageNode = {
        type: 'Literal',
        value: 'string'
      };
      const usageParent = {
        type: 'CallExpression'
      };

      ruleInstance.Identifier(usageNode, usageParent);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0);
    });
  });

  describe('复合场景测试', () => {
    it('应该处理多个变量声明和使用', () => {
      // 声明三个变量
      const vars = ['used1', 'unused1', 'used2'];
      vars.forEach((varName, index) => {
        const declarationNode = {
          type: 'VariableDeclarator',
          id: { name: varName },
          loc: { start: { line: index + 1, column: 0 } }
        };
        const declarationParent = {
          type: 'VariableDeclaration',
          kind: 'let'
        };
        ruleInstance.VariableDeclarator(declarationNode, declarationParent);
      });

      // 使用其中两个变量
      ['used1', 'used2'].forEach(varName => {
        const usageNode = {
          type: 'Identifier',
          name: varName
        };
        const usageParent = {
          type: 'CallExpression'
        };
        ruleInstance.Identifier(usageNode, usageParent);
      });
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(1);
      expect(reports[0].message).toContain('unused var: unused1');
    });

    it('应该处理变量重复使用', () => {
      // 声明变量
      const declarationNode = {
        type: 'VariableDeclarator',
        id: { name: 'multiUsed' },
        loc: { start: { line: 1, column: 0 } }
      };
      const declarationParent = {
        type: 'VariableDeclaration',
        kind: 'let'
      };
      ruleInstance.VariableDeclarator(declarationNode, declarationParent);

      // 多次使用同一个变量
      for (let i = 0; i < 3; i++) {
        const usageNode = {
          type: 'Identifier',
          name: 'multiUsed'
        };
        const usageParent = {
          type: 'CallExpression'
        };
        ruleInstance.Identifier(usageNode, usageParent);
      }
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(0); // 变量被使用，不应该报告
    });
  });

  describe('报告格式', () => {
    it('应该生成正确格式的报告', () => {
      const declarationNode = {
        type: 'VariableDeclarator',
        id: { name: 'testVar' },
        loc: { start: { line: 5, column: 12 } }
      };
      const declarationParent = {
        type: 'VariableDeclaration',
        kind: 'const'
      };

      ruleInstance.VariableDeclarator(declarationNode, declarationParent);
      
      const reports = ruleInstance.report();
      expect(reports).toHaveLength(1);
      expect(reports[0]).toEqual({
        message: 'line:5 - column:12 => unused var: testVar'
      });
    });

    it('应该在没有未使用变量时返回空报告', () => {
      const reports = ruleInstance.report();
      expect(reports).toEqual([]);
    });
  });
});
