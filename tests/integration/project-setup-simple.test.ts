import * as path from 'path';
import * as fs from 'fs';
import { execAsync, createTempDir, cleanupTempDir, fileExists, readFile } from '../setup';

describe('project-setup.js Basic Integration Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  test('should start CLI tool properly', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/project-setup.js');
    
    // Test that the CLI script can start and shows initial prompt
    const { stdout } = await execAsync(`timeout 2 node ${scriptPath} || true`);
    
    expect(stdout).toContain('Tsumiki × VibeKit Interactive Project Setup');
    expect(stdout).toContain('Create a new Web3 AI TDD project');
    expect(stdout).toContain('Enter project name');
  });

  test('should be executable', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/project-setup.js');
    
    // Verify the script file exists and is executable
    expect(fileExists(scriptPath)).toBe(true);
    
    const stats = fs.statSync(scriptPath);
    expect(stats.mode & parseInt('111', 8)).toBeGreaterThan(0); // Check execute permissions
  });

  test('should validate CLI script structure', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/project-setup.js');
    const scriptContent = readFile(scriptPath);
    
    // Verify the script contains the necessary project type configurations
    expect(scriptContent).toContain('DeFi Protocol');
    expect(scriptContent).toContain('NFT Project');
    expect(scriptContent).toContain('DAO (Decentralized Autonomous Organization)');
    expect(scriptContent).toContain('GameFi/Web3 Gaming');
    expect(scriptContent).toContain('Custom Project');
    
    // Verify it contains network configurations
    expect(scriptContent).toContain('Ethereum Mainnet');
    expect(scriptContent).toContain('Polygon');
    expect(scriptContent).toContain('Arbitrum');
    
    // Verify it contains AI model configurations
    expect(scriptContent).toContain('Claude (Anthropic)');
    expect(scriptContent).toContain('Gemini (Google)');
    expect(scriptContent).toContain('GPT-4 (OpenAI)');
  });

  test('should have proper workflow script source files', async () => {
    // Verify that the source workflow scripts exist for copying
    const expectedScripts = ['spec-init.sh', 'tdd-cycle.sh', 'reverse-gen.sh'];
    
    expectedScripts.forEach(script => {
      const scriptPath = path.join(__dirname, '../../scripts', script);
      expect(fileExists(scriptPath)).toBe(true);
      
      // Verify scripts are executable
      const stats = fs.statSync(scriptPath);
      expect(stats.mode & parseInt('111', 8)).toBeGreaterThan(0);
    });
  });

  test('should contain project creation logic', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/project-setup.js');
    const scriptContent = readFile(scriptPath);
    
    // Verify the script contains the necessary functions for project creation
    expect(scriptContent).toContain('createProjectStructure');
    expect(scriptContent).toContain('generateAIConfigurations');
    expect(scriptContent).toContain('generatePackageJson');
    expect(scriptContent).toContain('generateReadme');
    expect(scriptContent).toContain('copyWorkflowScripts');
    
    // Verify it handles project validation
    expect(scriptContent).toContain('validateProjectName');
    
    // Verify it creates proper directory structure
    expect(scriptContent).toContain('contracts');
    expect(scriptContent).toContain('frontend/src');
    expect(scriptContent).toContain('.claude/commands');
    expect(scriptContent).toContain('.gemini/prompts');
    expect(scriptContent).toContain('.kairo/rules');
  });
});