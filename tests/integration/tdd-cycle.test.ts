import * as path from 'path';
import { execAsync, createTempDir, cleanupTempDir, createMockProject } from '../setup';

describe('tdd-cycle.sh Integration Tests', () => {
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
    const scriptPath = path.join(__dirname, '../../scripts/tdd-cycle.sh');
    const tempScriptPath = path.join(projectDir, 'tdd-cycle.sh');
    
    await execAsync(`cp ${scriptPath} ${tempScriptPath}`);
    await execAsync(`chmod +x ${tempScriptPath}`);
    
    process.chdir(projectDir);
    const { stdout } = await execAsync('./tdd-cycle.sh --help');
    
    expect(stdout).toContain('Tsumiki × VibeKit TDD Cycle Automation');
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('Available phases:');
    expect(stdout).toContain('requirements');
    expect(stdout).toContain('testcases');
    expect(stdout).toContain('red');
    expect(stdout).toContain('green');
    expect(stdout).toContain('refactor');
    expect(stdout).toContain('verify');
  });

  test('should validate project directory', async () => {
    // Test in directory without QUALITY.md
    const invalidDir = path.join(tempDir, 'invalid-project');
    await execAsync(`mkdir -p ${invalidDir}`);
    
    const scriptPath = path.join(__dirname, '../../scripts/tdd-cycle.sh');
    const tempScriptPath = path.join(invalidDir, 'tdd-cycle.sh');
    
    await execAsync(`cp ${scriptPath} ${tempScriptPath}`);
    await execAsync(`chmod +x ${tempScriptPath}`);
    
    process.chdir(invalidDir);
    
    try {
      await execAsync('./tdd-cycle.sh --auto');
      fail('Should have failed in invalid directory');
    } catch (error: any) {
      expect(error.stdout).toContain("doesn't appear to be a Tsumiki × VibeKit project");
    }
  });

  test('should run in automated mode for specific phases', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/tdd-cycle.sh');
    const tempScriptPath = path.join(projectDir, 'tdd-cycle.sh');
    
    await execAsync(`cp ${scriptPath} ${tempScriptPath}`);
    await execAsync(`chmod +x ${tempScriptPath}`);
    
    process.chdir(projectDir);
    
    // Test requirements phase in auto mode
    const { stdout } = await execAsync('./tdd-cycle.sh --auto --phase requirements');
    
    expect(stdout).toContain('Starting TDD cycle');
    expect(stdout).toContain('Auto mode: true');
    expect(stdout).toContain('Specific phase: requirements');
    expect(stdout).toContain('REQUIREMENTS Phase');
    expect(stdout).toContain('@tdd-requirements');
  });

  test('should validate phase parameters', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/tdd-cycle.sh');
    const tempScriptPath = path.join(projectDir, 'tdd-cycle.sh');
    
    await execAsync(`cp ${scriptPath} ${tempScriptPath}`);
    await execAsync(`chmod +x ${tempScriptPath}`);
    
    process.chdir(projectDir);
    
    try {
      await execAsync('./tdd-cycle.sh --phase invalid-phase');
      fail('Should have failed with invalid phase');
    } catch (error: any) {
      expect(error.stdout).toContain('Invalid phase: invalid-phase');
    }
  });

  test('should show completion message', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/tdd-cycle.sh');
    const tempScriptPath = path.join(projectDir, 'tdd-cycle.sh');
    
    await execAsync(`cp ${scriptPath} ${tempScriptPath}`);
    await execAsync(`chmod +x ${tempScriptPath}`);
    
    process.chdir(projectDir);
    
    const { stdout } = await execAsync('./tdd-cycle.sh --auto --phase verify');
    
    expect(stdout).toContain('TDD Cycle Completed Successfully!');
    expect(stdout).toContain('Quality Checklist:');
    expect(stdout).toContain('Generated artifacts:');
    expect(stdout).toContain('Next steps:');
  });
});