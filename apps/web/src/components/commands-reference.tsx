export default function CommandsReference() {
  return (
    <section id="commands" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4" data-testid="commands-title">Command Reference</h2>
          <p className="text-muted-foreground text-lg" data-testid="commands-description">
            Comprehensive command suite for AI-driven Web3 development
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="bg-card rounded-xl border border-border overflow-hidden" data-testid="commands-kairo">
            <div className="bg-primary/10 p-4 border-b border-border">
              <h3 className="font-semibold text-lg flex items-center">
                <i className="fas fa-cogs text-primary mr-2"></i>
                Kairo Commands
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Comprehensive development flow</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="code-font text-sm">
                <div className="text-accent mb-1">kairo-requirements</div>
                <div className="text-muted-foreground text-xs">Generate detailed requirements from concepts</div>
              </div>
              <div className="code-font text-sm">
                <div className="text-accent mb-1">kairo-design</div>
                <div className="text-muted-foreground text-xs">Create technical design documents</div>
              </div>
              <div className="code-font text-sm">
                <div className="text-accent mb-1">kairo-tasks</div>
                <div className="text-muted-foreground text-xs">Break down into implementation tasks</div>
              </div>
              <div className="code-font text-sm">
                <div className="text-accent mb-1">kairo-implement</div>
                <div className="text-muted-foreground text-xs">Execute implementation with TDD</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden" data-testid="commands-tdd">
            <div className="bg-accent/10 p-4 border-b border-border">
              <h3 className="font-semibold text-lg flex items-center">
                <i className="fas fa-vial text-accent mr-2"></i>
                TDD Commands
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Test-driven development cycle</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="code-font text-sm">
                <div className="text-accent mb-1">tdd-requirements</div>
                <div className="text-muted-foreground text-xs">Define TDD-specific requirements</div>
              </div>
              <div className="code-font text-sm">
                <div className="text-accent mb-1">tdd-testcases</div>
                <div className="text-muted-foreground text-xs">Create comprehensive test cases</div>
              </div>
              <div className="code-font text-sm">
                <div className="text-accent mb-1">tdd-red/green/refactor</div>
                <div className="text-muted-foreground text-xs">Execute TDD cycle phases</div>
              </div>
              <div className="code-font text-sm">
                <div className="text-accent mb-1">tdd-verify-complete</div>
                <div className="text-muted-foreground text-xs">Validate TDD completion</div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden" data-testid="commands-reverse">
            <div className="bg-chart-4/10 p-4 border-b border-border">
              <h3 className="font-semibold text-lg flex items-center">
                <i className="fas fa-history text-chart-4 mr-2"></i>
                Reverse Engineering
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Extract specs from existing code</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="code-font text-sm">
                <div className="text-accent mb-1">rev-requirements</div>
                <div className="text-muted-foreground text-xs">Generate requirements from code</div>
              </div>
              <div className="code-font text-sm">
                <div className="text-accent mb-1">rev-design</div>
                <div className="text-muted-foreground text-xs">Extract design documentation</div>
              </div>
              <div className="code-font text-sm">
                <div className="text-accent mb-1">rev-tasks</div>
                <div className="text-muted-foreground text-xs">Create task lists from codebase</div>
              </div>
              <div className="code-font text-sm">
                <div className="text-accent mb-1">rev-specs</div>
                <div className="text-muted-foreground text-xs">Generate test specifications</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
