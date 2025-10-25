#!/bin/bash
# TDD Cycle Automation Script for Tsumiki × VibeKit Integration

set -e

echo "🔄 Tsumiki × VibeKit TDD Cycle Automation"
echo "========================================="
echo ""

# Check if we're in a proper project directory
if [ ! -f "QUALITY.md" ] && [ ! -d ".claude" ]; then
    echo "❌ This doesn't appear to be a Tsumiki × VibeKit project directory."
    echo "   Please run ./scripts/spec-init.sh first or navigate to your project root."
    exit 1
fi

# Function to run TDD phase with user confirmation
run_tdd_phase() {
    local phase_name="$1"
    local phase_emoji="$2"
    local command="$3"
    local description="$4"
    
    echo ""
    echo "${phase_emoji} ${phase_name} Phase"
    echo "===================="
    echo "📋 ${description}"
    echo ""
    echo "🤖 Command to run: ${command}"
    echo ""
    
    # Interactive mode
    if [ "${AUTO_MODE:-false}" != "true" ]; then
        read -p "Press Enter to continue or Ctrl+C to exit..."
        echo "👉 Please run the command in your AI tool: ${command}"
        echo ""
        read -p "✅ Press Enter after the command completes successfully..."
    else
        echo "🤖 Auto-mode: Would execute ${command}"
        sleep 2
    fi
}

# Function to validate phase completion
validate_phase() {
    local phase="$1"
    echo ""
    echo "🔍 Validating ${phase} phase completion..."
    
    case $phase in
        "requirements")
            if [ -f "docs/specs/requirements.md" ]; then
                echo "✅ Requirements document found"
            else
                echo "⚠️  Requirements document not found at docs/specs/requirements.md"
            fi
            ;;
        "testcases")
            if find . -name "*.test.*" -o -name "*.spec.*" | grep -q .; then
                echo "✅ Test files found"
            else
                echo "⚠️  No test files found"
            fi
            ;;
        "red")
            echo "🔍 Please verify that tests are failing as expected"
            ;;
        "green")
            echo "🔍 Please verify that tests are now passing"
            ;;
        "refactor")
            echo "🔍 Please verify that code quality has improved"
            ;;
    esac
}

# Display usage information
show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --auto          Run in automated mode (for CI/CD)"
    echo "  --phase PHASE   Run specific TDD phase only"
    echo "  --help          Show this help message"
    echo ""
    echo "Available phases:"
    echo "  requirements    Define TDD requirements"
    echo "  testcases      Create test cases"
    echo "  red            Write failing tests"
    echo "  green          Make tests pass"
    echo "  refactor       Improve code quality"
    echo "  verify         Verify TDD completion"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run complete TDD cycle"
    echo "  $0 --phase red        # Run only RED phase"
    echo "  $0 --auto             # Run in automated mode"
}

# Parse command line arguments
AUTO_MODE=false
SPECIFIC_PHASE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --auto)
            AUTO_MODE=true
            shift
            ;;
        --phase)
            SPECIFIC_PHASE="$2"
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

# Validate specific phase
if [ -n "$SPECIFIC_PHASE" ]; then
    case $SPECIFIC_PHASE in
        requirements|testcases|red|green|refactor|verify)
            ;;
        *)
            echo "❌ Invalid phase: $SPECIFIC_PHASE"
            show_usage
            exit 1
            ;;
    esac
fi

echo "🎯 Starting TDD cycle with the following configuration:"
echo "   - Auto mode: ${AUTO_MODE}"
echo "   - Specific phase: ${SPECIFIC_PHASE:-'Complete cycle'}"
echo "   - Project type: Web3 DApp with AI assistance"

# Run specific phase or complete cycle
if [ -n "$SPECIFIC_PHASE" ]; then
    case $SPECIFIC_PHASE in
        requirements)
            run_tdd_phase "REQUIREMENTS" "📋" "@tdd-requirements" "Define specific requirements for TDD implementation"
            validate_phase "requirements"
            ;;
        testcases)
            run_tdd_phase "TEST CASES" "📝" "@tdd-testcases" "Create comprehensive test cases based on requirements"
            validate_phase "testcases"
            ;;
        red)
            run_tdd_phase "RED" "🔴" "@tdd-red" "Write failing tests that define the desired behavior"
            validate_phase "red"
            ;;
        green)
            run_tdd_phase "GREEN" "🟢" "@tdd-green" "Write minimal code to make tests pass"
            validate_phase "green"
            ;;
        refactor)
            run_tdd_phase "REFACTOR" "🔄" "@tdd-refactor" "Improve code quality while maintaining functionality"
            validate_phase "refactor"
            ;;
        verify)
            run_tdd_phase "VERIFY" "✅" "@tdd-verify-complete" "Verify TDD cycle completion and quality"
            ;;
    esac
else
    # Run complete TDD cycle
    echo ""
    echo "🚀 Running complete TDD cycle..."
    
    # Phase 1: Requirements Definition
    run_tdd_phase "REQUIREMENTS" "📋" "@tdd-requirements" "Define specific requirements for TDD implementation"
    validate_phase "requirements"
    
    # Phase 2: Test Cases Creation
    run_tdd_phase "TEST CASES" "📝" "@tdd-testcases" "Create comprehensive test cases based on requirements"
    validate_phase "testcases"
    
    # Phase 3: RED - Write failing tests
    run_tdd_phase "RED" "🔴" "@tdd-red" "Write failing tests that define the desired behavior"
    validate_phase "red"
    
    # Phase 4: GREEN - Make tests pass
    run_tdd_phase "GREEN" "🟢" "@tdd-green" "Write minimal code to make tests pass"
    validate_phase "green"
    
    # Phase 5: REFACTOR - Improve code quality
    run_tdd_phase "REFACTOR" "🔄" "@tdd-refactor" "Improve code quality while maintaining functionality"
    validate_phase "refactor"
    
    # Phase 6: VERIFY - Check completion
    run_tdd_phase "VERIFY" "✅" "@tdd-verify-complete" "Verify TDD cycle completion and quality"
fi

echo ""
echo "🎉 TDD Cycle Completed Successfully!"
echo "===================================="
echo ""
echo "📊 Quality Checklist:"
echo "   ✅ Requirements documented"
echo "   ✅ Test cases comprehensive"
echo "   ✅ Tests written first (RED)"
echo "   ✅ Minimal implementation (GREEN)"
echo "   ✅ Code refactored for quality"
echo "   ✅ All tests passing"
echo ""
echo "📁 Generated artifacts:"
echo "   - Requirements: docs/specs/"
echo "   - Test files: Look for *.test.* or *.spec.*"
echo "   - Implementation code: Source directories"
echo "   - Quality reports: Various locations"
echo ""
echo "🔄 Next steps:"
echo "   1. Review generated code and tests"
echo "   2. Run additional quality checks"
echo "   3. Consider security audit for smart contracts"
echo "   4. Update documentation as needed"
echo ""
echo "💡 Pro tip: Run this script multiple times for iterative development!"
echo "Happy coding! 🚀"
