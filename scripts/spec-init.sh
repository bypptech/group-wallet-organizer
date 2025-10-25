#!/bin/bash

# Tsumiki × VibeKit Integration - Specification Initialization Script
# This script sets up the unified folder structure and initializes AI configurations

set -e

echo "🚀 Initializing Tsumiki × VibeKit Integration Environment"
echo "========================================================="

# Create unified directory structure
echo "📁 Creating unified directory structure..."

# Create main directories
mkdir -p docs/{specs,design,templates,examples}
mkdir -p scripts/{workflows,utils}
mkdir -p .claude/{commands,agents}
mkdir -p .gemini/{prompts,config}
mkdir -p .kiro/{templates,rules}

echo "✅ Directory structure created successfully"

# Copy VibeKit templates to docs
echo "📋 Setting up VibeKit specification templates..."

# Create basic specification templates
cat > docs/specs/requirements-template.md << 'EOF'
# Requirements Specification Template

## Project Overview
- **Project Name**: 
- **Description**: 
- **Target Users**: 
- **Success Criteria**: 

## Functional Requirements
### Core Features
1. 
2. 
3. 

### User Stories
- As a [user type], I want [goal] so that [benefit]

## Non-Functional Requirements
### Performance
- 
### Security
- 
### Scalability
- 

## Technical Constraints
- Blockchain Network: 
- Programming Languages: 
- Frameworks: 
- External Dependencies: 

## Acceptance Criteria
- [ ] Requirement 1 met
- [ ] Requirement 2 met
- [ ] All tests passing
- [ ] Security audit complete
EOF

cat > docs/design/architecture-template.md << 'EOF'
# Architecture Design Template

## System Architecture
### High-Level Overview

### Component Architecture
- Smart Contract Layer
- Frontend Application Layer  
- Web3 Integration Layer
- Testing Framework Layer

### Data Flow
1. User Interaction → Frontend
2. Frontend → Web3 Provider → Blockchain
3. Blockchain → Event Emission → Frontend Update

### Security Architecture
- Smart Contract Security Patterns
- Frontend Security Measures
- Private Key Management
- Transaction Security

### Deployment Architecture
- Development Environment Setup
- Testing Network Configuration
- Production Deployment Strategy
- Monitoring and Maintenance

## Implementation Guidelines
- Follow TDD principles
- Use AI assistance for design validation
- Implement comprehensive testing
- Document all architectural decisions
EOF

echo "✅ VibeKit templates created successfully"

# Create Tsumiki configuration templates
echo "⚙️ Setting up Tsumiki AI configurations..."

# Create task management structure
mkdir -p docs/tasks

cat > docs/tasks/task-template.md << 'EOF'
# Task Breakdown Template

## Project Phase: [Phase Name]

### Task List
1. **Task 1**
   - Description: 
   - Acceptance Criteria: 
   - Dependencies: 
   - Estimated Effort: 

2. **Task 2**
   - Description: 
   - Acceptance Criteria: 
   - Dependencies: 
   - Estimated Effort: 

### Definition of Done
- [ ] Requirements validated
- [ ] Tests written and passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Integration tested
EOF

echo "✅ Task management structure created"

# Initialize AI configurations
echo "🤖 Initializing AI tool configurations..."

cat > .claude/commands/tdd-commands.md << 'EOF'
# TDD Commands for Claude

## Command Reference
- @tdd-requirements: Define TDD-specific requirements
- @tdd-testcases: Create comprehensive test cases
- @tdd-red: Write failing tests (RED phase)
- @tdd-green: Implement minimal passing code (GREEN phase)
- @tdd-refactor: Improve code quality (REFACTOR phase)
EOF

cat > .gemini/prompts/kairo-prompts.md << 'EOF'
# Kairo Workflow Prompts for Gemini

## Workflow Commands
- @kairo-requirements: Generate detailed requirements from concepts
- @kairo-design: Create technical design documents
- @kairo-tasks: Break down into implementation tasks
- @kairo-implement: Execute implementation with TDD guidance
EOF

cat > .kiro/rules/quality-gates.md << 'EOF'
# Quality Gates Configuration

## Code Quality Requirements
- Test Coverage: >90%
- Security Audit: Required for smart contracts
- Gas Optimization: Required verification
- Documentation: Comprehensive inline docs

## AI TDD Integration Rules
1. Specification-first development mandatory
2. Test-first implementation required
3. Continuous quality improvement
4. Multi-AI validation recommended
EOF

echo "✅ AI configurations initialized"

echo ""
echo "🎉 Tsumiki × VibeKit Integration Environment Ready!"
echo "=================================================="
echo ""
echo "📁 Created directory structure:"
echo "   ✅ /docs with specs/, design/, templates/, examples/, tasks/"
echo "   ✅ /scripts with workflow automation"
echo "   ✅ /.claude, /.gemini, /.kiro with unified configurations"
echo ""
echo "📋 Next steps:"
echo "   1. Review created templates in docs/"
echo "   2. Customize AI configurations for your project"  
echo "   3. Start development with: @kairo-requirements"
echo "   4. Follow TDD workflow with: ./scripts/tdd-cycle.sh"
echo ""
echo "💡 Happy Web3 AI TDD development!"
