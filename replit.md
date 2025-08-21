# Overview

Loco is a comprehensive payroll management system inspired by Zoho Payroll. Built as a full-stack web application, it provides admin and employee dashboards for managing employee data, processing payroll, tracking attendance, handling leave requests, and generating reports. The system features role-based access control with separate interfaces for administrators and employees.

**Migration Status**: Successfully migrated from Replit Agent to standard Replit environment with complete TypeScript to JavaScript conversion completed (January 2025).

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React SPA**: Built with React 18 and JavaScript using Vite as the build tool (converted from TypeScript January 2025)
- **UI Framework**: Shadcn/ui components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod schema validation
- **Charts**: Chart.js for data visualization (payroll trends, attendance metrics)

## Backend Architecture
- **Node.js + Express**: RESTful API server with TypeScript (backend remains TypeScript while frontend converted to JavaScript)
- **Authentication**: Passport.js with local strategy and express-session
- **Password Security**: Node.js crypto module with scrypt for password hashing
- **Authorization**: Role-based middleware (admin/employee) protecting routes
- **API Structure**: RESTful endpoints organized by resource (employees, payroll, attendance, leaves)

## Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Comprehensive relational design with users, employees, payrolls, leave requests, and attendance tables
- **Session Store**: PostgreSQL-backed sessions using connect-pg-simple
- **Migrations**: Drizzle Kit for database schema management

## Key Architectural Decisions

### Monorepo Structure
- **Client**: React frontend in `/client` directory
- **Server**: Express backend in `/server` directory  
- **Shared**: Common TypeScript types and Zod schemas in `/shared` directory
- **Benefits**: Type safety across frontend/backend, shared validation logic, simplified deployment

### Role-Based Access Control
- **Admin Role**: Full system access including employee management, payroll processing, leave approval, and reporting
- **Employee Role**: Limited access to personal data, payslips, leave requests, and attendance
- **Implementation**: JWT-less session-based authentication with role-based route protection

### Type-Safe Data Flow
- **Schema Definition**: Centralized Zod schemas in shared directory
- **Database Types**: Drizzle generates TypeScript types from schema
- **API Contracts**: Shared types ensure frontend/backend consistency
- **Validation**: Client and server-side validation using same Zod schemas

### Component Architecture
- **Design System**: Shadcn/ui provides consistent, accessible components
- **Layout Components**: Reusable sidebar navigation with role-based menu items
- **Chart Components**: Modular chart components for dashboard analytics
- **Protected Routes**: HOC pattern for authentication and authorization

# External Dependencies

## Database & Hosting
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Replit**: Development and hosting platform with integrated deployment

## Authentication & Security
- **Passport.js**: Authentication middleware with local strategy
- **Express Session**: Server-side session management
- **Connect PG Simple**: PostgreSQL session store
- **Bcrypt**: Password hashing library

## UI & Styling
- **Radix UI**: Headless, accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Consistent icon library
- **Chart.js**: Canvas-based charting library

## Development Tools
- **TypeScript**: Static type checking
- **Vite**: Fast development server and build tool
- **Drizzle Kit**: Database migration and introspection tools
- **React Hook Form**: Performant form library with validation
- **TanStack Query**: Server state management and caching

## Runtime Dependencies
- **Express**: Web application framework
- **Drizzle ORM**: Type-safe database client
- **Zod**: Runtime type validation
- **Date-fns**: Date manipulation utilities
- **Wouter**: Minimalist routing library