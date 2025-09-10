# Turmas Module Documentation

## Overview
The "Turmas" module is designed to manage class schedules for both collective and private classes within the Academia Krav Maga management system. This module integrates with the attendance module to track student participation and the positions executed during classes.

## Features
- **Collective Classes**: Supports scheduling and tracking of group classes, regardless of student attendance.
- **Private Classes**: Manages individual classes based on student attendance, allowing for personalized training sessions.
- **Attendance Tracking**: Integrates with the attendance module to monitor which students attended classes and the specific positions they executed.

## File Structure
The module consists of the following key components:

### Backend
- **Routes**: 
  - `backend/src/routes/turmas.ts`: Defines HTTP routes for managing class schedules.
  
- **Controllers**: 
  - `backend/src/controllers/turmasController.ts`: Contains the `TurmasController` class with methods for executing schedules and tracking attendance.
  
- **Services**: 
  - `backend/src/services/turmasService.ts`: Implements business logic for managing class schedules.

### Frontend
- **JavaScript Modules**:
  - `frontend/public/js/modules/turmas/index.js`: Entry point for the "turmas" module, initializes and registers the module with the AcademyApp.
  - `frontend/public/js/modules/turmas/controllers/turmasController.js`: Handles user interactions and communicates with the service layer.
  - `frontend/public/js/modules/turmas/services/turmasService.js`: Interacts with the backend API to manage class schedule data.
  - `frontend/public/js/modules/turmas/views/turmasView.js`: Renders the UI for displaying class schedules and attendance information.
  - `frontend/public/js/modules/turmas/components/turmasComponent.js`: Contains reusable UI components for the module.

- **CSS**:
  - `frontend/public/css/modules/turmas.css`: Styles specific to the "turmas" module, following the isolation pattern.

## Setup Instructions
1. **Backend Setup**:
   - Ensure the backend server is running and the necessary routes are defined in `turmas.ts`.
   - Implement the `TurmasController` and `TurmasService` to handle the business logic.

2. **Frontend Setup**:
   - Include the "turmas" module in the main application by registering it in `AcademyApp`.
   - Ensure all JavaScript and CSS files are correctly linked in the HTML.

## Integration with Attendance Module
The "Turmas" module works closely with the attendance module to ensure accurate tracking of student participation. The `trackAttendance` method in the `TurmasController` will call the attendance API to log which students attended each class and the positions they executed.

## Usage
- To execute a class schedule, call the `executeSchedule` method from the `TurmasController` with the desired start date.
- Use the UI components to display class schedules and attendance information to users.

## Conclusion
The "Turmas" module enhances the functionality of the Academia Krav Maga management system by providing robust scheduling and attendance tracking capabilities. It is designed to be modular and easily integrated with other components of the system.