# Clean Sheet – AI-Powered Data Alchemist

A next-generation web application for taming spreadsheet chaos, powered by Next.js, TypeScript, Material-UI, and AI-driven data intelligence. Clean Sheet lets you upload, validate, edit, and export complex resource allocation data with no technical expertise required.

---

## Features

- **AI-Enabled File Upload & Parsing**
  - Drag & drop or click to upload `.xlsx`, `.xls`, and `.csv` files for Clients, Workers, and Tasks.
  - AI-powered parser automatically maps columns, even with misspelled headers or shuffled order.

- **Automatic Entity Detection**
  - Uploaded files are intelligently categorized as Clients, Workers, or Tasks.

- **Interactive Data Grids**
  - Modern, editable tables for each entity using MUI DataGrid.
  - Inline editing with instant feedback and error highlighting.

- **Comprehensive Data Validation**
  - Real-time validation on upload and every edit.
  - Errors are highlighted in the grid and summarized in a dedicated panel.
  - **Validations include:**  
    - Missing required columns  
    - Duplicate IDs  
    - Malformed lists (e.g., non-numeric slots)  
    - Out-of-range values (e.g., PriorityLevel, Duration)  
    - Broken JSON in attributes  
    - Unknown references (e.g., missing TaskIDs)  
    - Circular co-run groups  
    - Conflicting rules  
    - Overloaded workers  
    - Phase-slot saturation  
    - Skill-coverage matrix  
    - Max-concurrency feasibility  
  - **AI-based Validator:** Detects unusual patterns and suggests additional checks.

- **AI-Driven Error Correction**
  - The system suggests and can auto-fix common data issues with a single click.

- **Rule Engine & Recommendations**
  - Intuitive UI for defining business rules (co-run, slot-restriction, load-limit, phase-window, pattern-match, precedence override).
  - The app suggests rules using AI based on detected data patterns.
  - All rules are bundled into a downloadable `rules.json` file.

- **Prioritization & Weights**
  - Assign weights to allocation criteria using sliders or numeric inputs.
  - Preset profiles (e.g., "Maximize Fulfillment", "Fair Distribution").

- **Natural Language Features**
  - (In progress) Search and interact with your data using plain English queries.
  - (Planned) Natural language to rules and data modification.

- **Export Functionality**
  - Download cleaned, validated data for Clients, Workers, and Tasks.
  - Export all user-defined rules and prioritization settings as `rules.json`.
  - Ready for integration with downstream allocation tools.

- **Modern, Accessible UI**
  - Custom Material UI theme, responsive layouts, and a focus on non-technical users.

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Material-UI
- **Data Grid:** @mui/x-data-grid
- **File Processing:** SheetJS (xlsx)
- **AI/Heuristics:** Google Gemini API, Custom TypeScript logic for parsing, validation, and rule recommendations

---

## Usage

1. **Upload** your data files in any order.
2. **Review and edit** your data in the interactive tables.
3. **Fix errors** using real-time validation and AI-powered suggestions.
4. **Define rules** using the intuitive UI or accept AI recommendations.
5. **Set priorities** for allocation using sliders or presets.
6. **Export** your cleaned data and rules for downstream use.

---

## Development

- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm run start` – Start production server
- `npm run lint` – Run ESLint