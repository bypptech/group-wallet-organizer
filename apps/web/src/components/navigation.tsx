import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Navigation() {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let currentSection = '';
      
      sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop <= 100) {
          currentSection = section.getAttribute('id') || '';
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-cube text-primary-foreground" data-testid="logo-icon"></i>
              </div>
              <span className="text-xl font-semibold" data-testid="brand-name">Tsumiki × VibeKit</span>
            </div>
            <div className="hidden md:flex items-center space-x-1 ml-8">
              {[
                { href: "#overview", label: "Overview" },
                { href: "#integration", label: "Integration" },
                { href: "#workflow", label: "Workflow" },
                { href: "#commands", label: "Commands" },
                { href: "#setup", label: "Setup" }
              ].map(({ href, label }) => (
                <button
                  key={href}
                  onClick={() => handleNavClick(href)}
                  className={`nav-item px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
                    activeSection === href.slice(1) ? 'bg-primary/20 text-primary' : ''
                  }`}
                  data-testid={`nav-${label.toLowerCase()}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-smooth"
              data-testid="button-github"
              onClick={() => window.open('https://github.com/bypptech/Web3AIVibeCodingKit', '_blank')}
            >
              <i className="fab fa-github mr-2"></i>View on GitHub
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
