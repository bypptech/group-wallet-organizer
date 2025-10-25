# Tsumiki × Web3AIVibeCodingKit Integration Documentation

This directory contains comprehensive documentation for the unified AI-driven Web3 development framework that combines Tsumiki's TDD commands with Web3AIVibeCodingKit's templates and procedures.

## Documentation Structure

### 📋 Specifications (`specs/`)
- **requirements-template.md** - Template for project requirements definition
- **reverse-requirements.md** - Generated requirements from existing codebases
- **reverse-test-specs.md** - Generated test specifications

### 🏗️ Design Documentation (`design/`)
- **architecture-template.md** - Template for system architecture documentation
- **reverse-design.md** - Generated design documentation from code analysis

### 📝 Templates (`templates/`)
- Ready-to-use templates for common Web3 development patterns
- Smart contract templates
- Frontend component templates
- Testing framework templates

### 📚 Examples (`examples/`)
- **simple-dex/** - Complete example of building a DEX using the framework
- Additional example projects demonstrating different patterns

### 📊 Task Management (`tasks/`)
- **task-template.md** - Template for structured task breakdown
- **reverse-tasks.md** - Generated task breakdowns from existing projects
- Task templates for different development phases

## Key Features

### AI-Driven Development
- **Specification-First Approach**: Always start with comprehensive specifications
- **Multi-Model Integration**: Use different AI models for different tasks
- **Quality Assurance**: Built-in quality checks and validation

### Web3 Specialization
- **Smart Contract Focus**: Specialized templates and patterns for blockchain development
- **Security-First**: Security considerations built into every template
- **Gas Optimization**: Performance optimization guidance throughout

### TDD Integration
- **Red-Green-Refactor**: Automated TDD cycle management
- **Comprehensive Testing**: Templates for unit, integration, and E2E testing
- **Quality Metrics**: Built-in quality measurement and reporting

## Getting Started

1. **Initialize Your Project**
   ```bash
   ./scripts/spec-init.sh
   ```

2. **Define Requirements**
   - Use templates in `specs/` directory
   - Run `@kairo-requirements` for AI assistance

3. **Create Design Documentation**
   - Use templates in `design/` directory
   - Run `@kairo-design` for technical design generation

4. **Start Development**
   - Use `./scripts/tdd-cycle.sh` for guided TDD
   - Follow the comprehensive development workflow

## Templates Usage

### Requirements Template
Located at `specs/requirements-template.md`, this template provides a comprehensive structure for defining project requirements including:
- Project overview and goals
- Functional and non-functional requirements
- User stories and acceptance criteria
- Technical constraints and dependencies

### Architecture Template
Located at `design/architecture-template.md`, this template helps document:
- System architecture and component breakdown
- Data flow and interactions
- Security considerations
- Deployment strategy

## Best Practices

### Documentation Maintenance
- Keep specifications updated throughout development
- Use version control for all documentation
- Regular reviews and validation with stakeholders
- Cross-reference between specifications and implementation

### Quality Standards
- Follow the principles outlined in `../QUALITY.md`
- Use AI tools for validation and review
- Maintain high test coverage
- Regular security audits for smart contracts

### AI Tool Integration
- Use Gemini for requirements definition and review
- Use Claude for implementation and coding
- Cross-validate outputs between different AI models
- Maintain consistent project context across tools

## Integration with Development Workflow

### Specification Phase
1. Start with templates in this directory
2. Use AI tools to generate detailed specifications
3. Validate with stakeholders and domain experts
4. Create task breakdown using generated specifications

### Implementation Phase
1. Use specifications as input for TDD cycles
2. Maintain living documentation that evolves with code
3. Generate additional documentation from implementation
4. Regular quality checks and validation

### Maintenance Phase
1. Use reverse engineering tools for legacy code integration
2. Keep documentation synchronized with code changes
3. Regular reviews and updates of specifications
4. Continuous improvement of templates and processes

## Advanced Usage

### Custom Templates
- Create project-specific templates based on your needs
- Extend existing templates with domain-specific requirements
- Share templates across team and projects

### Integration Patterns
- API-first development with OpenAPI specifications
- Event-driven architecture documentation
- Microservices design patterns
- Cross-chain interaction specifications

### Automation
- Use scripts to automate documentation generation
- Integrate with CI/CD pipelines for quality checks
- Automated validation of specifications against implementation

## Support and Resources

- **Integration Guide**: `integration-guide.md` - Comprehensive usage guide
- **Quality Standards**: `../QUALITY.md` - Quality principles and standards
- **Scripts**: `../scripts/` - Automation and workflow scripts
- **AI Configurations**: `../.claude/`, `../.gemini/`, `../.kiro/` - AI tool configurations

## Contributing

When adding new templates or documentation:
1. Follow the established structure and naming conventions
2. Include comprehensive examples and usage instructions
3. Test templates with real projects
4. Update this README with new additions
5. Maintain cross-references between related documents

---

For questions, issues, or contributions, please refer to the main project repository and community guidelines.
