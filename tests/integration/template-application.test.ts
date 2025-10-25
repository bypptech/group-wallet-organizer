import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { createTempDir, cleanupTempDir, fileExists, readFile } from '../setup';

// Import template manager functions directly
const templateManagerPath = path.join(__dirname, '../../scripts/template-manager.js');

describe('Template Application Integration Tests', () => {
  let tempDir: string;
  let projectDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
    projectDir = path.join(tempDir, 'test-project');
    
    // Create basic project structure
    const dirs = [
      'contracts', 'test', 'scripts', 'docs/templates',
      '.claude/commands', '.gemini/prompts', '.kairo/rules'
    ];
    
    dirs.forEach(dir => {
      fs.mkdirSync(path.join(projectDir, dir), { recursive: true });
    });

    // Create basic AI config files
    fs.writeFileSync(
      path.join(projectDir, '.claude/commands/project-config.md'),
      '# Claude Configuration\n## Base Commands\n'
    );
    
    fs.writeFileSync(
      path.join(projectDir, '.gemini/prompts/project-config.md'),
      '# Gemini Configuration\n## Base Prompts\n'
    );
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('DeFi Template Application', () => {
    test('should generate all DeFi contracts correctly', async () => {
      // Apply DeFi template using Node.js import
      const { applyTemplate } = await import(templateManagerPath);
      
      await applyTemplate(projectDir, 'defi');

      // Verify all contracts are created
      const expectedContracts = [
        'Token.sol',
        'LiquidityPool.sol', 
        'Staking.sol',
        'Governance.sol'
      ];

      expectedContracts.forEach(contract => {
        const contractPath = path.join(projectDir, 'contracts', contract);
        expect(fileExists(contractPath)).toBe(true);
        
        const content = readFile(contractPath);
        expect(content).toContain('// SPDX-License-Identifier: MIT');
        expect(content).toContain('pragma solidity ^0.8.19');
        
        // Verify contract-specific content
        if (contract === 'Token.sol') {
          expect(content).toContain('contract Token is ERC20');
          expect(content).toContain('MAX_SUPPLY');
        } else if (contract === 'LiquidityPool.sol') {
          expect(content).toContain('contract LiquidityPool');
          expect(content).toContain('addLiquidity');
          expect(content).toContain('swap');
        } else if (contract === 'Staking.sol') {
          expect(content).toContain('contract Staking');
          expect(content).toContain('stake');
          expect(content).toContain('earned');
        } else if (contract === 'Governance.sol') {
          expect(content).toContain('contract Governance');
          expect(content).toContain('propose');
          expect(content).toContain('vote');
        }
      });
    });

    test('should generate all DeFi test files correctly', async () => {
      const { applyTemplate } = await import(templateManagerPath);
      
      await applyTemplate(projectDir, 'defi');

      const expectedTests = [
        'Token.test.js',
        'LiquidityPool.test.js',
        'Staking.test.js', 
        'Governance.test.js'
      ];

      expectedTests.forEach(testFile => {
        const testPath = path.join(projectDir, 'test', testFile);
        expect(fileExists(testPath)).toBe(true);
        
        const content = readFile(testPath);
        expect(content).toContain('describe(');
        expect(content).toContain('expect(');
        expect(content).toContain('beforeEach(');
        expect(content).toContain('ethers.getSigners()');
      });
    });

    test('should update AI configurations with DeFi-specific prompts', async () => {
      const { applyTemplate } = await import(templateManagerPath);
      
      await applyTemplate(projectDir, 'defi');

      // Check Claude configuration
      const claudeConfig = readFile(path.join(projectDir, '.claude/commands/project-config.md'));
      expect(claudeConfig).toContain('DeFi Protocol Specific Commands');
      expect(claudeConfig).toContain('@tdd-defi-token');
      expect(claudeConfig).toContain('@tdd-defi-pool');
      expect(claudeConfig).toContain('@kairo-defi-tokenomics');

      // Check Gemini configuration  
      const geminiConfig = readFile(path.join(projectDir, '.gemini/prompts/project-config.md'));
      expect(geminiConfig).toContain('DeFi Protocol Specific Prompts');
      expect(geminiConfig).toContain('@kairo-defi-liquidity');
      expect(geminiConfig).toContain('@kairo-defi-risk');
    });
  });

  describe('NFT Template Application', () => {
    test('should generate all NFT contracts correctly', async () => {
      const { applyTemplate } = await import(templateManagerPath);
      
      await applyTemplate(projectDir, 'nft');

      const expectedContracts = [
        'NFTCollection.sol',
        'Marketplace.sol',
        'RoyaltyManager.sol',
        'NFTStaking.sol'
      ];

      expectedContracts.forEach(contract => {
        const contractPath = path.join(projectDir, 'contracts', contract);
        expect(fileExists(contractPath)).toBe(true);
        
        const content = readFile(contractPath);
        expect(content).toContain('// SPDX-License-Identifier: MIT');
        
        if (contract === 'NFTCollection.sol') {
          expect(content).toContain('contract NFTCollection is ERC721');
          expect(content).toContain('IERC2981');
          expect(content).toContain('royaltyInfo');
        } else if (contract === 'Marketplace.sol') {
          expect(content).toContain('contract Marketplace');
          expect(content).toContain('listItem');
          expect(content).toContain('buyItem');
        } else if (contract === 'RoyaltyManager.sol') {
          expect(content).toContain('contract RoyaltyManager');
          expect(content).toContain('setContractRoyalty');
        } else if (contract === 'NFTStaking.sol') {
          expect(content).toContain('contract NFTStaking');
          expect(content).toContain('stake');
          expect(content).toContain('calculateReward');
        }
      });
    });

    test('should generate all NFT test files correctly', async () => {
      const { applyTemplate } = await import(templateManagerPath);
      
      await applyTemplate(projectDir, 'nft');

      const expectedTests = [
        'NFTCollection.test.js',
        'Marketplace.test.js',
        'RoyaltyManager.test.js',
        'NFTStaking.test.js'
      ];

      expectedTests.forEach(testFile => {
        const testPath = path.join(projectDir, 'test', testFile);
        expect(fileExists(testPath)).toBe(true);
        
        const content = readFile(testPath);
        expect(content).toContain('describe(');
        expect(content).toMatch(/NFT|Marketplace|Royalty|Staking/);
      });
    });
  });

  describe('DAO Template Application', () => {
    test('should generate all DAO contracts correctly', async () => {
      const { applyTemplate } = await import(templateManagerPath);
      
      await applyTemplate(projectDir, 'dao');

      const expectedContracts = [
        'GovernanceToken.sol',
        'Governor.sol',
        'TimelockController.sol',
        'Treasury.sol'
      ];

      expectedContracts.forEach(contract => {
        const contractPath = path.join(projectDir, 'contracts', contract);
        expect(fileExists(contractPath)).toBe(true);
        
        const content = readFile(contractPath);
        expect(content).toContain('// SPDX-License-Identifier: MIT');
        
        if (contract === 'GovernanceToken.sol') {
          expect(content).toContain('contract GovernanceToken is ERC20, ERC20Votes');
          expect(content).toContain('ERC20Permit');
        } else if (contract === 'Governor.sol') {
          expect(content).toContain('contract Governor');
          expect(content).toContain('GovernorSettings');
          expect(content).toContain('GovernorVotes');
        } else if (contract === 'Treasury.sol') {
          expect(content).toContain('contract Treasury');
          expect(content).toContain('createProposal');
          expect(content).toContain('executeProposal');
        }
      });
    });

    test('should update AI configurations with DAO-specific prompts', async () => {
      const { applyTemplate } = await import(templateManagerPath);
      
      await applyTemplate(projectDir, 'dao');

      const claudeConfig = readFile(path.join(projectDir, '.claude/commands/project-config.md'));
      expect(claudeConfig).toContain('DAO Governance Specific Commands');
      expect(claudeConfig).toContain('@tdd-dao-governance');
      expect(claudeConfig).toContain('@kairo-dao-structure');
    });
  });

  describe('Gaming Template Application', () => {
    test('should generate all Gaming contracts correctly', async () => {
      const { applyTemplate } = await import(templateManagerPath);
      
      await applyTemplate(projectDir, 'gaming');

      const expectedContracts = [
        'GameToken.sol',
        'GameItems.sol',
        'PlayerRegistry.sol',
        'GameLogic.sol'
      ];

      expectedContracts.forEach(contract => {
        const contractPath = path.join(projectDir, 'contracts', contract);
        expect(fileExists(contractPath)).toBe(true);
        
        const content = readFile(contractPath);
        expect(content).toContain('// SPDX-License-Identifier: MIT');
        
        if (contract === 'GameToken.sol') {
          expect(content).toContain('contract GameToken is ERC20');
          expect(content).toContain('mintReward');
          expect(content).toContain('DAILY_MINT_LIMIT');
        } else if (contract === 'GameItems.sol') {
          expect(content).toContain('contract GameItems is ERC721');
          expect(content).toContain('ItemType');
          expect(content).toContain('mintItem');
        } else if (contract === 'PlayerRegistry.sol') {
          expect(content).toContain('contract PlayerRegistry');
          expect(content).toContain('registerPlayer');
          expect(content).toContain('addExperience');
        } else if (contract === 'GameLogic.sol') {
          expect(content).toContain('contract GameLogic');
          expect(content).toContain('createGame');
          expect(content).toContain('claimReward');
        }
      });
    });

    test('should generate all Gaming test files correctly', async () => {
      const { applyTemplate } = await import(templateManagerPath);
      
      await applyTemplate(projectDir, 'gaming');

      const expectedTests = [
        'GameToken.test.js',
        'GameItems.test.js',
        'PlayerRegistry.test.js',
        'GameLogic.test.js'
      ];

      expectedTests.forEach(testFile => {
        const testPath = path.join(projectDir, 'test', testFile);
        expect(fileExists(testPath)).toBe(true);
      });
    });
  });

  describe('Custom Template Application', () => {
    test('should generate custom base contract correctly', async () => {
      const { applyTemplate } = await import(templateManagerPath);
      
      await applyTemplate(projectDir, 'custom');

      const contractPath = path.join(projectDir, 'contracts', 'BaseContract.sol');
      expect(fileExists(contractPath)).toBe(true);
      
      const content = readFile(contractPath);
      expect(content).toContain('contract BaseContract is Ownable, ReentrancyGuard');
      expect(content).toContain('setValue');
      expect(content).toContain('updateBalance');
      expect(content).toContain('withdraw');
    });
  });

  describe('Template Validation and Consistency', () => {
    test('should ensure all templates have correct file counts', async () => {
      const { TEMPLATES } = await import(templateManagerPath);
      
      // Verify each template has the expected number of contracts
      expect(TEMPLATES.defi.contracts).toHaveLength(4);
      expect(TEMPLATES.nft.contracts).toHaveLength(4);
      expect(TEMPLATES.dao.contracts).toHaveLength(4);
      expect(TEMPLATES.gaming.contracts).toHaveLength(4);
      expect(TEMPLATES.custom.contracts).toHaveLength(1);
      
      // Verify test files match contract count
      expect(TEMPLATES.defi.testFiles).toHaveLength(4);
      expect(TEMPLATES.nft.testFiles).toHaveLength(4);
      expect(TEMPLATES.dao.testFiles).toHaveLength(4);
      expect(TEMPLATES.gaming.testFiles).toHaveLength(4);
      expect(TEMPLATES.custom.testFiles).toHaveLength(1);
    });

    test('should ensure all templates have AI prompt configurations', async () => {
      const { TEMPLATES } = await import(templateManagerPath);
      
      Object.keys(TEMPLATES).forEach(templateType => {
        const template = TEMPLATES[templateType];
        expect(template.aiPrompts).toBeDefined();
        expect(template.aiPrompts.claude).toBeDefined();
        expect(template.aiPrompts.gemini).toBeDefined();
        expect(Array.isArray(template.aiPrompts.claude)).toBe(true);
        expect(Array.isArray(template.aiPrompts.gemini)).toBe(true);
        expect(template.aiPrompts.claude.length).toBeGreaterThan(0);
        expect(template.aiPrompts.gemini.length).toBeGreaterThan(0);
      });
    });

    test('should validate contract generation for all supported contracts', async () => {
      const { generateContractTemplate, TEMPLATES } = await import(templateManagerPath);
      
      Object.keys(TEMPLATES).forEach(templateType => {
        const template = TEMPLATES[templateType];
        
        template.contracts.forEach((contractName: string) => {
          const contractContent = generateContractTemplate(templateType, contractName);
          
          // Basic validation
          expect(contractContent).toContain('// SPDX-License-Identifier: MIT');
          expect(contractContent).toContain('pragma solidity ^0.8.19');
          expect(contractContent).toContain(`contract ${contractName.replace('.sol', '')}`);
          
          // Ensure no TODO placeholders in main logic
          expect(contractContent).not.toContain('// TODO: Implement');
          
          // Check for proper imports
          expect(contractContent).toContain('@openzeppelin/contracts');
        });
      });
    });

    test('should validate test generation consistency', async () => {
      const { generateTestTemplate, TEMPLATES } = await import(templateManagerPath);
      
      Object.keys(TEMPLATES).forEach(templateType => {
        const template = TEMPLATES[templateType];
        
        template.testFiles.forEach((testFile: string) => {
          const testContent = generateTestTemplate(templateType, testFile);
          
          // Basic test structure validation
          expect(testContent).toContain('describe(');
          expect(testContent).toContain('beforeEach(');
          expect(testContent).toContain('expect(');
          expect(testContent).toContain('ethers.getSigners()');
          expect(testContent).toContain('deployed()');
          
          // Verify test has proper contract reference
          const contractName = testFile.replace('.test.js', '');
          expect(testContent).toContain(contractName);
        });
      });
    });

    test('should prevent template drift by validating expected structure', async () => {
      const { TEMPLATES, listAvailableTemplates } = await import(templateManagerPath);
      
      // Capture current template list
      let output = '';
      const originalLog = console.log;
      console.log = (str: string) => { output += str + '\n'; };
      
      listAvailableTemplates();
      console.log = originalLog;
      
      // Verify all expected templates are listed
      expect(output).toContain('DeFi Protocol');
      expect(output).toContain('NFT Collection');
      expect(output).toContain('DAO Governance');
      expect(output).toContain('GameFi/Web3 Gaming');
      expect(output).toContain('Custom Project');
      
      // Verify template structure hasn't changed unexpectedly
      const expectedTemplateKeys = ['defi', 'nft', 'dao', 'gaming', 'custom'];
      expect(Object.keys(TEMPLATES)).toEqual(expect.arrayContaining(expectedTemplateKeys));
      expect(Object.keys(TEMPLATES)).toHaveLength(expectedTemplateKeys.length);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid template type gracefully', async () => {
      const { applyTemplate } = await import(templateManagerPath);
      
      await expect(applyTemplate(projectDir, 'invalid-template')).rejects.toThrow('Template invalid-template not found');
    });

    test('should handle missing project directories gracefully', async () => {
      const { applyTemplate } = await import(templateManagerPath);
      const nonExistentDir = path.join(tempDir, 'non-existent');
      
      // Should create directories as needed
      await expect(applyTemplate(nonExistentDir, 'custom')).resolves.not.toThrow();
    });

    test('should validate AI configuration update edge cases', async () => {
      const { applyTemplate } = await import(templateManagerPath);
      
      // Remove AI config files to test handling of missing files
      fs.unlinkSync(path.join(projectDir, '.claude/commands/project-config.md'));
      fs.unlinkSync(path.join(projectDir, '.gemini/prompts/project-config.md'));
      
      // Should handle missing config files gracefully
      await expect(applyTemplate(projectDir, 'defi')).resolves.not.toThrow();
    });
  });
});