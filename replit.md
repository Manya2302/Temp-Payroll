# Overview

Loco is a comprehensive payroll management system built with React and Express. It enables organizations to manage employees, process payments, track attendance, handle leave requests, and manage employee loans. The system supports both admin and employee roles with distinct permissions and features, including payment processing through PayPal and Razorpay integrations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Build Tool**
- React with Vite as the build tool and development server
- TypeScript support enabled (TSX files)
- Hot Module Replacement (HMR) for development

**UI Component System**
- Shadcn UI component library (New York style variant)
- Radix UI primitives for accessible, unstyled components
- Tailwind CSS for styling with CSS custom properties for theming
- Support for dark mode via class-based toggling

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management
- Custom query client with disabled refetching and infinite stale time for predictable caching
- React Hook Form with Zod resolvers for form validation

**Routing & Navigation**
- Single Page Application (SPA) architecture
- Client-side routing with HTML5 history API
- Fallback to index.html for all GET requests accepting HTML

**Design Decisions:**
- **Why Shadcn UI**: Provides pre-built, customizable components while maintaining full control over the code
- **Why TanStack Query**: Simplifies server state management, caching, and synchronization without complex Redux setup
- **Why Vite**: Faster development experience with native ES modules and optimized production builds

## Backend Architecture

**Server Framework**
- Express.js with ES module syntax (type: "module")
- Node.js runtime environment
- RESTful API design pattern

**Authentication & Authorization**
- Passport.js with Local Strategy for username/password authentication
- Express sessions with MongoDB-backed session store (connect-mongo)
- Bcrypt for password hashing (with fallback support for legacy scrypt hashes)
- Role-based access control (admin vs employee roles)
- OTP-based email verification for registration and password reset

**API Structure**
- Route protection middleware (requireAuth, requireAdmin)
- Centralized error handling for API routes
- JSON-based request/response format
- Credential-based fetch for session management

**File Organization**
- `/server` - Backend code (routes, auth, storage, DB connection)
- `/client` - Frontend React application
- `/shared` - Shared schemas and types between frontend and backend

**Design Decisions:**
- **Why Passport.js**: Industry-standard authentication with flexible strategy support
- **Why Express**: Minimal, unopinionated framework allowing custom architecture
- **Why separate auth middleware**: Enables reusable, declarative route protection

## Database Architecture

**Primary Database**
- MongoDB with Mongoose ODM
- Schema definitions in `/shared/mongoose-schema.js` for shared validation
- Connection pooling and error handling
- Zod schemas for runtime validation alongside Mongoose schemas

**Key Collections**
- Users (authentication, roles)
- Employees (profile information, linked to users)
- Payroll (payment records)
- Attendance (check-in/check-out tracking)
- Leave Requests (approval workflow)
- Loans (employee loan management with EMI tracking)
- Profiles (additional employee metadata)
- Queries (employee-admin communication)

**Session Storage**
- MongoDB-backed sessions via connect-mongo
- Lazy session updates (touchAfter: 24 hours)

**Design Decisions:**
- **Why MongoDB**: Flexible schema for evolving payroll data structures, good fit for document-based employee records
- **Why Mongoose**: Provides schema validation, middleware hooks, and virtual fields
- **Why Zod + Mongoose**: Zod for runtime validation in API layer, Mongoose for database constraints

## Payment Integration

**PayPal Integration**
- PayPal Server SDK for order creation and capture
- Sandbox environment for development, production for live
- OAuth-based authentication with client credentials
- Support for order creation, capture, and client token generation

**Razorpay Integration**
- Razorpay Checkout.js script loaded in HTML for client-side payment UI
- Used for employee loan EMI payments
- Configured via script tag in index.html

**Design Decisions:**
- **Why PayPal SDK**: Official SDK ensures compliance and up-to-date API support
- **Why Razorpay**: Popular payment gateway in certain markets with simple integration
- **Why dual payment providers**: Flexibility for different payment scenarios (payroll vs loan payments)

## Development vs Production

**Development Mode**
- Vite dev server with middleware mode integrated into Express
- Source map support for debugging
- Runtime error overlay via Replit plugin
- Cartographer plugin for Replit environment integration

**Production Mode**
- Vite builds static assets to `/dist/public`
- Express serves pre-built static files
- ESBuild bundles server code for deployment
- SPA fallback routing for client-side navigation

**Design Decisions:**
- **Why middleware mode**: Allows Express to handle API routes while Vite serves dev frontend
- **Why separate build steps**: Client and server have different bundling requirements
- **Why SPA fallback**: Enables client-side routing without 404 errors on page refresh

## Email System

**Email Service**
- Nodemailer for sending transactional emails
- Gmail SMTP transport configuration
- OTP delivery for verification and password reset
- Environment-based email credentials

**Design Decisions:**
- **Why Nodemailer**: De facto standard for Node.js email with extensive transport options
- **Why Gmail**: Simple setup for development and small-scale deployments

# External Dependencies

## Core Framework Dependencies

- **express**: Web server framework
- **react** / **react-dom**: Frontend UI library
- **vite**: Build tool and dev server
- **mongoose**: MongoDB ODM for data modeling
- **@tanstack/react-query**: Server state management

## Authentication & Security

- **passport** / **passport-local**: Authentication middleware
- **express-session**: Session management
- **connect-mongo**: MongoDB session store
- **bcrypt**: Password hashing
- **nodemailer**: Email service for OTP delivery

## Payment Providers

- **@paypal/paypal-server-sdk**: PayPal payment processing
- **Razorpay Checkout.js**: Razorpay payment gateway (loaded via CDN)

## UI Component Libraries

- **@radix-ui/react-***: Accessible UI primitives (dialog, dropdown, select, etc.)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx** / **tailwind-merge**: Conditional class name utilities

## Form Handling & Validation

- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Runtime schema validation

## Data Visualization

- **chart.js**: Chart rendering library
- **react-chartjs-2**: React wrapper for Chart.js

## Development Tools

- **@replit/vite-plugin-runtime-error-modal**: Error overlay for Replit
- **@replit/vite-plugin-cartographer**: Replit environment integration
- **esbuild**: Server-side code bundling
- **cross-env**: Cross-platform environment variables

## Database

- **MongoDB**: NoSQL database (connection string via `MONGODB_URL` environment variable)
- Default local connection: `mongodb://localhost:27017/loco_payroll`

## Environment Variables Required

- `MONGODB_URL`: MongoDB connection string
- `EMAIL_USER`: Gmail address for sending emails
- `EMAIL_PASS`: Gmail app password
- `PAYPAL_CLIENT_ID`: PayPal application client ID
- `PAYPAL_CLIENT_SECRET`: PayPal application secret
- `SESSION_SECRET`: Express session encryption key