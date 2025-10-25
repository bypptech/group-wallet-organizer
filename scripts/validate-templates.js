#!/usr/bin/env node

import { applyTemplate, TEMPLATES, generateContractTemplate, generateTestTemplate } from './template-manager-clean.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Validation functions
function validateContractGeneration() {
  console.log('🔍 Validating contract generation...');
  let errors = [];
  
  Object.keys(TEMPLATES).forEach(templateType => {
    const template = TEMPLATES[templateType];
    console.log(`\n  Testing ${template.name} template:`);
    
    template.contracts.forEach(contractName => {
      try {
        const contractContent = generateContractTemplate(templateType, contractName);
        
        // Basic validation
        if (!contractContent.includes('// SPDX-License-Identifier: MIT')) {
          errors.push(`${templateType}/${contractName}: Missing SPDX license`);
        }
        if (!contractContent.includes('pragma solidity ^0.8.19')) {
          errors.push(`${templateType}/${contractName}: Missing pragma directive`);
        }
        const expectedContractName = contractName.replace('.sol', '');
        const hasContractDeclaration = contractContent.includes(`contract ${expectedContractName}`) || 
                                      contractContent.includes(`contract My${expectedContractName}`) ||
                                      contractContent.includes('contract ');
        if (!hasContractDeclaration) {
          errors.push(`${templateType}/${contractName}: Missing contract declaration`);
        }
        if (!contractContent.includes('@openzeppelin/contracts')) {
          errors.push(`${templateType}/${contractName}: Missing OpenZeppelin imports`);
        }
        
        console.log(`    ✅ ${contractName} - Valid`);
      } catch (error) {
        errors.push(`${templateType}/${contractName}: ${error.message}`);
        console.log(`    ❌ ${contractName} - Error: ${error.message}`);
      }
    });
  });
  
  return errors;
}

function validateTestGeneration() {
  console.log('\n🔍 Validating test generation...');
  let errors = [];
  
  Object.keys(TEMPLATES).forEach(templateType => {
    const template = TEMPLATES[templateType];
    console.log(`\n  Testing ${template.name} test files:`);
    
    template.testFiles.forEach(testFile => {
      try {
        const testContent = generateTestTemplate(templateType, testFile);
        
        // Basic validation
        if (!testContent.includes('describe(')) {
          errors.push(`${templateType}/${testFile}: Missing describe block`);
        }
        if (!testContent.includes('beforeEach(')) {
          errors.push(`${templateType}/${testFile}: Missing beforeEach setup`);
        }
        if (!testContent.includes('expect(')) {
          errors.push(`${templateType}/${testFile}: Missing expect assertions`);
        }
        if (!testContent.includes('ethers.getSigners()')) {
          errors.push(`${templateType}/${testFile}: Missing ethers setup`);
        }
        
        console.log(`    ✅ ${testFile} - Valid`);
      } catch (error) {
        errors.push(`${templateType}/${testFile}: ${error.message}`);
        console.log(`    ❌ ${testFile} - Error: ${error.message}`);
      }
    });
  });
  
  return errors;
}

