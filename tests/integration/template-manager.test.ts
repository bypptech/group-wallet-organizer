import * as path from 'path';
import * as fs from 'fs';
import { createTempDir, cleanupTempDir, fileExists, readFile } from '../setup';

describe('Template Manager Integration Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  test('should validate template manager script exists and is readable', () => {
    const templateManagerPath = path.join(__dirname, '../../scripts/template-manager.js');
    expect(fileExists(templateManagerPath)).toBe(true);
    
    // Verify the script is readable
    const stats = fs.statSync(templateManagerPath);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('should validate template manager script content', () => {
    const templateManagerPath = path.join(__dirname, '../../scripts/template-manager.js');
    const scriptContent = readFile(templateManagerPath);
    
    // Verify the script contains template definitions
    expect(scriptContent).toContain('TEMPLATES');
    expect(scriptContent).toContain('defi');
    expect(scriptContent).toContain('nft');
    expect(scriptContent).toContain('dao');
    expect(scriptContent).toContain('gaming');
    expect(scriptContent).toContain('custom');
    
    // Verify key functions exist
    expect(scriptContent).toContain('applyTemplate');
    expect(scriptContent).toContain('generateContractTemplate');
    expect(scriptContent).toContain('generateTestTemplate');
    
    // Verify DeFi template structure
    expect(scriptContent).toContain('DeFi Protocol');
    expect(scriptContent).toContain('Token.sol');
    expect(scriptContent).toContain('LiquidityPool.sol');
    expect(scriptContent).toContain('Staking.sol');
    expect(scriptContent).toContain('Governance.sol');
    
    // Verify AI prompt definitions
    expect(scriptContent).toContain('@tdd-defi-token');
    expect(scriptContent).toContain('@kairo-defi-tokenomics');
  });

  test('should have template documentation files', () => {
    const templateDocsDir = path.join(__dirname, '../../docs/templates');
    
    expect(fileExists(path.join(templateDocsDir, 'defi-template.md'))).toBe(true);
    expect(fileExists(path.join(templateDocsDir, 'nft-template.md'))).toBe(true);
    expect(fileExists(path.join(templateDocsDir, 'dao-template.md'))).toBe(true);
    expect(fileExists(path.join(templateDocsDir, 'gaming-template.md'))).toBe(true);
    
    // Verify template content structure
    const defiTemplate = readFile(path.join(templateDocsDir, 'defi-template.md'));
    expect(defiTemplate).toContain('# DeFi Protocol Template');
    expect(defiTemplate).toContain('Smart Contract Structure');
    expect(defiTemplate).toContain('AI Configuration');
    expect(defiTemplate).toContain('Security Checklist');
    
    const nftTemplate = readFile(path.join(templateDocsDir, 'nft-template.md'));
    expect(nftTemplate).toContain('# NFT Project Template');
    expect(nftTemplate).toContain('ERC721');
    expect(nftTemplate).toContain('Royalty');
    expect(nftTemplate).toContain('Marketplace');
  });

  test('should validate template integration in project setup', () => {
    const projectSetupPath = path.join(__dirname, '../../scripts/project-setup.js');
    const setupContent = readFile(projectSetupPath);
    
    // Verify template manager is imported
    expect(setupContent).toContain('applyTemplate');
    expect(setupContent).toContain('./template-manager.js');
    
    // Verify template application is called during project creation
    expect(setupContent).toContain('applyTemplate(projectPath, projectType)');
  });
});