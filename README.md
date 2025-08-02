# Hirely - Candidate Interview Management App

A modern, responsive web application for managing candidate interviews and questions. Built with React, TypeScript, and Tailwind CSS with full dark theme support.

## ✨ Features

### 🏠 Home Page (Candidate List)
- **Candidate Cards** with full name, position, status, and experience
- **Status Management**: Not Interviewed (grey), Passed (green), Rejected (red), Maybe (yellow-orange)
- **Add Candidate** with modal form
- **Manage Positions** with add/remove functionality
- **Delete Candidates** with confirmation dialog
- **View Summary** button for candidates with completed interviews
- **Dark Theme** toggle with persistent preference

### 👤 Candidate Detail Page
- **Question Management**: Add, edit, and delete questions
- **Section Organization**: Group questions by sections
- **Answer Tracking**: Record candidate answers
- **Scoring System**: Mark questions as correct/wrong with undo functionality
- **Auto-sorting**: Questions automatically move to "Correct Answers" or "Wrong/Unanswered" sections
- **Statistics Bar**: Real-time counters for correct, wrong, and remaining questions
- **Save Interview Result**: Finalize interview with description and result
- **Result Summary**: View detailed interview summary with copy functionality
- **Dark Theme** support throughout the interface

### 📋 Question Templates
- **Template Management**: Create and manage reusable question templates
- **Section Organization**: Add sections within templates
- **Question Bank**: Build a library of questions by section
- **Import Functionality**: Import questions from templates when adding candidates

### 💾 Data Management & Backup
- **Automatic Backups**: Data is automatically backed up to localStorage
- **Manual Backups**: Create manual backups anytime
- **Data Export**: Export all data as JSON files for external storage
- **Data Import**: Import data from previously exported JSON files
- **Restore Functionality**: Restore from local backups
- **Cross-device Support**: Export/import allows data transfer between devices

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling and responsiveness
- **Heroicons** for beautiful icons
- **IndexedDB** for robust data persistence
- **LocalStorage** for backup storage
- **Mobile-first** responsive design
- **Dark Theme** support with CSS custom properties

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd interview-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## 📖 Usage Guide

### 🎯 Adding Candidates
1. Click "Add Candidate" on the home page
2. Fill in the candidate details (name, position, experience)
3. Optionally import questions from templates
4. Save the candidate

### 🎤 Conducting Interviews
1. Click "View Details" on a candidate card
2. Add questions using the "Add Question" button
3. Record candidate answers in the text areas
4. Mark questions as correct (✓) or wrong (✗)
5. Use the undo button if you make a mistake
6. Save the interview result when finished

### 📋 Managing Question Templates
1. Navigate to "Question Templates" from the home page
2. Create new templates with "Add Template"
3. Add sections to organize questions
4. Add questions to each section
5. Use templates when adding new candidates

### 📊 Viewing Results
1. After completing an interview, view the summary
2. Copy the formatted summary to clipboard
3. Share results with stakeholders

### 💾 Data Management

#### Creating Backups
1. Click the "Backup" button in the top navigation
2. Click "Create Backup" to save your current data
3. Backups are automatically created when you make changes

#### Exporting Data
1. Open the Backup Manager (Backup button in navigation)
2. Click "Export Data (JSON)" to download all your data
3. The file will be saved as `interview-app-data-YYYY-MM-DD.json`
4. Use this to transfer data between devices or create external backups

#### Importing Data
1. Open the Backup Manager
2. Click "Import Data (JSON)"
3. Select a previously exported JSON file
4. The app will validate and import all data
5. The page will refresh automatically after successful import

#### Restoring from Backup
1. Open the Backup Manager
2. Click "Restore from Backup" if a backup exists
3. Confirm the restoration
4. The page will refresh with restored data

### 🌙 Dark Theme
- Click the theme toggle button in the top navigation
- Your preference is automatically saved
- All components support both light and dark themes

## 💾 Data Storage

The app uses a robust data storage system:

### Primary Storage (IndexedDB)
- **Candidates** and their details
- **Question templates** and sections
- **Interview questions** and answers
- **Interview results** and descriptions
- **Positions** and job titles

### Backup Storage (LocalStorage)
- **Automatic backups** created on data changes
- **Manual backups** for additional safety
- **Cross-session persistence** of data

### Export/Import System
- **JSON format** for maximum compatibility
- **Complete data export** including all candidates, templates, and results
- **Validation** of imported data structure
- **Cross-device transfer** capability

## 📱 Responsive Design

The app is fully responsive and works on:
- **Desktop computers** - Full feature access with optimized layouts
- **Tablets** - Touch-friendly interface with adaptive layouts
- **Mobile phones** - Mobile-first design with intuitive navigation

## 🌐 Browser Support

- **Chrome** (recommended) - Full feature support
- **Firefox** - Full feature support
- **Safari** - Full feature support
- **Edge** - Full feature support

## 🔧 Advanced Features

### Interview Summary Format
The app generates clean, formatted summaries that include:
- Candidate name and experience (with "+" notation)
- Interviewer description (if provided)
- Questions organized by sections
- Clear "Knows" and "Doesn't Know" categorization
- Easy copy-paste format for sharing

### Data Export Format
Exported JSON files contain:
- All candidate information and interview data
- Complete question templates and sections
- Interview results and descriptions
- Metadata including export timestamp and version
- Validated structure for reliable imports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly across different browsers and devices
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)
- TypeScript for type safety
