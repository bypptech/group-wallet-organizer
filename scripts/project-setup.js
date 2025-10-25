#!/usr/bin/env node

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyTemplate } from './template-manager-clean.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Project type configurations
const PROJECT_TYPES = {
  'defi': {
    name: 'DeFi Protocol',
    description: 'Decentralized Finance protocols (AMM, Lending, Yield Farming)',
    templates: ['token', 'pool', 'staking', 'governance'],
    aiPrompts: {
      focus: 'DeFi security, tokenomics, and liquidity management',
      considerations: 'Flash loan attacks, slippage, impermanent loss'
    }
  },
  'nft': {
    name: 'NFT Project',
    description: 'Non-Fungible Token collections and marketplaces',
    templates: ['erc721', 'marketplace', 'royalties', 'metadata'],
    aiPrompts: {
      focus: 'NFT standards, metadata management, and marketplace functionality',
      considerations: 'Royalty enforcement, batch operations, gas optimization'
    }
  },
  'dao': {
    name: 'DAO (Decentralized Autonomous Organization)',
    description: 'Governance and voting systems',
    templates: ['governance', 'voting', 'treasury', 'proposals'],
    aiPrompts: {
      focus: 'Governance mechanisms, voting systems, and treasury management',
      considerations: 'Proposal execution, vote delegation, timelock security'
    }
  },
  'gaming': {
    name: 'GameFi/Web3 Gaming',
    description: 'Blockchain gaming with tokens and NFTs',
    templates: ['game-token', 'nft-items', 'leaderboard', 'rewards'],
    aiPrompts: {
      focus: 'Gaming economics, item ownership, and reward distribution',
      considerations: 'Play-to-earn balance, asset interoperability, scalability'
    }
  },
  'custom': {
    name: 'Custom Project',
    description: 'Custom Web3 project with flexible configuration',
    templates: ['basic-contract', 'minimal-frontend'],
    aiPrompts: {
      focus: 'General Web3 development best practices',
      considerations: 'Security, gas optimization, user experience'
    }
  }
};

const NETWORKS = {
  'ethereum': { name: 'Ethereum Mainnet', testnet: 'Goerli' },
  'polygon': { name: 'Polygon', testnet: 'Mumbai' },
  'arbitrum': { name: 'Arbitrum', testnet: 'Arbitrum Goerli' },
  'optimism': { name: 'Optimism', testnet: 'Optimism Goerli' },
  'base': { name: 'Base', testnet: 'Base Goerli' }
};

const AI_MODELS = {
  'claude': { name: 'Claude (Anthropic)', best_for: 'Implementation, coding, debugging' },
  'gemini': { name: 'Gemini (Google)', best_for: 'Requirements, planning, review' },
  'gpt4': { name: 'GPT-4 (OpenAI)', best_for: 'General development, documentation' }
};

// Utility functions
const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const displayHeader = () => {
  console.log('\\n🚀 Tsumiki × VibeKit Interactive Project Setup');
  console.log('='.repeat(50));
  console.log('Create a new Web3 AI TDD project with guided configuration\\n');
};

const displayOptions = (options, title) => {
  console.log(`\\n${title}:`);
  console.log('-'.repeat(title.length + 1));
  Object.entries(options).forEach(([key, value], index) => {
    const name = value.name || value;
    const description = value.description ? ` - ${value.description}` : '';
    console.log(`${index + 1}. ${name}${description}`);
  });
  console.log();
};

const selectFromOptions = async (options, prompt, validator = null) => {
  const keys = Object.keys(options);
  while (true) {
    const input = await question(prompt);
    const index = parseInt(input) - 1;
    
    if (index >= 0 && index < keys.length) {
      const selected = keys[index];
      if (validator && !validator(selected)) {
        console.log('❌ Invalid selection. Please try again.');
        continue;
      }
      return selected;
    }
    console.log('❌ Invalid option. Please enter a number from the list.');
  }
};

const validateProjectName = (name) => {
  return /^[a-zA-Z0-9-_]+$/.test(name) && name.length >= 3;
};

