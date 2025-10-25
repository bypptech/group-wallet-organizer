export default function IntegrationOverview() {
  return (
    <section id="overview" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4" data-testid="overview-title">Integration Overview</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="overview-description">
            Combining the power of AI-assisted development with Web3 expertise
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="gradient-border" data-testid="card-tsumiki">
            <div className="gradient-border-inner p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-cubes text-primary text-xl"></i>
                </div>
                <h3 className="text-2xl font-semibold">Tsumiki Framework</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                AI-driven development framework providing TDD commands, specification generation, and reverse engineering capabilities.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center"><i className="fas fa-check text-accent mr-2"></i>kairo-* commands for comprehensive workflows</li>
                <li className="flex items-center"><i className="fas fa-check text-accent mr-2"></i>tdd-* commands for test-driven development</li>
                <li className="flex items-center"><i className="fas fa-check text-accent mr-2"></i>rev-* commands for reverse engineering</li>
              </ul>
            </div>
          </div>
          
          <div className="gradient-border" data-testid="card-vibekit">
            <div className="gradient-border-inner p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-ethereum text-accent text-xl"></i>
                </div>
                <h3 className="text-2xl font-semibold">Web3AIVibeCodingKit</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Comprehensive Web3 development starter kit with templates, guides, and best practices for dApp development.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center"><i className="fas fa-check text-accent mr-2"></i>Smart contract templates and patterns</li>
                <li className="flex items-center"><i className="fas fa-check text-accent mr-2"></i>Frontend development guidelines</li>
                <li className="flex items-center"><i className="fas fa-check text-accent mr-2"></i>E2E testing frameworks</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-8 border border-border" data-testid="integration-benefits">
          <h3 className="text-xl font-semibold mb-6 text-center">Integration Benefits</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center" data-testid="benefit-ai-powered">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-magic text-primary text-2xl"></i>
              </div>
              <h4 className="font-semibold mb-2">AI-Powered Development</h4>
              <p className="text-sm text-muted-foreground">Leverage AI for specifications, testing, and implementation guidance</p>
            </div>
            <div className="text-center" data-testid="benefit-unified">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-layer-group text-accent text-2xl"></i>
              </div>
              <h4 className="font-semibold mb-2">Unified Architecture</h4>
              <p className="text-sm text-muted-foreground">Single framework combining templates and execution commands</p>
            </div>
            <div className="text-center" data-testid="benefit-rapid">
              <div className="w-16 h-16 bg-chart-3/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-rocket text-chart-3 text-2xl"></i>
              </div>
              <h4 className="font-semibold mb-2">Rapid Prototyping</h4>
              <p className="text-sm text-muted-foreground">From concept to deployment with guided workflows</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
