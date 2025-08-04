# Plans Module - Technical Documentation

## Overview
The Plans module manages billing plans, course associations, and subscription pricing for the academy system. It implements a two-level plan system that separates educational content from billing structure while maintaining seamless integration.

**Version**: 1.0.0  
**Last Updated**: 2025-07-16  
**Status**: Production-ready with protected components

## Architecture Overview

### Core Components

#### 1. **Main Plans Module** `/public/js/modules/plans.js`
- **Type**: Standard Module
- **Purpose**: Primary interface for plan management
- **Status**: Fully functional, actively maintained
- **Key Features**:
  - Plan CRUD operations
  - Course association management
  - Multi-tab editing interface
  - Real-time preview system
  - Filtering and search capabilities

#### 2. **PlansManager (PROTECTED)** `/public/js/modules/plans-manager.js`
- **Type**: Protected Module
- **Purpose**: Critical business logic isolation
- **Status**: PROTECTED - Do not modify without full backup
- **Key Features**:
  - Secure API fallback mechanisms
  - Isolated state management
  - Protected billing calculations
  - Safe event handling

#### 3. **UI Components**
- **Plans View**: `/public/views/plans.html`
- **Plan Editor**: `/public/views/plan-editor.html`
- **Styling**: `/public/css/plans.css`, `/public/css/modules/plans-styles.css`

## Two-Level Plan System

### Educational Plans (Course Content)
```javascript
// Course-based plan structure
{
  courseIds: ['course1', 'course2'],
  category: 'ADULT|CHILD|SENIOR|MASTER_1',
  level: 'BEGINNER|INTERMEDIATE|ADVANCED',
  classesPerWeek: 2,
  maxClasses: 8,
  duration: 24 // months
}
```

### Billing Plans (Subscription Pricing)
```javascript
// Billing-focused plan structure
{
  id: 'plan_uuid',
  name: 'Plan Name',
  price: 150.00,
  billingType: 'MONTHLY|QUARTERLY|YEARLY',
  isActive: true,
  features: ['feature1', 'feature2'],
  // Integration bridges
  courseIds: ['linked_courses'],
  category: 'billing_category'
}
```

## API Reference

### Core Endpoints

#### `GET /api/billing-plans`
**Purpose**: Retrieve all billing plans  
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "plan_uuid",
      "name": "Plano Premium",
      "description": "Plano completo com todos os recursos",
      "price": 150.00,
      "billingType": "MONTHLY",
      "category": "ADULT",
      "classesPerWeek": 2,
      "maxClasses": 8,
      "isActive": true,
      "courseIds": ["course1", "course2"],
      "features": ["Personal Training", "Nutrition"],
      "_count": {
        "subscriptions": 15
      }
    }
  ]
}
```

#### `POST /api/billing-plans`
**Purpose**: Create new billing plan  
**Request Body**:
```json
{
  "name": "Plano Básico",
  "description": "Plano para iniciantes",
  "price": 100.00,
  "billingType": "MONTHLY",
  "category": "ADULT",
  "classesPerWeek": 2,
  "courseIds": ["course1"],
  "isActive": true
}
```

#### `PUT /api/billing-plans/:id`
**Purpose**: Update existing billing plan  
**Request Body**: Same as POST

#### `DELETE /api/billing-plans/:id`
**Purpose**: Delete billing plan  
**Response**: Success confirmation

#### `GET /api/billing-plans/:id`
**Purpose**: Get specific billing plan details

### Fallback APIs
The PlansManager implements fallback mechanisms:
1. Primary: `/api/billing-plans`
2. Fallback: `/api/financial/plans`
3. Empty State: Returns `{ success: true, data: [] }`

## PlansManager (PROTECTED) - Deep Dive

### Why It's Protected
The PlansManager contains **business-critical billing logic** that directly impacts:
- Revenue calculations
- Subscription management
- Payment processing
- Financial reporting

### Key Protection Features

#### 1. **Secure State Management**
```javascript
// Private state - cannot be accessed externally
let _availablePlans = [];
let _currentPlan = null;
let _currentEditingStudentId = null;
```

#### 2. **API Fallback System**
```javascript
async _tryMultipleAPIs(urls) {
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`📡 API ${url} falhou:`, error.message);
    }
  }
  throw new Error('Todas as APIs falharam');
}
```

#### 3. **Isolated Component Rendering**
```javascript
renderPlansInterface(containerId) {
  // Generates isolated HTML with unique CSS classes
  // Prevents styling conflicts
  // Maintains component boundaries
}
```

### Integration Points

#### With Students Module
```javascript
// Student subscription management
PlansManager.init(studentId);
PlansManager.selectPlan(planId);
```

#### With Financial Module
```javascript
// Revenue calculations
PlansManager.loadPlansData();
// Price calculations protected in PlansManager
```

## State Management

### Cache Strategy
```javascript
// Plans module state
let allPlans = [];          // Full plans cache
let allCourses = [];        // Course data cache
let currentPlanId = null;   // Active editing plan
let isEditMode = false;     // Edit/create mode flag
```

### Data Flow
1. **Load**: `loadPaymentPlansList()` → API → `allPlans`
2. **Filter**: `filterPlans()` → Local cache → UI update
3. **Edit**: `editPlan(id)` → Cache lookup → Form population
4. **Save**: Form → Validation → API → Cache refresh

### Real-time Updates
```javascript
// Auto-refresh after operations
async function handlePlanFormSubmit() {
  // ... save logic
  await loadPaymentPlansList(); // Refresh cache
}
```

## UI/UX Patterns

### Full-Screen Navigation
Following project guidelines:
- **No Modals**: All actions use full-screen pages
- **Navigation**: Consistent back button patterns
- **Table Actions**: Double-click to edit

### Multi-Tab Editor
```javascript
// Tab system in plan-editor.html
switchPlanTab(tabName) {
  // 1. basic - Basic information
  // 2. courses - Course associations
  // 3. advanced - Advanced settings
  // 4. preview - Real-time preview
}
```

### Responsive Design
- **Grid Layout**: Adaptive stats grid
- **Mobile-First**: Responsive breakpoints
- **Progressive Enhancement**: Works without JavaScript

## Integration Guide

### Adding Plans to Student Management
```javascript
// In student editor
import { PlansManager } from './modules/plans-manager.js';

