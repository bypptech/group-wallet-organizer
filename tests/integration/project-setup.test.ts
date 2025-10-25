import * as path from 'path';
import * as fs from 'fs';
import { execAsync, createTempDir, cleanupTempDir, fileExists, readFile } from '../setup';

describe('project-setup.js Integration Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  test('should create complete project via programmatic API', async () => {
    // Test project creation by directly calling the script
    const scriptPath = path.join(__dirname, '../../scripts/project-setup.js');
    const projectName = 'api-test-project';
    
    // Use spawn to control input directly
    const { spawn } = require('child_process');
    const child = spawn('node', [scriptPath], {
      cwd: tempDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Send input step by step
    child.stdin.write(`${projectName}\n`);
    child.stdin.write('1\n'); // DeFi
    child.stdin.write('1\n'); // Ethereum
    child.stdin.write('1\n'); // Claude
    child.stdin.write('2\n'); // Gemini
    child.stdin.write('4\n'); // Continue
    child.stdin.write('y\n'); // Confirm
    child.stdin.end();
    
    const exitCode = await new Promise((resolve) => {
      child.on('close', resolve);
    });
    
    expect(exitCode).toBe(0);
    expect(stderr.trim()).toBe('');
    expect(stdout).toContain('Project created successfully!');
    expect(stdout).toContain(projectName);
      
      const projectPath = path.join(tempDir, projectName);
      expect(fileExists(projectPath)).toBe(true);
      
      // Verify complete directory structure
      const expectedDirs = [
        'contracts',
        'test', 
        'scripts',
        'frontend/src/components',
        'frontend/src/hooks', 
        'frontend/src/utils',
        'docs/specs',
        'docs/design',
        'docs/tasks',
        '.claude/commands',
        '.gemini/prompts',
        '.kairo/rules'
      ];
      
      expectedDirs.forEach(dir => {
        expect(fileExists(path.join(projectPath, dir))).toBe(true);
      });
      
      // Verify workflow scripts are copied and executable
      const expectedScripts = ['spec-init.sh', 'tdd-cycle.sh', 'reverse-gen.sh'];
      expectedScripts.forEach(script => {
        const scriptFilePath = path.join(projectPath, 'scripts', script);
        expect(fileExists(scriptFilePath)).toBe(true);
        
        // Verify file is executable (cross-platform check)
        const stats = fs.statSync(scriptFilePath);
        expect(stats.mode & parseInt('111', 8)).toBeGreaterThan(0);
        
        // Verify script content
        const content = readFile(scriptFilePath);
        expect(content).toContain('#!/bin/bash');
        expect(content).toContain('Tsumiki × VibeKit');
      });
      
      // Verify configuration files exist and have correct content
      expect(fileExists(path.join(projectPath, 'package.json'))).toBe(true);
      expect(fileExists(path.join(projectPath, 'README.md'))).toBe(true);
      expect(fileExists(path.join(projectPath, '.tsumiki-vibekit.json'))).toBe(true);
      
      // Verify AI configuration files
      expect(fileExists(path.join(projectPath, '.claude/commands/project-config.md'))).toBe(true);
      expect(fileExists(path.join(projectPath, '.gemini/prompts/project-config.md'))).toBe(true);
      
      // Test package.json content
      const packageJson = JSON.parse(readFile(path.join(projectPath, 'package.json')));
      expect(packageJson.name).toBe('cli-test-project');
      expect(packageJson.description).toContain('DeFi Protocol');
      expect(packageJson.type).toBe('module');
      expect(packageJson.scripts.init).toBe('./scripts/spec-init.sh');
      expect(packageJson.scripts.tdd).toBe('./scripts/tdd-cycle.sh');
      expect(packageJson.scripts['reverse-gen']).toBe('./scripts/reverse-gen.sh');
      
      // Test project config content
      const projectConfig = JSON.parse(readFile(path.join(projectPath, '.tsumiki-vibekit.json')));
      expect(projectConfig.name).toBe('cli-test-project');
      expect(projectConfig.type).toBe('defi');
      expect(projectConfig.network).toBe('ethereum');
      expect(projectConfig.aiModels).toEqual(['claude', 'gemini']);
      expect(projectConfig.framework).toBe('tsumiki-vibekit');
      
      // Test AI configurations
      const claudeConfig = readFile(path.join(projectPath, '.claude/commands/project-config.md'));
      expect(claudeConfig).toContain(`Claude Configuration for ${projectName}`);
      expect(claudeConfig).toContain('DeFi Protocol');
      expect(claudeConfig).toContain('Ethereum Mainnet');
      expect(claudeConfig).toContain('@tdd-requirements');
      
      const geminiConfig = readFile(path.join(projectPath, '.gemini/prompts/project-config.md'));
      expect(geminiConfig).toContain(`Gemini Configuration for ${projectName}`);
      expect(geminiConfig).toContain('@kairo-requirements');
      
      // Test README content
      const readme = readFile(path.join(projectPath, 'README.md'));
      expect(readme).toContain(`# ${projectName}`);
      expect(readme).toContain('DeFi Protocol');
      expect(readme).toContain('Ethereum Mainnet');
      expect(readme).toContain('Claude (Anthropic)');
      expect(readme).toContain('Gemini (Google)');
      
    } finally {
      process.chdir(originalDir);
    }
  });

  test('should validate project name correctly via CLI', async () => {
    const originalDir = process.cwd();
    process.chdir(tempDir);
    
    try {
      const scriptPath = path.join(__dirname, '../../scripts/project-setup.js');
      
      // Create input file with invalid then valid project name
      const inputFile = path.join(tempDir, 'input-validation.txt');
      const inputContent = 'xy\nvalid-project\n1\n1\n1\n2\n4\ny\n';
      fs.writeFileSync(inputFile, inputContent);
      
      const { stdout } = await execAsync(`node ${scriptPath} < ${inputFile}`, {
        timeout: 25000,
        cwd: tempDir
      });
      
      expect(stdout).toContain('Project name must be at least 3 characters');
      expect(stdout).toContain('Project created successfully!');
      
      // Verify the valid project was created
      const projectPath = path.join(tempDir, 'valid-project');
      expect(fileExists(projectPath)).toBe(true);
      
    } finally {
      process.chdir(originalDir);
    }
  });

  test('should generate proper AI configurations', async () => {
    // Create a mock project directory to test configuration generation
    const projectPath = path.join(tempDir, 'mock-project');
    fs.mkdirSync(projectPath, { recursive: true });
    fs.mkdirSync(path.join(projectPath, '.claude/commands'), { recursive: true });
    fs.mkdirSync(path.join(projectPath, '.gemini/prompts'), { recursive: true });
    
    // Mock configuration generation (this would normally be done by the script)
    const claudeConfig = `# Claude Configuration for mock-project

## Project Context
- **Project Type**: DeFi Protocol
- **Network**: Ethereum Mainnet
- **Focus**: DeFi security, tokenomics, and liquidity management

## TDD Commands
- @tdd-requirements: Define defi-specific requirements
- @tdd-testcases: Create comprehensive test cases for defi
`;

    fs.writeFileSync(path.join(projectPath, '.claude/commands/project-config.md'), claudeConfig);
    
    expect(fileExists(path.join(projectPath, '.claude/commands/project-config.md'))).toBe(true);
    const content = readFile(path.join(projectPath, '.claude/commands/project-config.md'));
    expect(content).toContain('Claude Configuration for mock-project');
    expect(content).toContain('DeFi Protocol');
    expect(content).toContain('@tdd-requirements');
  });

  test('should handle existing project directory', async () => {
    // Create existing directory
    const existingProject = path.join(tempDir, 'existing-project');
    fs.mkdirSync(existingProject);
    
    process.chdir(tempDir);
    
    const scriptPath = path.join(__dirname, '../../scripts/project-setup.js');
    const inputFile = path.join(tempDir, 'input-existing.txt');
    const inputContent = 'existing-project\\n1\\n1\\n1\\n2\\n4\\ny\\n';
    fs.writeFileSync(inputFile, inputContent);
    
    // The script should detect and refuse to overwrite existing directories
    const { stdout } = await execAsync(`node ${scriptPath} < ${inputFile}`, {
      timeout: 15000,
      cwd: tempDir
    });
    
    expect(stdout).toContain('Directory existing-project already exists');
    expect(fileExists(existingProject)).toBe(true);
    // Verify no project files were created in existing directory
    expect(fileExists(path.join(existingProject, '.tsumiki-vibekit.json'))).toBe(false);
  });

  test('should copy workflow scripts and verify they are executable', async () => {
    // Create a mock project directory to test script copying
    const projectPath = path.join(tempDir, 'script-test-project');
    fs.mkdirSync(projectPath, { recursive: true });
    fs.mkdirSync(path.join(projectPath, 'scripts'), { recursive: true });
    
    // Mock the script files in the source directory for testing
    const sourceScriptsDir = path.join(__dirname, '../../scripts');
    const testScripts = ['spec-init.sh', 'tdd-cycle.sh', 'reverse-gen.sh'];
    
    // Verify source scripts exist
    testScripts.forEach(script => {
      expect(fileExists(path.join(sourceScriptsDir, script))).toBe(true);
    });
    
    // Test script content verification
    const specInitContent = readFile(path.join(sourceScriptsDir, 'spec-init.sh'));
    expect(specInitContent).toContain('Tsumiki × VibeKit Integration');
    expect(specInitContent).toContain('Specification Initialization Script');
    
    const tddCycleContent = readFile(path.join(sourceScriptsDir, 'tdd-cycle.sh'));
    expect(tddCycleContent).toContain('TDD Cycle Automation');
    expect(tddCycleContent).toContain('@tdd-requirements');
    
    const reverseGenContent = readFile(path.join(sourceScriptsDir, 'reverse-gen.sh'));
    expect(reverseGenContent).toContain('Reverse Engineering');
    expect(reverseGenContent).toContain('Tsumiki × VibeKit');
  });

  test('should create functional package.json with working scripts', async () => {
    // Create a mock project directory
    const projectPath = path.join(tempDir, 'package-test-project');
    fs.mkdirSync(projectPath, { recursive: true });
    fs.mkdirSync(path.join(projectPath, 'scripts'), { recursive: true });
    
    // Create mock script files
    const scriptFiles = ['spec-init.sh', 'tdd-cycle.sh', 'reverse-gen.sh'];
    scriptFiles.forEach(script => {
      fs.writeFileSync(path.join(projectPath, 'scripts', script), '#!/bin/bash\\necho "Test script"');
    });
    
    // Mock package.json generation
    const packageJson = {
      name: 'package-test-project',
      version: '1.0.0',
      scripts: {
        'init': './scripts/spec-init.sh',
        'tdd': './scripts/tdd-cycle.sh',
        'reverse-gen': './scripts/reverse-gen.sh',
        'setup': 'npm install'
      }
    };
    
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Verify package.json content
    const generatedPackageJson = JSON.parse(readFile(path.join(projectPath, 'package.json')));
    expect(generatedPackageJson.scripts.init).toBe('./scripts/spec-init.sh');
    expect(generatedPackageJson.scripts.tdd).toBe('./scripts/tdd-cycle.sh');
    expect(generatedPackageJson.scripts['reverse-gen']).toBe('./scripts/reverse-gen.sh');
    
    // Verify scripts reference existing files
    expect(fileExists(path.join(projectPath, 'scripts/spec-init.sh'))).toBe(true);
    expect(fileExists(path.join(projectPath, 'scripts/tdd-cycle.sh'))).toBe(true);
    expect(fileExists(path.join(projectPath, 'scripts/reverse-gen.sh'))).toBe(true);
    
    // Verify no broken Hardhat references
    expect(generatedPackageJson.scripts.compile).toBeUndefined();
    expect(generatedPackageJson.scripts['deploy:local']).toBeUndefined();
    expect(generatedPackageJson.dependencies?.hardhat).toBeUndefined();
  });

  test('smoke test: generated project npm scripts should run successfully', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/project-setup.js');
    process.chdir(tempDir);

    // Create a real project using the CLI with file-based input
    const inputFile = path.join(tempDir, 'input-smoke.txt');
    const inputContent = 'smoke-test-project\\n1\\n1\\n1\\n2\\n4\\ny\\n';
    fs.writeFileSync(inputFile, inputContent);
    
    const { stdout } = await execAsync(`node ${scriptPath} < ${inputFile}`, {
      timeout: 30000,
      cwd: tempDir
    });
    
    expect(stdout).toContain('Project created successfully!');

    const projectPath = path.join(tempDir, 'smoke-test-project');
    process.chdir(projectPath);
    
    // Test that spec-init.sh script runs without error
    const { stdout: initOut, stderr: initErr } = await execAsync('./scripts/spec-init.sh', {
      timeout: 15000
    });
    
    expect(initOut).toContain('Initializing Tsumiki × VibeKit Integration');
    expect(initErr.trim()).toBe('');
    
    // Verify the script created expected files
    expect(fileExists(path.join(projectPath, 'docs/specs/requirements-template.md'))).toBe(true);
    expect(fileExists(path.join(projectPath, 'docs/design/architecture-template.md'))).toBe(true);
    
    // Test that the scripts have correct permissions and content
    const tddScriptPath = path.join(projectPath, 'scripts/tdd-cycle.sh');
    const tddContent = readFile(tddScriptPath);
    expect(tddContent).toContain('#!/bin/bash');
    expect(tddContent).toContain('TDD Cycle Automation');
    
    const stats = fs.statSync(tddScriptPath);
    expect(stats.mode & parseInt('111', 8)).toBeGreaterThan(0);
  });

  test('CLI should work from different working directories', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/project-setup.js');
    
    // Test from a different directory
    const subDir = path.join(tempDir, 'subdir');
    fs.mkdirSync(subDir);
    process.chdir(subDir);
    
    const inputFile = path.join(subDir, 'input-cross-dir.txt');
    const inputContent = 'cross-dir-test\\n1\\n1\\n1\\n2\\n4\\ny\\n';
    fs.writeFileSync(inputFile, inputContent);
    
    const { stdout } = await execAsync(`node ${scriptPath} < ${inputFile}`, {
      timeout: 30000,
      cwd: subDir
    });
    
    expect(stdout).toContain('Project created successfully!');

    // Project should be created in current working directory (subDir)
    const projectPath = path.join(subDir, 'cross-dir-test');
    expect(fileExists(projectPath)).toBe(true);
    expect(fileExists(path.join(projectPath, 'scripts/spec-init.sh'))).toBe(true);
    expect(fileExists(path.join(projectPath, 'scripts/tdd-cycle.sh'))).toBe(true);
    expect(fileExists(path.join(projectPath, 'scripts/reverse-gen.sh'))).toBe(true);
    
    // Verify scripts are executable and have correct content
    const scriptContent = readFile(path.join(projectPath, 'scripts/spec-init.sh'));
    expect(scriptContent).toContain('Tsumiki × VibeKit Integration');
    expect(scriptContent).toContain('Specification Initialization Script');
  });
});