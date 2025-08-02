# Candidate Interview App

A modern, responsive web application for managing candidate interviews and questions. Built with React, TypeScript, and Tailwind CSS.

## Features

### 🏠 Home Page (Candidate List)
- **Candidate Cards** with full name, position, status, and experience
- **Status Management**: Not Interviewed (grey), Passed (green), Rejected (red), Maybe (yellow-orange)
- **Add Candidate** with modal form
- **Manage Positions** with add/remove functionality
- **Delete Candidates** with confirmation dialog

### 👤 Candidate Detail Page
- **Question Management**: Add, edit, and delete questions
- **Section Organization**: Group questions by sections
- **Answer Tracking**: Record candidate answers
- **Scoring System**: Mark questions as correct/wrong with undo functionality
- **Auto-sorting**: Questions automatically move to "Correct Answers" or "Wrong/Unanswered" sections
- **Statistics Bar**: Real-time counters for correct, wrong, and remaining questions
- **Save Interview Result**: Finalize interview with description and result
- **Result Summary**: View detailed interview summary with copy functionality

### 📋 Question Templates
- **Template Management**: Create and manage reusable question templates
- **Section Organization**: Add sections within templates
- **Question Bank**: Build a library of questions by section
- **Import Functionality**: Import questions from templates when adding candidates

## Tech Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling and responsiveness
- **Heroicons** for beautiful icons
- **LocalStorage** for data persistence
- **Mobile-first** responsive design

## Getting Started

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

## Usage

### Adding Candidates
1. Click "Add Candidate" on the home page
2. Fill in the candidate details (name, position, experience)
3. Optionally import questions from templates
4. Save the candidate

### Conducting Interviews
1. Click "View Details" on a candidate card
2. Add questions using the "Add Question" button
3. Record candidate answers in the text areas
4. Mark questions as correct (✓) or wrong (✗)
5. Use the undo button if you make a mistake
6. Save the interview result when finished

### Managing Question Templates
1. Navigate to "Question Templates" from the home page
2. Create new templates with "Add Template"
3. Add sections to organize questions
4. Add questions to each section
5. Use templates when adding new candidates

### Viewing Results
1. After completing an interview, view the summary
2. Copy the formatted summary to clipboard
3. Share results with stakeholders

## Data Storage

The app uses localStorage for data persistence:
- Candidates and their details
- Question templates and sections
- Interview questions and answers
- Interview results and descriptions

## Responsive Design

The app is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
