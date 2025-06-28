# Clean Sheet - Data Management Application

A modern web application built with Next.js, TypeScript, and Material-UI for managing and processing CSV/Excel files containing client, worker, and task data.

## Features

- **File Upload**: Drag & drop or click to upload `.xlsx`, `.xls`, and `.csv` files
- **Automatic Entity Detection**: Automatically categorizes uploaded files as Clients, Workers, or Tasks based on column headers
- **Interactive Data Tables**: View and edit data in MUI DataGrid with inline editing capabilities
- **Data Validation**: Framework for implementing validation rules (expandable)
- **Export Functionality**: Export data in Excel, CSV, or JSON formats
- **Modern UI**: Clean, responsive interface with Material-UI components

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Material-UI
- **File Processing**: SheetJS (xlsx)
- **Data Grid**: @mui/x-data-grid
- **File Download**: file-saver

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd clean-sheet
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Uploading Files

1. Navigate to the **Upload** section
2. Drag and drop files or click to select files
3. Supported formats: `.xlsx`, `.xls`, `.csv`
4. Files are automatically categorized based on column headers:
   - Files with `ClientID` column → Clients
   - Files with `WorkerID` column → Workers  
   - Files with `TaskID` column → Tasks

### Expected Data Schemas

#### Clients
- Required: `ClientID`, `Name`
- Optional: `Email`, `Phone`, `Address`

#### Workers
- Required: `WorkerID`, `Name`
- Optional: `Email`, `Phone`, `Position`, `Department`

#### Tasks
- Required: `TaskID`, `Title`
- Optional: `Description`, `ClientID`, `WorkerID`, `Status`, `Priority`, `DueDate`

### Editing Data

1. Go to the **Tables** section
2. Use the tabs to switch between Clients, Workers, and Tasks
3. Click on any cell to edit inline
4. Changes are automatically saved to the application state

### Exporting Data

1. Navigate to the **Export** section
2. Select the desired format (Excel or CSV)
3. Choose which datasets to export
4. Click "Export Selected Data" to download

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── layout.tsx      # Root layout with MUI theme
│   ├── page.tsx        # Main application page
│   └── globals.css     # Global styles
├── components/         # React components
│   ├── UploadSection.tsx
│   ├── TablesSection.tsx
│   ├── RulesSection.tsx
│   └── ExportSection.tsx
├── types/             # TypeScript type definitions
│   └── index.ts
└── utils/             # Utility functions
    └── fileParser.ts
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **Validation Rules**: Extend the `RulesSection` component to implement actual validation logic
2. **Cell Styling**: Use MUI DataGrid's `cellClassName` prop to style cells based on validation results
3. **Data Persistence**: Add backend integration or local storage for data persistence
4. **Advanced Filtering**: Implement search and filter functionality in the data tables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
