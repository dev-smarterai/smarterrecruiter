# Interactive Job Creation Feature

## Overview
This feature transforms the job creation page into an interactive experience where users can chat with AI to build job postings collaboratively. The AI can ask clarifying questions, provide suggestions, and update the job preview in real-time as the conversation progresses.

## 1. Interactive Job Creation Chat with Streaming Form Updates

### Concept
Instead of manually filling out a static form, users engage in a natural conversation with the AI assistant. The AI intelligently extracts job information from the conversation and updates the job preview form in real-time.

### Key Features
- **Conversational Interface**: Natural dialogue with AI about job requirements
- **Real-time Form Updates**: Job preview updates automatically as information is gathered
- **Flexible Information Gathering**: Can provide all details at once or build gradually through questions
- **Smart Follow-ups**: AI asks relevant clarifying questions when needed
- **Context Awareness**: AI maintains context of current job data throughout conversation

### User Flow Examples

#### Example 1: Complete Information at Once
```
User: "Create a Senior Software Engineer job posting for a remote position, $120k-150k, requiring React and Node.js"

AI Response: 
- Chat: "Perfect! I've created a comprehensive job posting for a Senior Software Engineer position. Here's what I've generated..."
- Form Updates: All fields populated (title, description, responsibilities, requirements, skills, location, salary)
```

#### Example 2: Interactive Conversation
```
User: "I need to hire a marketing person"

AI: "I'd be happy to help! What type of marketing role are you looking to fill? For example: Digital Marketing Specialist, Marketing Manager, Content Marketing, etc.?"
Form Updates: { title: "Marketing Specialist" } // tentative

User: "Digital marketing manager, mid-level"

AI: "Great! A Digital Marketing Manager at mid-level. What's your budget range and is this remote, hybrid, or on-site?"
Form Updates: { title: "Digital Marketing Manager", jobLevel: "mid", description: "..." }
```

### Technical Implementation

#### New API Route: `/api/interactiveJobCreation`
- Handles conversational job creation
- Streams both chat responses AND job data updates
- Maintains context of current job state
- Returns structured responses with conversation + form updates

#### Response Format
```json
{
  "conversationalResponse": "Great! I'll help you create a Sales Consultant job...",
  "jobDataUpdates": {
    "title": "Sales Consultant",
    "description": "We are looking for...",
    "jobLevel": "mid"
  },
  "needsMoreInfo": true,
  "suggestedQuestions": [
    "What's the salary range?",
    "Is this remote, hybrid, or on-site?"
  ],
  "_incomplete": false
}
```

#### Component Updates
- **AskAdamCandidate**: Add `jobCreation` mode with job data context
- **New Job Page**: Handle real-time job data updates from chat
- **Streaming Integration**: Leverage existing streaming infrastructure from `generateJob`

## 2. Direct Inline Editing with Preserved Visual Design

### Concept
Transform the job preview from static display to directly editable content while maintaining the exact same visual appearance and color scheme.

### Key Features
- **Click-to-Edit**: Click any field in the preview to edit it directly
- **Visual Consistency**: Maintains exact same colors, spacing, and design when not editing
- **Seamless Transitions**: Smooth transition between view and edit modes
- **Multiple Field Types**: Support for text, lists, selects, and multi-line content
- **Auto-save**: Changes save automatically on blur/enter

### Visual Design Preservation
- **Blue boxes** (Overview): Editable text areas
- **Blue-50 boxes** (Responsibilities): Editable bullet point lists
- **Yellow-50 boxes** (Skills): Editable skill tags/lists
- **Purple-50 boxes** (Qualifications): Editable requirement lists
- **Green-50 boxes** (Salary): Editable salary and job type selectors
- **Indigo-50 boxes** (Benefits): Editable benefit lists

### Editing States

#### Normal State
- Identical to current static design
- No visual indication of editability (clean design)

#### Hover State
- Subtle visual hint (slight opacity change or cursor change)
- Maintains color scheme

#### Edit State
- Thin border appears around editable area
- Background slightly lighter within same color family
- Cursor visible for text input
- Auto-resize for content

### Component Architecture

#### New Components
- `InlineEditableText`: Single-line and multi-line text editing
- `InlineEditableList`: Bullet point list editing with add/remove
- `InlineEditableSelect`: Dropdown selections (salary, job type, etc.)
- `InlineEditableSkills`: Tag-based skill editing

#### Field Type Mapping
```typescript
// Text Fields
title: InlineEditableText
description: InlineEditableText (multiline)
location: InlineEditableText

// List Fields  
responsibilities: InlineEditableList (blue bullets)
requirements: InlineEditableList (purple bullets)
benefits: InlineEditableList (green bullets)

// Skill Fields
skills: InlineEditableSkills (yellow tags)

// Select Fields
salaryRange: InlineEditableSelect
jobType: InlineEditableSelect
jobLevel: InlineEditableSelect
```

### Integration with Chat Updates
- Recently updated fields from chat show subtle highlight animation
- Smooth transitions when AI updates fields during conversation
- Manual edits override AI suggestions
- Visual feedback for field updates from both sources

## Implementation Priority

### Phase 1: Interactive Chat API
1. Create `/api/interactiveJobCreation` route
2. Update `AskAdamCandidate` component for job creation mode
3. Integrate streaming job data updates
4. Test conversational flow

### Phase 2: Inline Editing
1. Create base inline editing components
2. Replace static preview content with editable components
3. Implement different field types (text, lists, selects)
4. Add visual state management

### Phase 3: Integration & Polish
1. Connect chat updates with inline editing
2. Add visual feedback for updates
3. Implement auto-save functionality
4. Add keyboard shortcuts and accessibility

## Benefits

### User Experience
- **Natural Interaction**: Feels like talking to a human HR expert
- **Immediate Feedback**: See results instantly as you chat
- **Flexible Input**: Can provide info in any order or format
- **Direct Control**: Can manually edit any field at any time
- **Visual Consistency**: Familiar interface with enhanced functionality

### Technical Benefits
- **Leverages Existing Infrastructure**: Uses proven streaming from `generateJob`
- **Modular Design**: Inline editing components reusable across app
- **Maintainable**: Clear separation between chat logic and editing logic
- **Scalable**: Easy to add new field types or editing modes 