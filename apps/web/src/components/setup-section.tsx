export default function SetupSection() {
  return (
    <section id="setup" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4" data-testid="setup-title">Quick Setup</h2>
          <p className="text-muted-foreground text-lg" data-testid="setup-description">
            Get started with the integrated development environment in minutes
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6 mb-12">
            <div className="bg-card rounded-lg border border-border p-6" data-testid="setup-step-1">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold mr-3">1</span>
                Install Tsumiki Framework
              </h3>
              <div className="syntax-highlight rounded-lg p-4 code-font text-sm">
                <span className="text-muted-foreground"># Install the integrated framework</span><br />
                <span className="text-accent">npx</span> tsumiki install
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6" data-testid="setup-step-2">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold mr-3">2</span>
                Initialize Project Structure
              </h3>
              <div className="syntax-highlight rounded-lg p-4 code-font text-sm">
                <span className="text-muted-foreground"># Set up unified folder structure</span><br />
                <span className="text-accent">./scripts/</span>spec-init.sh<br />
                <span className="text-muted-foreground"># Creates /docs, /scripts, config folders</span>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6" data-testid="setup-step-3">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold mr-3">3</span>
                Start Development Workflow
              </h3>
              <div className="syntax-highlight rounded-lg p-4 code-font text-sm">
                <span className="text-muted-foreground"># Begin with requirements definition</span><br />
                <span className="text-accent">@</span>kairo-requirements<br />
                <span className="text-muted-foreground"># Follow the integrated workflow</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-8" data-testid="project-structure">
            <h3 className="font-semibold text-lg mb-6">Unified Project Structure</h3>
            <div className="code-font text-sm space-y-2">
              <div className="flex items-center">
                <i className="fas fa-folder text-accent mr-2"></i>
                <span className="text-foreground">/docs</span>
                <span className="text-muted-foreground ml-4"># VibeKit specs & design templates</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-folder text-accent mr-2"></i>
                <span className="text-foreground">/scripts</span>
                <span className="text-muted-foreground ml-4"># Tsumiki command wrappers</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-folder text-accent mr-2"></i>
                <span className="text-foreground">/.claude</span>
                <span className="text-muted-foreground ml-4"># AI agent configurations</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-folder text-accent mr-2"></i>
                <span className="text-foreground">/.gemini</span>
                <span className="text-muted-foreground ml-4"># Gemini AI settings</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-folder text-accent mr-2"></i>
                <span className="text-foreground">/.kiro</span>
                <span className="text-muted-foreground ml-4"># Kiro tool configurations</span>
              </div>
              <div className="flex items-center">
                <i className="fas fa-file text-chart-3 mr-2"></i>
                <span className="text-foreground">QUALITY.md</span>
                <span className="text-muted-foreground ml-4"># AI TDD principles</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
