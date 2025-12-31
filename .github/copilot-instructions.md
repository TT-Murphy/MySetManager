# SwimSetMaker - AI Coding Agent Instructions

## Project Overview
SwimSetMaker is a Next.js web application for formatting swim practice sets. Users input unstructured practice text, and the app parses and formats it into professional swim workouts with automatic yardage calculation and time estimation.

## Architecture & Key Components
- **Frontend**: Next.js with Tailwind CSS for responsive UI
- **Parsing Engine**: Custom text parser for swim set notation (`/lib/parseSwimSet.js`)
- **Authentication**: Email/password login system
- **PDF Export**: Client-side PDF generation
- **Live Preview**: Real-time formatting as user types

## Core Features Implementation
1. **Text Parsing**: Handles multiple interval notations ("on 1:00", "@1:00", "1:00")
2. **Set Formatting**: Converts shorthand to structured format with proper indentation
3. **Calculations**: Automatic yardage totals and practice duration
4. **Comments**: Preserves non-set instructions in formatted output

## Development Patterns
- Components in `/components/` directory
- Parsing utilities in `/lib/` directory
- Tailwind CSS for all styling
- TypeScript for type safety

## Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Code quality checks

## Critical Files
- `/components/PracticeEditor.tsx` - Main editing interface
- `/lib/parseSwimSet.js` - Core parsing logic
- `/pages/api/auth/` - Authentication endpoints