#!/bin/bash
# Reverse Engineering Script for Tsumiki × VibeKit Integration

set -e

echo "🔍 Tsumiki × VibeKit Reverse Engineering Tool"
echo "=============================================="
echo ""

# Check if we're in a proper project directory
if [ ! -f "QUALITY.md" ] && [ ! -d ".claude" ]; then
    echo "❌ This doesn't appear to be a Tsumiki × VibeKit project directory."
    echo "   Please run ./scripts/spec-init.sh first or navigate to your project root."
    exit 1
fi

# Function to run reverse engineering command
run_reverse_command() {
    local phase_name="$1"
    local phase_emoji="$2"
    local command="$3"
    local description="$4"
    local output_path="$5"
    
    echo ""
    echo "${phase_emoji} ${phase_name}"
    echo "===================="
    echo "📋 ${description}"
    echo "📁 Output will be saved to: ${output_path}"
    echo ""
    echo "🤖 Command to run: ${command}"
    echo ""
    
    if [ "${AUTO_MODE:-false}" != "true" ]; then
        read -p "Press Enter to continue or Ctrl+C to exit..."
        echo "👉 Please run the command in your AI tool: ${command}"
        echo ""
        read -p "✅ Press Enter after the command completes and you've saved the output to ${output_path}..."
    else
        echo "🤖 Auto-mode: Would execute ${command}"
        sleep 2
    fi
    
    # Create output directory if it doesn't exist
    mkdir -p "$(dirname "$output_path")"
    
    # Validate output exists
    if [ -f "$output_path" ]; then
        echo "✅ Output file created: $output_path"
    else
        echo "⚠️  Output file not found: $output_path"
        echo "   Please ensure you saved the AI-generated content to this location"
    fi
}

# Function to analyze codebase
analyze_codebase() {
    echo "🔍 Analyzing existing codebase..."
    echo ""
    
    # Count different file types
    local js_files=$(find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
    local sol_files=$(find . -name "*.sol" 2>/dev/null | wc -l)
    local test_files=$(find . -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | wc -l)
    local doc_files=$(find . -name "*.md" 2>/dev/null | wc -l)
    
    echo "📊 Codebase Statistics:"
    echo "   - JavaScript/TypeScript files: $js_files"
    echo "   - Solidity contracts: $sol_files"
    echo "   - Test files: $test_files"
    echo "   - Documentation files: $doc_files"
    echo ""
    
    # Check for common frameworks
    if [ -f "package.json" ]; then
        echo "📦 Package.json found - Node.js project detected"
        if grep -q "react" package.json; then
            echo "   - React framework detected"
        fi
        if grep -q "hardhat\|truffle\|foundry" package.json; then
            echo "   - Web3 development framework detected"
        fi
    fi
    
    if [ -f "Cargo.toml" ]; then
        echo "🦀 Cargo.toml found - Rust project detected"
    fi
    
    if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
        echo "🐍 Python project detected"
    fi
    
    echo ""
}

# Function to create comprehensive reverse engineering report
create_report() {
    local report_file="docs/reverse-engineering-report.md"
    
    echo "📊 Creating comprehensive reverse engineering report..."
    
    cat > "$report_file" << EOF
# Reverse Engineering Report

Generated on: $(date)

## Project Analysis

### Codebase Overview
$(analyze_codebase)

### Reverse Engineering Process
This report documents the reverse engineering process for integrating existing code into the Tsumiki × VibeKit framework.

## Generated Artifacts

### Requirements Documentation
- **Location**: docs/specs/reverse-requirements.md
- **Status**: Generated from existing codebase
- **Description**: High-level requirements extracted from code analysis

### Design Documentation
- **Location**: docs/design/reverse-design.md
- **Status**: Generated from architectural analysis
- **Description**: System architecture and design patterns identified

### Task Breakdown
- **Location**: docs/tasks/reverse-tasks.md
- **Status**: Generated from development workflow analysis
- **Description**: Development tasks and priorities derived from codebase

### Test Specifications
- **Location**: docs/specs/reverse-test-specs.md
- **Status**: Generated from existing tests and code behavior
- **Description**: Comprehensive test specifications for existing functionality

## Quality Assessment

### Code Quality Metrics
- Test Coverage: [To be measured]
- Documentation Coverage: [To be assessed]
- Security Analysis: [To be performed]
- Performance Benchmarks: [To be established]

### Integration Readiness
- [ ] Requirements documentation complete
- [ ] Design documentation complete
- [ ] Task breakdown complete
- [ ] Test specifications complete
- [ ] Quality standards applied
- [ ] AI TDD principles integrated

## Next Steps

1. **Review Generated Documentation**
   - Validate requirements accuracy
   - Verify design documentation completeness
   - Check task prioritization

2. **Gap Analysis**
   - Identify missing functionality
   - Highlight technical debt
   - Note security concerns

3. **Integration Planning**
   - Plan TDD implementation for gaps
   - Schedule refactoring activities
   - Set quality improvement targets

4. **Implementation**
   - Use generated specs for TDD cycles
   - Apply Tsumiki × VibeKit workflows
   - Maintain quality standards

## Resources

- [Tsumiki × VibeKit Integration Guide](integration-guide.md)
- [Quality Standards](../QUALITY.md)
- [TDD Workflow Scripts](../scripts/)

---
Generated by Tsumiki × VibeKit Reverse Engineering Tool
EOF

    echo "✅ Report created: $report_file"
}

# Display usage information
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --auto              Run in automated mode (for CI/CD)"
    echo "  --type TYPE         Specify reverse engineering type"
    echo "  --output-dir DIR    Specify output directory (default: docs/)"
    echo "  --help              Show this help message"
    echo ""
    echo "Available types:"
    echo "  requirements        Extract requirements from existing code"
    echo "  design             Extract design documentation"
    echo "  tasks              Generate task breakdown"
    echo "  specs              Generate test specifications"
    echo "  complete           Run complete reverse engineering (default)"
    echo ""
    echo "Examples:"
    echo "  $0                           # Complete reverse engineering"
    echo "  $0 --type requirements       # Extract requirements only"
    echo "  $0 --auto --type specs       # Generate test specs in auto mode"
    echo "  $0 --output-dir ./output     # Use custom output directory"
}

