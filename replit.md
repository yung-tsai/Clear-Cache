# Overview

This is a journaling application called "MacJournal II" that mimics the classic Mac OS interface and experience. It's a full-stack web application built with React on the frontend and Express.js on the backend, designed to provide a nostalgic Mac-like desktop environment for writing and managing journal entries. The app features draggable windows, Mac-style UI components, authentic Mac sounds for interactions, rich text formatting with color highlighting, and search functionality.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with custom Mac-themed styling
- **Styling**: Tailwind CSS with custom Mac OS color variables and styling
- **State Management**: React Query for server state management and local React state for UI
- **Routing**: Wouter for lightweight client-side routing
- **Window Management**: Custom draggable window system that simulates Mac OS desktop experience

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Data Layer**: Dual storage approach with in-memory storage (MemStorage) and Drizzle ORM prepared for PostgreSQL
- **API Design**: RESTful API endpoints for journal entry CRUD operations
- **Development Server**: Hot reload with Vite integration in development mode
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes

## Data Storage Solutions
- **Current**: In-memory storage using Map data structure for development/demo purposes
- **Production Ready**: Drizzle ORM configured for PostgreSQL with Neon Database serverless driver
- **Schema**: Single journal entries table with UUID primary keys, title, content, tags array, and timestamps
- **Migrations**: Drizzle Kit for database schema migrations

## Authentication and Authorization
- Currently not implemented - the application operates without user authentication
- Session handling infrastructure is present (connect-pg-simple) but not actively used

## External Dependencies
- **Database**: Neon Database (PostgreSQL-compatible serverless database)
- **UI Components**: Radix UI primitives for accessible, unstyled components
- **Sound System**: Web Audio API for Mac-style interaction sounds
- **Development Tools**: 
  - Replit integration with cartographer plugin and runtime error overlay
  - ESBuild for production server bundling
  - PostCSS with Autoprefixer for CSS processing

## Key Design Decisions
- **Mac OS Aesthetic**: Complete visual and auditory recreation of classic Mac OS interface
- **Window Management**: Custom implementation of draggable, focusable windows with z-index management
- **Rich Text Formatting**: Toolbar-based approach with markdown-like syntax for storage and HTML rendering for display
- **Sound System**: Toggle-able authentic Mac keyboard typing and mouse click sounds using Web Audio API
- **Search Functionality**: Full-text search across journal entries, tags, and dates with proper highlight rendering
- **Modular Storage**: Interface-based storage system allowing easy switching between in-memory and database storage
- **Type Safety**: Full TypeScript implementation with shared schemas between frontend and backend
- **Component Architecture**: Separation of UI components, business logic, and data management

## Recent Changes (August 2025)
- Fixed backwards text typing issue by simplifying rich text editor implementation
- Implemented proper highlight rendering in search results and read-only views
- Added toggle-able Mac sounds for keyboard typing and mouse interactions
- Enhanced search functionality with markup-to-HTML conversion for proper formatting display
- Fixed duplicate entry issue by implementing proper entry ID tracking after creation
- Added background selection feature under View menu with 6 customizable desktop backgrounds
- Updated classic Mac background to solid light gray (#e0e0e0) per user preference
- Improved window sizing: new journal entries now open with 700x500 dimensions for better visibility
- Centered main MacJournal window on app startup for better initial positioning
- Enhanced sound system with authentic Mac effects: window open/close, trash sound, menu dropdown, success chimes, and alert beeps
- Added classic Mac screensaver backgrounds: Flying Toasters, Starfield, Maze, and Aqua Bubbles with animated CSS effects
- Implemented smooth window animations for opening and closing windows with proper Mac-style transitions
- **Implemented comprehensive catharsis/stress relief system (August 2025)**:
  - **Compose mode**: Users can tag emotional content with inline selection toolbar (Stress, Anger, Sad, Highlight, Trash Later)
  - **Process mode**: Three cathartic actions available - Shred (blur/hide), Trash (collapse/remove), Stamp (mark as VOID)
  - **Multiple tagging methods**: Text selection toolbar, paragraph hover flags (⚑), long-press auto-tagging (600ms)
  - **Stress Inbox sidebar**: Collapsible sidebar showing all queued emotional tags across entries with click-to-navigate
  - **Post-Entry Ritual modal**: Appears after saving entries with new emotional tags, prompts user to process them
  - **Weekly Trash Day**: Banner appears after 7 days with unprocessed items, encourages batch processing
  - **Visual feedback**: Emotional highlights with color coding, processing animations, undo functionality
  - **LocalStorage persistence**: All emotional data stored with `sr-` prefixing, maintains highlights and processing state
  - **Mac Classic styling**: All catharsis components follow retro Mac aesthetic with ChicagoFLF font and authentic window styling
  - **Integration**: Works seamlessly with existing rich text editor using contentEditable div instead of textarea