const createProjectStructure = (projectPath, config) => {
  console.log('\\n📁 Creating project structure...');
  
  // Create base directories - Fix: Use .kairo instead of .kiro for consistency
  const directories = [
    'contracts', 'test', 'scripts', 'frontend/src/components',
    'frontend/src/hooks', 'frontend/src/utils', 'docs/specs',
    'docs/design', 'docs/tasks', '.claude/commands', '.gemini/prompts', '.kairo/rules'
  ];
  
  directories.forEach(dir => {
    const fullPath = path.join(projectPath, dir);
    fs.mkdirSync(fullPath, { recursive: true });
  });
  
  console.log('✅ Project directories created');
};

const generateProjectConfig = (config) => {
  return {
    name: config.projectName,
    type: config.projectType,
    network: config.network,
    aiModels: config.aiModels,
    features: PROJECT_TYPES[config.projectType].templates,
    created: new Date().toISOString(),
    version: '1.0.0',
    framework: 'tsumiki-vibekit',
    aiPrompts: PROJECT_TYPES[config.projectType].aiPrompts
  };
};

const generateAIConfigurations = (projectPath, config) => {
  console.log('\\n🤖 Generating AI configurations...');
  
  const projectType = PROJECT_TYPES[config.projectType];
  
  // Claude configuration
  const claudeConfig = `# Claude Configuration for ${config.projectName}

## Project Context
- **Project Type**: ${projectType.name}
- **Network**: ${NETWORKS[config.network].name}
- **Focus**: ${projectType.aiPrompts.focus}

## Key Considerations
${projectType.aiPrompts.considerations}

## TDD Commands
- @tdd-requirements: Define ${config.projectType}-specific requirements
- @tdd-testcases: Create comprehensive test cases for ${config.projectType}
- @tdd-red: Write failing tests for smart contracts
- @tdd-green: Implement minimal passing code
- @tdd-refactor: Optimize gas usage and improve security

## Security Checklist
- [ ] Reentrancy protection
- [ ] Access control validation
- [ ] Integer overflow/underflow checks
- [ ] Gas optimization review
- [ ] External call safety
`;

  // Gemini configuration
  const geminiConfig = `# Gemini Configuration for ${config.projectName}

## Project Planning Focus
- **Project Type**: ${projectType.name}
- **Target Network**: ${NETWORKS[config.network].name}
- **Key Features**: ${projectType.templates.join(', ')}

## Requirements Analysis
Focus on ${projectType.aiPrompts.focus} when generating requirements.

## Kairo Workflow Commands
- @kairo-requirements: Analyze ${config.projectType} business requirements
- @kairo-design: Create ${config.projectType} system architecture
- @kairo-tasks: Break down development tasks
- @kairo-implement: Guide TDD implementation

## Quality Gates
- Requirements completeness validation
- Architecture review and approval
- Security consideration assessment
- Performance requirement definition
`;

  // Write configurations
  fs.writeFileSync(
    path.join(projectPath, '.claude/commands/project-config.md'),
    claudeConfig
  );
  
  fs.writeFileSync(
    path.join(projectPath, '.gemini/prompts/project-config.md'),
    geminiConfig
  );
  
  console.log('✅ AI configurations generated');
};

const copyWorkflowScripts = (projectPath) => {
  console.log('\\n🔧 Copying workflow scripts...');
  
  const scriptsDir = path.join(projectPath, 'scripts');
  
  // Use fileURLToPath for proper cross-platform path resolution
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFilePath);
  // Get the parent directory containing scripts
  const sourceScriptsDir = path.dirname(currentDir);
  const sourceScriptsPath = path.join(sourceScriptsDir, 'scripts');
  
  // Copy workflow scripts to the new project
  const scriptFiles = ['spec-init.sh', 'tdd-cycle.sh', 'reverse-gen.sh'];
  let copiedCount = 0;
  let errors = [];
  
  scriptFiles.forEach(scriptFile => {
    const sourcePath = path.join(sourceScriptsPath, scriptFile);
    const destPath = path.join(scriptsDir, scriptFile);
    
    try {
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        // Make scripts executable
        try {
          fs.chmodSync(destPath, 0o755);
        } catch (chmodError) {
          console.log(`⚠️  Could not make ${scriptFile} executable: ${chmodError.message}`);
        }
        copiedCount++;
        console.log(`✅ Copied ${scriptFile}`);
      } else {
        const error = `Source script not found: ${sourcePath}`;
        console.log(`❌ ${error}`);
        errors.push(error);
      }
    } catch (copyError) {
      const error = `Failed to copy ${scriptFile}: ${copyError.message}`;
      console.log(`❌ ${error}`);
      errors.push(error);
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`Script copying failed: ${errors.join(', ')}`);
  }
  
  console.log(`✅ Successfully copied ${copiedCount}/${scriptFiles.length} workflow scripts`);
};

