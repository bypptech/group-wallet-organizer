import * as path from 'path';
import { execAsync, createTempDir, cleanupTempDir, createMockProject } from '../setup';

describe('reverse-gen.sh Integration Tests', () => {
  let tempDir: string;
  let projectDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
    projectDir = createMockProject(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  test('should display help information', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/reverse-gen.sh');
    const tempScriptPath = path.join(projectDir, 'reverse-gen.sh');
    
    await execAsync(`cp ${scriptPath} ${tempScriptPath}`);
    await execAsync(`chmod +x ${tempScriptPath}`);
    
    process.chdir(projectDir);
    const { stdout } = await execAsync('./reverse-gen.sh --help');
    
    expect(stdout).toContain('Tsumiki × VibeKit Reverse Engineering Tool');
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('Available types:');
    expect(stdout).toContain('requirements');
    expect(stdout).toContain('design');
    expect(stdout).toContain('tasks');
    expect(stdout).toContain('specs');
    expect(stdout).toContain('complete');
  });

  test('should validate project directory', async () => {
    const invalidDir = path.join(tempDir, 'invalid-project');
    await execAsync(`mkdir -p ${invalidDir}`);
    
    const scriptPath = path.join(__dirname, '../../scripts/reverse-gen.sh');
    const tempScriptPath = path.join(invalidDir, 'reverse-gen.sh');
    
    await execAsync(`cp ${scriptPath} ${tempScriptPath}`);
    await execAsync(`chmod +x ${tempScriptPath}`);
    
    process.chdir(invalidDir);
    
    try {
      await execAsync('./reverse-gen.sh --auto');
      fail('Should have failed in invalid directory');
    } catch (error: any) {
      expect(error.stdout).toContain("doesn't appear to be a Tsumiki × VibeKit project");
    }
  });

  test('should analyze codebase and show statistics', async () => {
    // Create mock codebase files
    await execAsync(`mkdir -p ${projectDir}/src ${projectDir}/contracts`);
    await execAsync(`touch ${projectDir}/src/index.js ${projectDir}/src/app.tsx`);
    await execAsync(`touch ${projectDir}/contracts/Token.sol`);
    await execAsync(`touch ${projectDir}/package.json`);
    await execAsync(`echo '{"name": "test", "dependencies": {"react": "^18.0.0"}}' > ${projectDir}/package.json`);
    
    const scriptPath = path.join(__dirname, '../../scripts/reverse-gen.sh');
    const tempScriptPath = path.join(projectDir, 'reverse-gen.sh');
    
    await execAsync(`cp ${scriptPath} ${tempScriptPath}`);
    await execAsync(`chmod +x ${tempScriptPath}`);
    
    process.chdir(projectDir);
    const { stdout } = await execAsync('./reverse-gen.sh --auto --type requirements');
    
    expect(stdout).toContain('Analyzing existing codebase');
    expect(stdout).toContain('Codebase Statistics:');
    expect(stdout).toContain('JavaScript/TypeScript files:');
    expect(stdout).toContain('Solidity contracts:');
    expect(stdout).toContain('Package.json found - Node.js project detected');
    expect(stdout).toContain('React framework detected');
  });

  test('should run specific reverse engineering types', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/reverse-gen.sh');
    const tempScriptPath = path.join(projectDir, 'reverse-gen.sh');
    
    await execAsync(`cp ${scriptPath} ${tempScriptPath}`);
    await execAsync(`chmod +x ${tempScriptPath}`);
    
    process.chdir(projectDir);
    
    // Test requirements extraction
    const { stdout } = await execAsync('./reverse-gen.sh --auto --type requirements');
    
    expect(stdout).toContain('Starting reverse engineering');
    expect(stdout).toContain('Type: requirements');
    expect(stdout).toContain('Requirements Extraction');
    expect(stdout).toContain('@rev-requirements');
    expect(stdout).toContain('docs/specs/reverse-requirements.md');
  });

  test('should validate reverse engineering type parameter', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/reverse-gen.sh');
    const tempScriptPath = path.join(projectDir, 'reverse-gen.sh');
    
    await execAsync(`cp ${scriptPath} ${tempScriptPath}`);
    await execAsync(`chmod +x ${tempScriptPath}`);
    
    process.chdir(projectDir);
    
    try {
      await execAsync('./reverse-gen.sh --type invalid-type');
      fail('Should have failed with invalid type');
    } catch (error: any) {
      expect(error.stdout).toContain('Invalid reverse engineering type: invalid-type');
    }
  });

  test('should create output directory structure', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/reverse-gen.sh');
    const tempScriptPath = path.join(projectDir, 'reverse-gen.sh');
    
    await execAsync(`cp ${scriptPath} ${tempScriptPath}`);
    await execAsync(`chmod +x ${tempScriptPath}`);
    
    process.chdir(projectDir);
    
    const { stdout } = await execAsync('./reverse-gen.sh --auto --type design --output-dir ./custom-output');
    
    expect(stdout).toContain('Output directory: ./custom-output');
    expect(stdout).toContain('custom-output/design/reverse-design.md');
  });
});