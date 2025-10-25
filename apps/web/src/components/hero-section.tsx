import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const handleQuickStart = () => {
    const target = document.querySelector('#setup');
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleDocumentation = () => {
    window.open('https://github.com/bypptech/Web3AIVibeCodingKit/blob/main/README.md', '_blank');
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 animated-gradient opacity-10"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="hero-title">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AI-Driven Web3</span><br />
            Development Framework
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto" data-testid="hero-description">
            Unified integration of Tsumiki's AI-powered TDD commands and Web3AIVibeCodingKit's comprehensive Web3 development templates. 
            Build decentralized applications with specification-first, test-driven development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-primary text-primary-foreground px-8 py-3 hover:bg-primary/90 transition-smooth"
              data-testid="button-quick-start"
              onClick={handleQuickStart}
            >
              <i className="fas fa-rocket mr-2"></i>Quick Start
            </Button>
            <Button 
              variant="outline"
              className="border-border bg-card text-card-foreground px-8 py-3 hover:bg-muted transition-smooth"
              data-testid="button-documentation"
              onClick={handleDocumentation}
            >
              <i className="fas fa-book mr-2"></i>Documentation
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