const generatePackageJson = (projectPath, config) => {
  const packageJson = {
    name: config.projectName,
    version: '1.0.0',
    description: `${PROJECT_TYPES[config.projectType].name} built with Tsumiki × VibeKit`,
    type: 'module',
    scripts: {
      // Fix: Remove Hardhat scripts that reference non-existent files
      'init': './scripts/spec-init.sh',
      'tdd': './scripts/tdd-cycle.sh',
      'reverse-gen': './scripts/reverse-gen.sh',
      'setup': 'npm install',
      'frontend:dev': 'cd frontend && npm run dev',
      'frontend:build': 'cd frontend && npm run build'
    },
    dependencies: {
      // Fix: Remove Hardhat dependencies until proper configuration is generated
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      'typescript': '^5.0.0'
    }
  };
  
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
};

const generateReadme = (projectPath, config) => {
  const projectType = PROJECT_TYPES[config.projectType];
  const readme = `# ${config.projectName}

${projectType.description} built with Tsumiki × VibeKit framework.

## Project Configuration
- **Type**: ${projectType.name}
- **Network**: ${NETWORKS[config.network].name}
- **AI Models**: ${config.aiModels.map(m => AI_MODELS[m].name).join(', ')}

## Quick Start

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Initialize Development Environment
\`\`\`bash
# Run the spec initialization script
./scripts/spec-init.sh

# Start AI-guided requirements definition
@kairo-requirements
\`\`\`

### 3. TDD Development Cycle
\`\`\`bash
# Automated TDD workflow
./scripts/tdd-cycle.sh

# Or run specific phases:
./scripts/tdd-cycle.sh --phase requirements
./scripts/tdd-cycle.sh --phase testcases
./scripts/tdd-cycle.sh --phase red
./scripts/tdd-cycle.sh --phase green
./scripts/tdd-cycle.sh --phase refactor
\`\`\`

## Project Structure

\`\`\`
${config.projectName}/
├── contracts/          # Smart contracts
├── test/              # Contract tests
├── frontend/          # Web3 frontend
├── docs/              # Specifications and design
│   ├── specs/         # Requirements and specs
│   ├── design/        # Architecture docs
│   └── tasks/         # Task breakdowns
├── .claude/           # Claude AI configuration
├── .gemini/           # Gemini AI configuration
└── .kairo/            # Kairo workflow rules
\`\`\`

## Key Features
${projectType.templates.map(t => `- ${t}`).join('\\n')}

## AI Development Focus
${projectType.aiPrompts.focus}

## Security Considerations
${projectType.aiPrompts.considerations}

## Development Workflow

### Initialize Project
\`\`\`bash
npm run init    # Initialize specs and AI configurations
\`\`\`

### TDD Development
\`\`\`bash
npm run tdd     # Run complete TDD cycle
\`\`\`

### Reverse Engineering
\`\`\`bash
npm run reverse-gen    # Analyze existing codebase
\`\`\`

## Resources
- [Tsumiki × VibeKit Documentation](../README.md)
- [Web3 Development Guide](docs/development-guide.md)
- [Security Best Practices](docs/security.md)
`;

  fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
};

