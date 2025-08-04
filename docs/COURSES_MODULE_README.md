# 📚 Courses Module - Documentation

## Overview
The Courses Module is a complete CRUD system for managing Krav Maga courses, built following the project's modular architecture principles.

## 🎯 Features
- **Full CRUD Operations**: Create, Read, Update, Delete courses
- **API-First Architecture**: All data comes from RESTful endpoints
- **Full-Screen UI**: No modals, dedicated pages for each action
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Validation**: Client and server-side validation
- **Toast Notifications**: User feedback for all actions

## 📁 File Structure
```
public/
├── views/
│   ├── courses.html          # Main courses listing page
│   └── course-editor.html    # Course creation/editing page
├── js/modules/
│   └── courses-manager.js    # Main module logic
├── css/modules/
│   └── courses.css           # Isolated styles
servers/
└── server-complete.js        # API endpoints
```

## 🚀 API Endpoints

### GET /api/courses
- **Description**: List all courses
- **Response**: Array of course objects
- **Example**:
```json
{
  "success": true,
  "data": [
    {
      "id": "course-123",
      "title": "Defesa Pessoal - Nível Iniciante",
      "description": "Curso completo de defesa pessoal...",
      "targetAudience": "Adultos 15+ anos, sem experiência prévia",
      "duration": 24,
      "category": "BEGINNER",
      "active": true
    }
  ]
}
```

### GET /api/courses/:id
- **Description**: Get specific course by ID
- **Response**: Single course object

### POST /api/courses
- **Description**: Create new course
- **Body**:
```json
{
  "title": "Course Title",
  "description": "Course description...",
  "targetAudience": "Target audience description",
  "duration": 24,
  "category": "BEGINNER",
  "active": true
}
```

### PATCH /api/courses/:id
- **Description**: Update existing course
- **Body**: Any course fields to update

### DELETE /api/courses/:id
- **Description**: Delete course
- **Response**: Success message

## 🎨 UI Components

### Courses Listing Page (`courses.html`)
- **Header**: Title and "New Course" button
- **Table**: Responsive table with course details
- **Actions**: Edit and Delete buttons per course
- **Empty State**: Message when no courses exist

### Course Editor Page (`course-editor.html`)
- **Form**: Complete course creation/editing form
- **Validation**: Real-time field validation
- **Navigation**: Back button to courses list
- **Toast Notifications**: Success/error feedback

## 🏷️ Course Categories
- **BEGINNER**: Iniciante
- **INTERMEDIATE**: Intermediário
- **ADVANCED**: Avançado

## 📋 Validation Rules
- **Title**: Required, minimum 5 characters
- **Description**: Required, minimum 20 characters
- **Target Audience**: Required, minimum 10 characters
- **Duration**: Required, between 1-52 weeks
- **Category**: Required, must be one of: BEGINNER, INTERMEDIATE, ADVANCED

## 🧪 Testing

### Automated Tests
```bash
# Run the test suite
node scripts/test-courses.js

# Expected output:
# ✅ All tests passed!
```

### Manual Testing
1. Start server: `npm run dev`
2. Open: `http://localhost:3000/views/courses.html`
3. Test CRUD operations:
   - Create new course
   - Edit existing course
   - Delete course
   - View course details

## 🔧 Integration

### Adding to Dashboard
The courses module is automatically integrated into the main dashboard navigation.

### Module Loader
Use the ModuleLoader to integrate:
```javascript
// In other modules
window.ModuleLoader.loadModule('courses', () => {
    // Custom integration code
});
```

## 📱 Responsive Design
- **Desktop**: 3-column grid layout
- **Tablet**: 2-column grid layout
- **Mobile**: Single column with horizontal scroll

## 🎨 Styling
- **CSS Prefix**: `.courses-isolated`
- **Color Scheme**: Dark theme with blue accents
- **Animations**: Smooth transitions and hover effects
- **Accessibility**: WCAG 2.1 compliant

## 🚨 Error Handling
- **Client-side**: Form validation with error messages
- **Server-side**: Detailed error responses
- **Network**: Graceful handling of API failures
- **UI**: User-friendly error messages

## 🔍 Troubleshooting

### Common Issues
1. **Course not found**: Check if course ID exists
2. **Validation errors**: Review field requirements
3. **Server errors**: Check server logs

### Debug Mode
Enable debug logging by adding `?debug=true` to URLs.

## 📊 Future Enhancements
- [ ] Course units and lessons
- [ ] Student enrollment management
- [ ] Progress tracking
- [ ] Certificate generation
- [ ] Course templates
- [ ] Bulk operations

## 🔄 Version History
- **v1.0.0**: Initial release with basic CRUD
- **v1.1.0**: Added validation and error handling
- **v1.2.0**: Improved responsive design

## 📞 Support
For issues or questions, refer to:
- Main documentation: `docs/CLAUDE.md`
- Architecture guide: `docs/agents.md`
- API documentation: `http://localhost:3000/docs`
