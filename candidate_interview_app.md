# Candidate Interview Web App Specification

## Overview

A modern, visually appealing web app (use any UI library for a clean, eye-pleasing design) to manage candidate interviews and questions. **The app must be mobile-compatible and responsive.**

---

## Core Features

### 1. Candidate List (Home Page)

- **Candidate Card Fields**:
  - Full Name
  - Position (enum, e.g., Backend Developer, Frontend Developer, etc. – editable from top nav "Add/Remove Position" modal)
  - Status (enum: Not Interviewed [grey, default], Passed [green], Rejected [red], Maybe [yellow-orange mix])
  - Experience (Years + Months)
  - Delete Button (with confirmation "Are you sure you want to remove this candidate?")
- **Add Candidate Button** (top nav)
  - Opens a modal with fields:
    - Full Name
    - Experience (Years + Months)
    - Position (dropdown)
    - Status (defaults to Not Interviewed)

---

### 2. Candidate Detail Page

- **Question Management**:

  - Add Question (modal)
    - Fields: Question Text, Optional Section (topics)
    - If no section is selected → goes to "Other" section.
  - **Question Card Layout**:
    - Question Number + Question Text
    - Answer (text input)
    - Correct Button (green check) and Wrong Button (red X)
    - Delete Button (X at top-right corner)

- **Sections**:

  - Group questions by Section name
  - "Correct Answers" Section (auto-moves when marked correct)
  - "Unanswered or Wrong Answers" Section (auto-moves when marked wrong)
  - Undo option for accidentally marked wrong questions

- **Counters on Nav Bar**:

  - Correct answers count
  - Wrong answers count
  - Remaining questions count

- **Save Interview Result (modal)**:

  - Description (text box)
  - Result (dropdown: Passed, Rejected, Maybe)
  - Save Button → returns to Home

- **Candidate Result Summary (modal)** (accessible via icon button on candidate card after interview):

  ```
  Full Name - X Years of Experience

  [Interviewer Description]

  Question Section
    Knows
      [Correctly answered questions]
    Doesn’t Know
      [Wrong/unanswered questions]
  (Repeat for each section)
  ```

  - Includes Copy button

---

### 3. Question Template Feature

- **Question Template Page** (from Home):

  - Manage reusable Question Sections (prevent duplicate names)
  - Add Questions within sections (sections are mandatory here)

- **While Adding Candidate**:

  - Option to import/copy questions (with sections) from:
    - Another candidate
    - Question Bank (all template sections & questions)
  - If section already exists → merge questions (no duplicates)
  - Option to add individual questions from question bank to any section
  - Option to add entirely new sections within candidate (local to candidate)

---

## Tech Preferences

- Use npm ecosystem or any suitable framework
- JSON or SQLite for storage
- **Must be mobile-compatible and fully responsive**