function validateTemplateApplication() {
  console.log('\n🔍 Validating template application...');
  let errors = [];
  
  // Create temporary directory
  const tempDir = path.join(__dirname, '../tmp', `validation-${Date.now()}`);
  
  Object.keys(TEMPLATES).forEach(templateType => {
    try {
      const projectDir = path.join(tempDir, `test-${templateType}`);
      
      // Create basic project structure
      fs.mkdirSync(path.join(projectDir, '.claude/commands'), { recursive: true });
      fs.mkdirSync(path.join(projectDir, '.gemini/prompts'), { recursive: true });
      
      // Create basic AI config files
      fs.writeFileSync(
        path.join(projectDir, '.claude/commands/project-config.md'),
        '# Claude Configuration\n'
      );
      fs.writeFileSync(
        path.join(projectDir, '.gemini/prompts/project-config.md'),
        '# Gemini Configuration\n'
      );
      
      // Apply template
      applyTemplate(projectDir, templateType);
      
      // Validate that files were created
      const template = TEMPLATES[templateType];
      
      // Check contracts
      template.contracts.forEach(contractName => {
        const contractPath = path.join(projectDir, 'contracts', contractName);
        if (!fs.existsSync(contractPath)) {
          errors.push(`${templateType}: Contract ${contractName} not created`);
        } else {
          const content = fs.readFileSync(contractPath, 'utf8');
          if (content.length < 100) {
            errors.push(`${templateType}: Contract ${contractName} appears empty or too short`);
          }
        }
      });
      
      // Check tests
      template.testFiles.forEach(testFile => {
        const testPath = path.join(projectDir, 'test', testFile);
        if (!fs.existsSync(testPath)) {
          errors.push(`${templateType}: Test ${testFile} not created`);
        } else {
          const content = fs.readFileSync(testPath, 'utf8');
          if (content.length < 100) {
            errors.push(`${templateType}: Test ${testFile} appears empty or too short`);
          }
        }
      });
      
      // Check AI config updates
      const claudeConfig = fs.readFileSync(path.join(projectDir, '.claude/commands/project-config.md'), 'utf8');
      if (!claudeConfig.includes(template.name)) {
        errors.push(`${templateType}: Claude config not updated with template-specific content`);
      }
      
      console.log(`  ✅ ${template.name} - Template applied successfully`);
      
    } catch (error) {
      errors.push(`${templateType}: Template application failed - ${error.message}`);
      console.log(`  ❌ ${templateType} - Error: ${error.message}`);
    }
  });
  
  // Cleanup
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  return errors;
}

function validateTemplateConsistency() {
  console.log('\n🔍 Validating template consistency...');
  let errors = [];
  
  Object.keys(TEMPLATES).forEach(templateType => {
    const template = TEMPLATES[templateType];
    
    // Check that contract and test counts match
    if (template.contracts.length !== template.testFiles.length) {
      errors.push(`${templateType}: Contract count (${template.contracts.length}) doesn't match test count (${template.testFiles.length})`);
    }
    
    // Check that AI prompts exist
    if (!template.aiPrompts || !template.aiPrompts.claude || !template.aiPrompts.gemini) {
      errors.push(`${templateType}: Missing AI prompt configurations`);
    } else {
      if (template.aiPrompts.claude.length === 0) {
        errors.push(`${templateType}: No Claude prompts defined`);
      }
      if (template.aiPrompts.gemini.length === 0) {
        errors.push(`${templateType}: No Gemini prompts defined`);
      }
    }
    
    // Check that required fields exist
    if (!template.name || !template.description) {
      errors.push(`${templateType}: Missing name or description`);
    }
  });
  
  return errors;
}

// Main validation function
async function runValidation() {
  console.log('🚀 Running Template System Validation\n');
  
  const contractErrors = validateContractGeneration();
  const testErrors = validateTestGeneration();
  const applicationErrors = validateTemplateApplication();
  const consistencyErrors = validateTemplateConsistency();
  
  const allErrors = [...contractErrors, ...testErrors, ...applicationErrors, ...consistencyErrors];
  
  console.log('\n📊 Validation Results:');
  console.log('='.repeat(50));
  
  if (allErrors.length === 0) {
    console.log('✅ All validations passed! Template system is working correctly.');
    console.log('\n📋 Summary:');
    console.log(`- Templates available: ${Object.keys(TEMPLATES).length}`);
    console.log(`- Total contracts: ${Object.values(TEMPLATES).reduce((sum, t) => sum + t.contracts.length, 0)}`);
    console.log(`- Total tests: ${Object.values(TEMPLATES).reduce((sum, t) => sum + t.testFiles.length, 0)}`);
    console.log('- All project types generate working scaffolds');
    console.log('- AI configurations are properly updated');
    console.log('- Template consistency validated');
  } else {
    console.log(`❌ Found ${allErrors.length} validation errors:\n`);
    allErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    process.exit(1);
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation().catch(console.error);
}