# Parse command line arguments
AUTO_MODE=false
REVERSE_TYPE="complete"
OUTPUT_DIR="docs"

while [[ $# -gt 0 ]]; do
    case $1 in
        --auto)
            AUTO_MODE=true
            shift
            ;;
        --type)
            REVERSE_TYPE="$2"
            shift 2
            ;;
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate reverse engineering type
case $REVERSE_TYPE in
    requirements|design|tasks|specs|complete)
        ;;
    *)
        echo "❌ Invalid reverse engineering type: $REVERSE_TYPE"
        show_usage
        exit 1
        ;;
esac

echo "🎯 Starting reverse engineering with configuration:"
echo "   - Type: $REVERSE_TYPE"
echo "   - Auto mode: $AUTO_MODE"
echo "   - Output directory: $OUTPUT_DIR"
echo "   - Target: Existing codebase integration"

# Analyze codebase first
analyze_codebase

# Create output directories
mkdir -p "$OUTPUT_DIR"/{specs,design,tasks}

# Run reverse engineering based on type
case $REVERSE_TYPE in
    requirements)
        run_reverse_command \
            "Requirements Extraction" \
            "📋" \
            "@rev-requirements" \
            "Extract requirements and specifications from existing codebase" \
            "$OUTPUT_DIR/specs/reverse-requirements.md"
        ;;
        
    design)
        run_reverse_command \
            "Design Documentation" \
            "🏗️" \
            "@rev-design" \
            "Generate design documentation from architectural analysis" \
            "$OUTPUT_DIR/design/reverse-design.md"
        ;;
        
    tasks)
        run_reverse_command \
            "Task Breakdown" \
            "📝" \
            "@rev-tasks" \
            "Create development task list from codebase analysis" \
            "$OUTPUT_DIR/tasks/reverse-tasks.md"
        ;;
        
    specs)
        run_reverse_command \
            "Test Specifications" \
            "🧪" \
            "@rev-specs" \
            "Generate comprehensive test specifications from existing code" \
            "$OUTPUT_DIR/specs/reverse-test-specs.md"
        ;;
        
    complete)
        echo ""
        echo "🚀 Running complete reverse engineering process..."
        
        # Step 1: Extract requirements
        run_reverse_command \
            "Requirements Extraction" \
            "📋" \
            "@rev-requirements" \
            "Extract requirements and specifications from existing codebase" \
            "$OUTPUT_DIR/specs/reverse-requirements.md"
        
        # Step 2: Generate design documentation
        run_reverse_command \
            "Design Documentation" \
            "🏗️" \
            "@rev-design" \
            "Generate design documentation from architectural analysis" \
            "$OUTPUT_DIR/design/reverse-design.md"
        
        # Step 3: Create task breakdown
        run_reverse_command \
            "Task Breakdown" \
            "📝" \
            "@rev-tasks" \
            "Create development task list from codebase analysis" \
            "$OUTPUT_DIR/tasks/reverse-tasks.md"
        
        # Step 4: Generate test specifications
        run_reverse_command \
            "Test Specifications" \
            "🧪" \
            "@rev-specs" \
            "Generate comprehensive test specifications from existing code" \
            "$OUTPUT_DIR/specs/reverse-test-specs.md"
        
        # Step 5: Create comprehensive report
        create_report
        ;;
esac

echo ""
echo "🎉 Reverse Engineering Process Completed!"
echo "=========================================="
echo ""
echo "📁 Generated Documentation:"
case $REVERSE_TYPE in
    requirements)
        echo "   ✅ Requirements: $OUTPUT_DIR/specs/reverse-requirements.md"
        ;;
    design)
        echo "   ✅ Design docs: $OUTPUT_DIR/design/reverse-design.md"
        ;;
    tasks)
        echo "   ✅ Task breakdown: $OUTPUT_DIR/tasks/reverse-tasks.md"
        ;;
    specs)
        echo "   ✅ Test specifications: $OUTPUT_DIR/specs/reverse-test-specs.md"
        ;;
    complete)
        echo "   ✅ Requirements: $OUTPUT_DIR/specs/reverse-requirements.md"
        echo "   ✅ Design docs: $OUTPUT_DIR/design/reverse-design.md"
        echo "   ✅ Task breakdown: $OUTPUT_DIR/tasks/reverse-tasks.md"
        echo "   ✅ Test specifications: $OUTPUT_DIR/specs/reverse-test-specs.md"
        echo "   ✅ Comprehensive report: docs/reverse-engineering-report.md"
        ;;
esac

echo ""
echo "🔄 Next Steps:"
echo "   1. Review generated documentation for accuracy"
echo "   2. Validate extracted requirements with stakeholders"
echo "   3. Use generated specs as input for TDD workflow"
echo "   4. Run ./scripts/tdd-cycle.sh for iterative development"
echo "   5. Apply quality standards from QUALITY.md"
echo ""
echo "💡 Integration Tips:"
echo "   - Use @kairo-implement with generated specifications"
echo "   - Run TDD cycles for identified gaps and improvements"
echo "   - Consider security audits for smart contract code"
echo "   - Update documentation as development progresses"
echo ""
echo "Happy reverse engineering! 🔍"
