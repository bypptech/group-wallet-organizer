export default function WorkflowSection() {
  return (
    <section id="workflow" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4" data-testid="workflow-title">Development Workflow</h2>
          <p className="text-muted-foreground text-lg" data-testid="workflow-subtitle">
            Follow VibeKit procedures → Execute with Tsumiki commands
          </p>
        </div>

        <div className="space-y-8">
          <div className="grid gap-6">
            <div className="flex items-start space-x-4 feature-card transition-smooth border border-border bg-card rounded-lg p-6" data-testid="workflow-step-1">
              <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-semibold">1</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Specification Definition</h3>
                <p className="text-muted-foreground mb-3">Create comprehensive requirements and design documents using AI assistance</p>
                <div className="code-font text-sm bg-muted/50 p-3 rounded border">
                  <span className="text-accent">$</span> kairo-requirements → kairo-design → kairo-tasks
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4 feature-card transition-smooth border border-border bg-card rounded-lg p-6" data-testid="workflow-step-2">
              <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-semibold">2</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">TDD Implementation</h3>
                <p className="text-muted-foreground mb-3">Test-driven development cycle with automated Red/Green/Refactor</p>
                <div className="code-font text-sm bg-muted/50 p-3 rounded border">
                  <span className="text-accent">$</span> tdd-requirements → tdd-testcases → tdd-red/green/refactor
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4 feature-card transition-smooth border border-border bg-card rounded-lg p-6" data-testid="workflow-step-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-semibold">3</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Legacy Code Integration</h3>
                <p className="text-muted-foreground mb-3">Reverse engineer existing codebases into specifications and tests</p>
                <div className="code-font text-sm bg-muted/50 p-3 rounded border">
                  <span className="text-accent">$</span> rev-requirements / rev-testcases
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-8 border border-border" data-testid="workflow-visualization">
            <h3 className="font-semibold text-lg mb-6 text-center">Complete Development Flow</h3>
            <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
              <div className="bg-primary/20 text-primary px-3 py-2 rounded-lg">Concept</div>
              <i className="fas fa-arrow-right text-muted-foreground"></i>
              <div className="bg-accent/20 text-accent px-3 py-2 rounded-lg">Requirements</div>
              <i className="fas fa-arrow-right text-muted-foreground"></i>
              <div className="bg-chart-3/20 text-chart-3 px-3 py-2 rounded-lg">Design</div>
              <i className="fas fa-arrow-right text-muted-foreground"></i>
              <div className="bg-chart-4/20 text-chart-4 px-3 py-2 rounded-lg">Tasks</div>
              <i className="fas fa-arrow-right text-muted-foreground"></i>
              <div className="bg-chart-5/20 text-chart-5 px-3 py-2 rounded-lg">TDD Implementation</div>
              <i className="fas fa-arrow-right text-muted-foreground"></i>
              <div className="bg-primary/20 text-primary px-3 py-2 rounded-lg">Deployment</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
