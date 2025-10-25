import * as path from 'path';
import { execAsync, createTempDir, cleanupTempDir, fileExists, readFile } from '../setup';

describe('spec-init.sh Integration Tests', () => {
  let tempDir: string;
  let projectDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
    projectDir = path.join(tempDir, 'test-project');
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  test('should create unified directory structure', async () => {
    // Copy script to temp directory and execute
    const scriptPath = path.join(__dirname, '../../scripts/spec-init.sh');
    const tempScriptPath = path.join(tempDir, 'spec-init.sh');
    
    await execAsync(`cp ${scriptPath} ${tempScriptPath}`);
    await execAsync(`chmod +x ${tempScriptPath}`);
    
    // Execute in project directory
    process.chdir(tempDir);
    const { stdout, stderr } = await execAsync('./spec-init.sh');
    
    // Verify output messages
    expect(stdout).toContain('Initializing Tsumiki × VibeKit Integration Environment');
    expect(stdout).toContain('Integration Environment Ready!');
    
    // Verify directory structure creation
    expect(fileExists(path.join(tempDir, 'docs/specs'))).toBe(true);
    expect(fileExists(path.join(tempDir, 'docs/design'))).toBe(true);
    expect(fileExists(path.join(tempDir, 'docs/templates'))).toBe(true);
    expect(fileExists(path.join(tempDir, 'docs/examples'))).toBe(true);
    expect(fileExists(path.join(tempDir, 'docs/tasks'))).toBe(true);
    
    expect(fileExists(path.join(tempDir, '.claude/commands'))).toBe(true);
    expect(fileExists(path.join(tempDir, '.gemini/prompts'))).toBe(true);
    expect(fileExists(path.join(tempDir, '.kiro/rules'))).toBe(true);
  });

  test('should create required template files', async () => {
    const scriptPath = path.join(__dirname, '../../scripts/spec-init.sh');
    const tempScriptPath = path.join(tempDir, 'spec-init.sh');
    
    await execAsync(`cp ${scriptPath} ${tempScriptPath}`);
    await execAsync(`chmod +x ${tempScriptPath}`);
    
    process.chdir(tempDir);
    await execAsync('./spec-init.sh');
    
    // Verify template files
    expect(fileExists(path.join(tempDir, 'docs/specs/requirements-template.md'))).toBe(true);
    expect(fileExists(path.join(tempDir, 'docs/design/architecture-template.md'))).toBe(true);
    expect(fileExists(path.join(tempDir, 'docs/tasks/task-template.md'))).toBe(true);
    
    // Verify AI configuration files
    expect(fileExists(path.join(tempDir, '.claude/commands/tdd-commands.md'))).toBe(true);
    expect(fileExists(path.join(tempDir, '.gemini/prompts/kairo-prompts.md'))).toBe(true);
    expect(fileExists(path.join(tempDir, '.kiro/rules/quality-gates.md'))).toBe(true);
    
    // Verify content of key files
    const requirementsTemplate = readFile(path.join(tempDir, 'docs/specs/requirements-template.md'));
    expect(requirementsTemplate).toContain('Requirements Specification Template');
    expect(requirementsTemplate).toContain('Functional Requirements');
    expect(requirementsTemplate).toContain('Non-Functional Requirements');
    
    const tddCommands = readFile(path.join(tempDir, '.claude/commands/tdd-commands.md'));
    expect(tddCommands).toContain('@tdd-requirements');
    expect(tddCommands).toContain('@tdd-testcases');
    expect(tddCommands).toContain('@tdd-red');
  });

  test('should handle existing directories gracefully', async () => {
    // Pre-create some directories
    await execAsync(`mkdir -p ${tempDir}/docs/specs`);
    await execAsync(`mkdir -p ${tempDir}/.claude`);
    
    const scriptPath = path.join(__dirname, '../../scripts/spec-init.sh');
    const tempScriptPath = path.join(tempDir, 'spec-init.sh');
    
    await execAsync(`cp ${scriptPath} ${tempScriptPath}`);
    await execAsync(`chmod +x ${tempScriptPath}`);
    
    process.chdir(tempDir);
    
    // Should not fail when directories already exist
    const { stdout } = await execAsync('./spec-init.sh');
    expect(stdout).toContain('Integration Environment Ready!');
    
    // Verify all expected files are still created
    expect(fileExists(path.join(tempDir, 'docs/specs/requirements-template.md'))).toBe(true);
    expect(fileExists(path.join(tempDir, '.claude/commands/tdd-commands.md'))).toBe(true);
  });
});