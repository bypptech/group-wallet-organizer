# Tsumiki × Web3AIVibeCodingKit Integration

## Overview

This project is an AI-driven Web3 development framework that unifies Tsumiki's specification-first TDD approach with Web3AIVibeCodingKit's comprehensive blockchain development templates. The framework provides a complete development workflow from requirements definition through implementation, with built-in AI assistance at every stage. It combines test-driven development principles with Web3-specific patterns to accelerate decentralized application development while maintaining high code quality and security standards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern React 18 application with strict TypeScript configuration
- **Vite Build System**: Fast development server with HMR and optimized production builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query for server state management with React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with CSS variables for theming and custom design system

### Backend Architecture
- **Hono (Fetch API-based)**: Fast, lightweight REST API built on Web-standard Request/Response
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Storage Abstraction**: Interface-based storage layer with in-memory implementation for development
- **Auth Strategy**: Token/Cookie-based stateless approach (Edge/Node対応)
- **API Design**: Resource-based endpoints for integrations and workflows with proper HTTP status codes

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless for scalable cloud hosting
- **ORM**: Drizzle ORM for type-safe queries and schema management
- **Schema Design**: Three main entities - users, integrations, and workflows with UUID primary keys
- **Migration System**: Drizzle Kit for database schema migrations and versioning

### AI Integration Framework
- **Multi-Model Strategy**: Specialized AI tool configuration for different development phases
- **Claude Integration**: Primary implementation assistant for coding, debugging, and refactoring
- **Gemini Integration**: Requirements analysis, system design, and cross-validation
- **Context Management**: Rich context provision with incremental building and validation
- **Quality Assurance**: AI-driven code review and quality gate enforcement

### Development Workflow System
- **Specification-First Approach**: Always start with comprehensive requirements before implementation
- **TDD Automation**: Red-Green-Refactor cycle with AI assistance for test generation
- **Command Framework**: Structured command system (kairo-*, tdd-*, rev-*) for workflow automation
- **Documentation Generation**: Living documentation that evolves with codebase
- **Reverse Engineering**: Extract specifications and tests from existing codebases

## External Dependencies

### Database and Infrastructure
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver for database connectivity
- **drizzle-orm**: Type-safe ORM for database operations and query building
- **drizzle-kit**: CLI tool for database migrations and schema management

### Frontend UI and Interaction
- **@radix-ui/***: Comprehensive set of unstyled, accessible UI primitives
- **@tanstack/react-query**: Powerful data synchronization for React applications
- **wouter**: Minimalist routing library for React applications
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Type-safe variant API for component styling

### Development and Build Tools
- **vite**: Next-generation frontend build tool with fast HMR
- **@vitejs/plugin-react**: Official Vite plugin for React support
- **typescript**: Static type checking for JavaScript applications
- **@replit/vite-***: Replit-specific plugins for development environment integration

### AI and Integration Services
- **@octokit/rest**: GitHub API client for repository operations and automation
- **Various form libraries**: React Hook Form ecosystem for form validation and management
- **Date and utility libraries**: date-fns for date manipulation, clsx for conditional styling

### Web3 Development Support
- **Smart contract templates**: Built-in templates for common Web3 patterns
- **Security-first design**: Security considerations integrated into development workflow
- **Gas optimization**: Performance optimization guidance throughout development process
- **Testing frameworks**: Comprehensive testing setup for smart contracts and dApps
