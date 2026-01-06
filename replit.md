# Project Overview

This is a modern full-stack web application built with React and Express.js, featuring a waitlist system as its primary functionality. The application serves as a landing page where users can join a waitlist by providing their email address.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**July 15, 2025**
- ✓ Built minimal black-themed book waitlist page for "Quit 9 to 5" 
- ✓ Added "Coming Soon" badge next to people counter
- ✓ Configured Google Sheets integration with proper column structure
- ✓ Fixed timestamp/email column order (Column A: timestamp, Column B: email)
- ✓ Connected count fetching to Pivot!G6 cell
- ✓ Responses saving to "Form Responses 1" sheet
- ✓ Improved spacing and aligned title/subtitle widths with form elements
- ✓ Updated design colors (blue dot and confirmation message match button)
- ✓ Added book-like rectangular border around all elements with gradient background

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and building

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL-based sessions with connect-pg-simple
- **API Design**: RESTful API endpoints
- **Validation**: Zod schemas shared between frontend and backend

### Key Components

#### Database Schema
- **Waitlist Entries Table**: Stores email addresses with timestamps
- **Users Table**: Basic user management (username/password)
- **Shared Schema**: TypeScript types and Zod validation schemas in `/shared/schema.ts`

#### API Endpoints
- `GET /api/waitlist/count`: Returns current waitlist count
- `POST /api/waitlist`: Adds email to waitlist with validation

#### External Integrations
- **Google Sheets Service**: Primary storage for waitlist entries
- **Sheet Structure**:
  - `Form Responses 1`: Stores new entries (Column A: timestamp, Column B: email)
  - `Pivot!G6`: Contains the total waitlist count
- **Environment Variables Required**:
  - `DATABASE_URL`: PostgreSQL connection string
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Service account for Google Sheets
  - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`: Private key for authentication
  - `GOOGLE_SHEETS_ID`: Target spreadsheet ID

#### Frontend Pages
- **Home Page**: Main landing page with email signup form
- **404 Page**: Not found page with helpful messaging

### Data Flow

1. **User Submission**: User enters email on home page
2. **Client Validation**: React Hook Form validates email format using Zod
3. **API Request**: Form submission triggers POST to `/api/waitlist`
4. **Server Validation**: Backend validates data against shared Zod schema
5. **Dual Storage**: Email saved to both PostgreSQL database and Google Sheets
6. **Response Handling**: Frontend shows success/error state and updates count
7. **Real-time Updates**: Waitlist count refreshes every 30 seconds

### External Dependencies

#### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling with validation
- **zod**: Schema validation
- **google-auth-library & googleapis**: Google Sheets integration

#### UI Dependencies
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Deployment Strategy

#### Development
- **Scripts**: `npm run dev` starts both frontend (Vite) and backend (tsx)
- **Hot Reload**: Vite handles frontend HMR, tsx watches backend changes
- **Environment**: NODE_ENV=development

#### Production Build
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Start Command**: `npm start` runs the production server
- **Static Serving**: Express serves built frontend files

#### Database Management
- **Migrations**: Drizzle Kit handles schema migrations in `/migrations`
- **Schema Push**: `npm run db:push` applies schema changes
- **Configuration**: `drizzle.config.ts` defines database connection and schema location

### Architecture Decisions

#### Why Dual Storage (PostgreSQL + Google Sheets)?
- **Primary**: PostgreSQL provides reliable, structured data storage
- **Backup**: Google Sheets offers manual access and backup redundancy
- **Fallback**: Application continues working if either system fails

#### Why Memory Storage Fallback?
- **Resilience**: In-memory storage ensures basic functionality during database outages
- **Development**: Simplifies local development without external dependencies
- **Graceful Degradation**: Application remains partially functional under failure conditions

#### Why Shared Schema?
- **Type Safety**: Single source of truth for data structures
- **Validation Consistency**: Same validation logic on frontend and backend
- **Maintainability**: Reduces code duplication and sync issues

#### Why Shadcn/ui?
- **Customizable**: Copy-paste components that can be modified
- **Accessible**: Built on Radix UI primitives with accessibility built-in
- **Type Safe**: Full TypeScript support with proper component props
- **Consistent**: Unified design system across the application