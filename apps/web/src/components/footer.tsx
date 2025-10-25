export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-cube text-primary-foreground"></i>
              </div>
              <span className="text-xl font-semibold" data-testid="footer-brand">Tsumiki × VibeKit</span>
            </div>
            <p className="text-muted-foreground mb-4" data-testid="footer-description">
              Unified AI-driven Web3 development framework combining specification-first development with test-driven implementation.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://github.com/bypptech/Web3AIVibeCodingKit" 
                className="text-muted-foreground hover:text-primary transition-smooth"
                data-testid="link-github"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-github text-xl"></i>
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-smooth"
                data-testid="link-discord"
              >
                <i className="fab fa-discord text-xl"></i>
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-smooth"
                data-testid="link-twitter"
              >
                <i className="fab fa-twitter text-xl"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-smooth" data-testid="link-documentation">Documentation</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-smooth" data-testid="link-api-reference">API Reference</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-smooth" data-testid="link-examples">Examples</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-smooth" data-testid="link-community">Community</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-smooth" data-testid="link-getting-started">Getting Started</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-smooth" data-testid="link-troubleshooting">Troubleshooting</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-smooth" data-testid="link-bug-reports">Bug Reports</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-smooth" data-testid="link-feature-requests">Feature Requests</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p data-testid="copyright">&copy; 2025 Tsumiki × Web3AIVibeCodingKit Integration. MIT License.</p>
        </div>
      </div>
    </footer>
  );
}