// Initialize with student context
PlansManager.init(studentId);

// Load available plans
await PlansManager.loadPlansData();

// Render plans interface
PlansManager.renderPlansInterface('plansContainer');
```

### Custom Plan Features
```javascript
// Extending plan features
const customPlan = {
  ...standardPlan,
  personalTraining: true,
  nutrition: true,
  allModalities: true,
  freezeOption: true
};
```

## Security Considerations

### Input Validation
```javascript
function validatePlanData(data) {
  if (!data.name) {
    showError('Nome do plano é obrigatório');
    return false;
  }
  
  if (!data.price || data.price <= 0) {
    showError('Preço do plano deve ser maior que zero');
    return false;
  }
  
  // Additional validations...
  return true;
}
```

### Protected Operations
- **Price Modifications**: Logged and audited
- **Plan Activation**: Restricted to authorized users
- **Bulk Operations**: Confirmation required

### Data Sanitization
```javascript
// All form inputs are sanitized
const formData = {
  name: sanitizeInput(document.getElementById('planName').value),
  price: parseFloat(document.getElementById('planPrice').value),
  // ...
};
```

## Payment Integration

### Asaas Integration Points
The module is designed to integrate with Asaas payment gateway:

```javascript
// Plan structure matches Asaas requirements
const asaasCompatiblePlan = {
  name: plan.name,
  value: plan.price,
  billingType: plan.billingType,
  cycle: plan.billingType === 'MONTHLY' ? 'MONTHLY' : 'YEARLY'
};
```

### Subscription Management
```javascript
// Plan selection triggers subscription creation
async function selectPlan(planId) {
  const plan = allPlans.find(p => p.id === planId);
  
  // Create subscription in payment system
  await createSubscription({
    planId: plan.id,
    studentId: currentStudentId,
    billingType: plan.billingType
  });
}
```

## Modification Guidelines

### Safe Modifications
✅ **Allowed**:
- Adding new plan categories
- Extending form fields
- Customizing CSS styles
- Adding filters and search

### Restricted Modifications
⚠️ **Caution Required**:
- Changing API endpoints
- Modifying price calculations
- Altering validation logic

### Forbidden Modifications
❌ **Never Change**:
- PlansManager internal structure
- Protected state variables
- Core business logic
- Payment integration points

## Testing Strategy

### Unit Tests
```javascript
// Test plan creation
describe('Plan Creation', () => {
  test('should create plan with valid data', async () => {
    const planData = {
      name: 'Test Plan',
      price: 100.00,
      billingType: 'MONTHLY'
    };
    
    const result = await createPlan(planData);
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests
```javascript
// Test API endpoints
describe('Plans API', () => {
  test('GET /api/billing-plans should return plans', async () => {
    const response = await fetch('/api/billing-plans');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

## Performance Optimization

### Caching Strategy
- **Local Cache**: Plans cached in memory
- **API Cache**: Server-side caching for 5 minutes
- **Browser Cache**: Static assets cached

### Lazy Loading
```javascript
// Load courses only when needed
async function switchPlanTab(tabName) {
  if (tabName === 'courses') {
    await loadCoursesForPlanSelection();
  }
}
```

### Debounced Search
```javascript
// Debounced filter to prevent excessive API calls
const searchInput = document.getElementById('planSearchInput');
searchInput.addEventListener('input', debounce(filterPlans, 300));
```

## Common Issues and Solutions

### Issue: Plans Not Loading
**Cause**: API endpoint unavailable  
**Solution**: Check PlansManager fallback system
```javascript
// PlansManager automatically tries multiple endpoints
const response = await this._tryMultipleAPIs([
  '/api/financial/plans',
  '/api/billing-plans'
]);
```

### Issue: Price Calculations Incorrect
**Cause**: Floating point precision  
**Solution**: Use proper decimal handling
```javascript
// Correct price formatting
const price = parseFloat(plan.price).toFixed(2);
```

### Issue: Form Validation Failing
**Cause**: Missing required fields  
**Solution**: Check validation logic
```javascript
function validatePlanData(data) {
  // Ensure all required fields are present
  const required = ['name', 'price', 'billingType'];
  return required.every(field => data[field]);
}
```

## Future Enhancements

### Planned Features
- **Subscription Analytics**: Advanced reporting
- **A/B Testing**: Plan pricing experiments
- **Bulk Operations**: Mass plan updates
- **Advanced Filtering**: Multi-criteria search

### Integration Roadmap
- **CRM Integration**: Customer relationship management
- **Marketing Automation**: Automated plan promotions
- **Analytics Dashboard**: Revenue insights
- **Mobile App**: Native mobile interface

## Conclusion

The Plans module represents a critical component of the academy management system, balancing flexibility with security. The protected PlansManager ensures business logic stability while the main module provides rich functionality for plan management.

**Key Takeaways**:
- Always backup before modifying protected components
- Follow the two-level plan system architecture
- Maintain API backward compatibility
- Test thoroughly before deployment
- Monitor performance metrics regularly

For additional support or questions, refer to the main project documentation in `/CLAUDE.md` and `/agents.md`.

---

**Documentation Version**: 1.0.0  
**Generated**: 2025-07-16  
**Maintainer**: Development Team  
**Next Review**: 2025-08-16