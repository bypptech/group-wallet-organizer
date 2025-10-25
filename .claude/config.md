# Claude AI Configuration for Tsumiki × Web3AIVibeCodingKit Integration

## Overview

This configuration file defines how Claude AI should be utilized within the Tsumiki × Web3AIVibeCodingKit integrated development environment. Claude is primarily used for implementation, coding, debugging, and refactoring tasks.

## Role Assignment

**Primary Responsibilities:**
- Code implementation and generation
- Debugging and error resolution
- Code refactoring and optimization
- Smart contract development
- Frontend component creation
- Test implementation

**Secondary Responsibilities:**
- Code review and quality assessment
- Documentation generation from code
- Architecture validation
- Performance optimization suggestions

## Configuration Settings

### Model Selection
- **Primary Model**: Claude 3.5 Sonnet (for complex coding tasks)
- **Fallback Model**: Claude 3 Haiku (for simpler, faster tasks)
- **Specialized Tasks**: Claude 3 Opus (for critical smart contract development)

### Context Management
- **Max Context Window**: Utilize full context window efficiently
- **Context Refresh**: Every 50 interactions or when context becomes stale
- **Priority Context**: 
  1. Current task requirements
  2. Project architecture and constraints
  3. Existing codebase structure
  4. Quality standards and coding conventions

### Custom Instructions

#### General Coding Guidelines
