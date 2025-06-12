# Job Creation Page Flow

## Overview
The job creation page has been redesigned to provide a more intuitive workflow for creating and previewing job postings. The page operates in two distinct modes: **Edit Mode** and **Preview Mode**.

## Page Layout & Flow

### A) Default State - Edit Mode
When users first land on `/jobs/new`, they see:

**Left Column (2/3 width):**
- Complete job posting form with all input fields
- AI enhancement options for individual fields
- Job type selectors (Remote, Full-time, Hybrid)
- Skills, benefits, and requirements sections

**Right Column (1/3 width):**
- **Job Templates Section** (top half)
  - Pre-built templates for common roles
  - Quick-apply buttons for each template
  - File upload option for custom templates
- **Ask Adam Assistant** (bottom half)
  - AI-powered job creation assistance
  - Contextual suggestions and help
  - Voice input capabilities

### B) Preview Mode
When users click the **"Preview"** button:

**Main Area (2/3 width):**
- **Live Preview** of the job posting
- Real-time rendering of entered information
- Professional job listing layout
- Styled sections for:
  - Job overview and description
  - Responsibilities
  - Requirements/qualifications
  - Salary information
  - Benefits
  - Company information

**Right Sidebar (1/3 width):**
- **Templates Section** (maintained from edit mode)
- **Ask Adam Assistant** (maintained from edit mode)
- Both remain accessible for continued assistance

## Key Features

### State Management
- Single state toggle between `editMode` and `previewMode`
- Form data persists between modes
- Real-time updates in preview mode when returning to edit

### Navigation
- **"Edit"** button in preview mode returns to edit view
- **"Preview"** button in edit mode switches to preview
- **"Publish Job"** button available in both modes
- Back navigation maintains current mode

### Responsive Design
- Desktop: Three-column layout (edit) or two-column (preview)
- Tablet: Stacked layout with collapsible sidebar
- Mobile: Full-width single column with tabbed navigation

## Technical Implementation

### Component Structure
```
NewJobPage
├── Header (title, navigation, action buttons)
├── MainContent
│   ├── EditMode
│   │   ├── JobForm (left)
│   │   └── Sidebar (right)
│   │       ├── Templates
│   │       └── AskAdam
│   └── PreviewMode
│       ├── JobPreview (left)
│       └── Sidebar (right)
│           ├── Templates
│           └── AskAdam
```

### State Variables
```typescript
const [isPreviewMode, setIsPreviewMode] = useState(false)
const [jobInfo, setJobInfo] = useState(emptyJobData)
// ... other existing state
```

### Key Functions
- `togglePreviewMode()` - Switches between edit and preview
- `handleFormUpdate()` - Updates preview in real-time
- `applyTemplate()` - Loads template data (works in both modes)
- `handlePublishJob()` - Publishes job (available in both modes)

## User Experience Flow

1. **Landing**: User sees edit mode with empty form
2. **Template Selection**: User can apply a template to populate fields
3. **Form Filling**: User fills out job details with AI assistance
4. **Preview**: User clicks preview to see formatted job posting
5. **Refinement**: User can switch back to edit or continue refining in preview
6. **AI Assistance**: Available throughout the entire process
7. **Publishing**: Final job publication from either mode

## Benefits

### For Users
- Clear separation between editing and previewing
- Continuous access to templates and AI assistance
- Real-time preview updates
- Streamlined workflow

### For Development
- Cleaner component separation
- Easier state management
- Better responsive design opportunities
- Maintainable code structure

## Implementation Notes

### Phase 1 (Current)
- Three-column layout with form, preview, and tools
- Basic Adam integration

### Phase 2 (Proposed)
- Two-mode system with toggle functionality
- Enhanced preview layout
- Improved mobile responsiveness

### Phase 3 (Future)
- Auto-save functionality
- Collaborative editing
- Advanced AI suggestions based on preview analysis 