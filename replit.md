# Overview

ElectriCost Pro is a standalone web-based cost reporting system designed specifically for electrical construction companies. The application provides real-time project cost tracking, budget variance analysis, and change order management tailored to electrical work. It eliminates the need for fragmented spreadsheets and paper forms by offering a centralized platform for tracking labor, materials, equipment, and subcontractor costs across electrical construction projects.

The system features electrical-specific cost codes, mobile-friendly data entry for field teams, and comprehensive reporting capabilities with CSV/PDF export functionality. Built as a full-stack web application, it serves electrical contractors seeking proactive cost management and data-driven project decisions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible design
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: React Query (TanStack Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript for end-to-end type safety
- **Database ORM**: Drizzle ORM for type-safe database operations and migrations
- **Authentication**: Replit Auth integration with JWT tokens and session management
- **File Uploads**: Uppy integration with AWS S3-compatible storage via Google Cloud Storage
- **API Design**: RESTful endpoints with standardized error handling and logging middleware

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless connection pooling
- **Schema Management**: Drizzle Kit for database migrations and schema evolution
- **Object Storage**: Google Cloud Storage for document attachments (invoices, receipts, photos)
- **Session Storage**: PostgreSQL-backed session store for user authentication state

## Authentication and Authorization
- **Provider**: Replit's OpenID Connect (OIDC) authentication system
- **Session Management**: Express sessions with PostgreSQL storage and configurable TTL
- **Role-Based Access**: User roles (PM, Estimator, Accountant, Executive) for permission-based features
- **Security**: JWT tokens with secure HTTP-only cookies and CSRF protection

## Database Schema Design
Core entities include:
- **Users**: Authentication and role management
- **Projects**: Project metadata, budgets, and status tracking
- **Cost Codes**: Electrical-specific categorization system
- **Cost Entries**: Individual cost records with project association
- **Change Orders**: Approval workflow and cost impact tracking

## File Upload and Management
- **Upload Interface**: Uppy dashboard modal for file selection and progress tracking
- **Storage Strategy**: Direct-to-cloud uploads using presigned URLs
- **Access Control**: Custom ACL system for object-level permissions
- **File Types**: Support for receipts, invoices, photos, and project documents

# External Dependencies

## Cloud Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Google Cloud Storage**: Object storage for file attachments and documents
- **Replit Infrastructure**: Authentication, hosting, and development environment

## Development Tools
- **Replit Plugins**: Runtime error overlay, cartographer for code navigation, and development banner
- **TypeScript**: End-to-end type safety across client, server, and shared code
- **ESBuild**: Fast TypeScript compilation for production builds

## UI and Design
- **Font Awesome**: Icon library for consistent iconography
- **Google Fonts**: Roboto font family for typography
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom design system

## Form and Data Management
- **React Hook Form**: Performance-optimized form library
- **Zod**: Runtime type validation and schema definition
- **TanStack Query**: Server state synchronization and caching