// Core project creation logic (testable)
const createProject = async (config, baseDir = process.cwd()) => {
  const { projectName, projectType, network, aiModels } = config;
  
  // Validate configuration
  if (!validateProjectName(projectName)) {
    throw new Error('Project name must be at least 3 characters and contain only letters, numbers, hyphens, and underscores.');
  }
  
  if (!PROJECT_TYPES[projectType]) {
    throw new Error(`Invalid project type: ${projectType}`);
  }
  
  if (!NETWORKS[network]) {
    throw new Error(`Invalid network: ${network}`);
  }
  
  const projectPath = path.join(baseDir, projectName);
  
  if (fs.existsSync(projectPath)) {
    throw new Error(`Directory ${projectName} already exists.`);
  }
  
  console.log('\\n🚀 Creating project...');
  fs.mkdirSync(projectPath);
  
  try {
    createProjectStructure(projectPath, config);
    generateAIConfigurations(projectPath, config);
    copyWorkflowScripts(projectPath);
    generatePackageJson(projectPath, config);
    generateReadme(projectPath, config);
    
    // Apply project template
    applyTemplate(projectPath, projectType);
    
    // Save project configuration
    fs.writeFileSync(
      path.join(projectPath, '.tsumiki-vibekit.json'),
      JSON.stringify(generateProjectConfig(config), null, 2)
    );
    
    console.log('\\n🎉 Project created successfully!');
    console.log('='.repeat(35));
    console.log(`\\n📁 Project location: ${projectPath}`);
    console.log('\\n🔄 Next steps:');
    console.log(`   1. cd ${projectName}`);
    console.log('   2. npm install');
    console.log('   3. ./scripts/spec-init.sh');
    console.log('   4. @kairo-requirements');
    console.log('\\n💡 Happy Web3 AI TDD development!');
    
    return projectPath;
  } catch (error) {
    // Clean up partial project on error
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
    throw error;
  }
};

// Main setup flow
const main = async () => {
  try {
    displayHeader();
    
    // Project name
    let projectName;
    while (true) {
      projectName = await question('📝 Enter project name (e.g., my-defi-protocol): ');
      if (validateProjectName(projectName)) break;
      console.log('❌ Project name must be at least 3 characters and contain only letters, numbers, hyphens, and underscores.');
    }
    
    // Project type
    displayOptions(PROJECT_TYPES, 'Select project type');
    const projectType = await selectFromOptions(
      PROJECT_TYPES,
      '🎯 Choose project type (1-5): '
    );
    
    // Network selection
    displayOptions(NETWORKS, 'Select target network');
    const network = await selectFromOptions(
      NETWORKS,
      '🌐 Choose target network (1-5): '
    );
    
    // AI model selection
    displayOptions(AI_MODELS, 'Select AI models to use');
    console.log("4. Continue with selected models");
    
    const aiModels = [];
    while (true) {
      const input = await question(`🤖 Choose AI model (1-3) or '4' to continue: `);
      
      if (input === '4') break;
      
      const index = parseInt(input) - 1;
      const keys = Object.keys(AI_MODELS);
      
      if (index >= 0 && index < keys.length) {
        const selected = keys[index];
        if (!aiModels.includes(selected)) {
          aiModels.push(selected);
          console.log(`✅ Added ${AI_MODELS[selected].name}`);
        } else {
          console.log(`⚠️  ${AI_MODELS[selected].name} already selected`);
        }
      } else {
        console.log("❌ Invalid option. Please enter 1-3 or '4' to continue.");
      }
    }
    
    if (aiModels.length === 0) {
      aiModels.push('claude', 'gemini'); // Default selection
      console.log('🔄 No models selected, using default: Claude + Gemini');
    }
    
    // Confirmation
    console.log('\\n📋 Project Configuration Summary:');
    console.log(`   Name: ${projectName}`);
    console.log(`   Type: ${PROJECT_TYPES[projectType].name}`);
    console.log(`   Network: ${NETWORKS[network].name}`);
    console.log(`   AI Models: ${aiModels.map(m => AI_MODELS[m].name).join(', ')}`);
    
    const confirm = await question('\\n✅ Create project with this configuration? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Project creation cancelled.');
      rl.close();
      return;
    }
    
    // Use the extracted createProject function
    const config = {
      projectName,
      projectType,
      network,
      aiModels
    };
    
    await createProject(config);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
};


// Export functions for testing
export { 
  createProject, 
  validateProjectName, 
  PROJECT_TYPES, 
  NETWORKS, 
  AI_MODELS 
};


if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
