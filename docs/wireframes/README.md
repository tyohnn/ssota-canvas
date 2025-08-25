# Xbowl Wireframes

This directory contains comprehensive wireframe visualizations for the Xbowl platform - Scratch for AI Agents. All wireframes are created as JSON Flow files with static HTML representations and state-based variations.

## Wireframe Overview

### Completed Wireframes

1. **Dashboard Overview** (`wireframe-dashboard-overview.json`)

   - **Purpose**: Main dashboard with user stats, recent activities, and quick actions
   - **States**: Default, Loading, Error, Empty
   - **Components**: Welcome Banner, Stats Cards, Recent Workflows Grid, Quick Actions Panel
   - **Responsive**: Mobile (stacked), Tablet (side-by-side), Desktop (grid)

2. **Workflow Designer** (`wireframe-workflow-designer.json`)

   - **Purpose**: Visual workflow creation with dual canvas system and Editor Panel overlay
   - **States**: Default, Agent Node Selected (with Editor Panel active)
   - **Components**: Seven Core Node Explorer, ReactFlow Canvas, Editor Panel Overlay, Top Toolbox Panel
   - **Responsive**: Mobile (stacked), Tablet (side-by-side), Desktop (three-panel)
   - **Special Features**: 7 core node types, Editor Panel overlay system, Top Toolbox with context-specific tools

3. **Workflows List** (`wireframe-workflows-list.json`)

   - **Purpose**: Complete list of user's workflows with search, filter, and management options
   - **States**: Default, Empty
   - **Components**: Search Bar, Filter Panel, Workflow Grid, Bulk Actions, Pagination
   - **Responsive**: Mobile (stacked), Tablet (side-by-side), Desktop (grid)

4. **Agent Execution** (`wireframe-agent-execution.json`)

   - **Purpose**: Real-time AI agent execution monitoring with streaming generation and tool usage tracking
   - **States**: Default (with streaming execution)
   - **Components**: Artifact Explorer, Data Explorer, Streaming Execution Canvas, Agent Chat Panel
   - **Responsive**: Mobile (stacked), Tablet (side-by-side), Desktop (three-panel)
   - **Special Features**: Real-time streaming, tool invocation tracking, agent chat interaction

5. **Marketplace Browse** (`wireframe-marketplace-browse.json`)

   - **Purpose**: Template discovery and browsing interface with search and filter options
   - **States**: Default
   - **Components**: Search Bar, Category Filters, Template Grid, Sorting Options, Pagination
   - **Responsive**: Mobile (stacked), Tablet (side-by-side), Desktop (grid)

6. **User Profile** (`wireframe-user-profile.json`)
   - **Purpose**: User account management and preferences interface
   - **States**: Default
   - **Components**: Profile Form, Account Settings, Billing Panel, Usage Stats
   - **Responsive**: Mobile (stacked), Tablet (side-by-side), Desktop (two-panel)

## Wireframe Standards

### Design Principles

- **Gray-scale styling**: All wireframes use gray-scale colors for static HTML representation
- **State-based variations**: Each page includes multiple states (default, loading, error, empty, etc.)
- **Responsive design**: All wireframes include responsive behavior specifications
- **Accessibility**: WCAG 2.1 AA compliance for all wireframes
- **Component-based**: Clear component identification and relationships

### State Management

- **Default State**: Normal page functionality with all components visible
- **Loading State**: Skeleton placeholders with pulse animations
- **Error State**: Error messages with retry options and fallback actions
- **Empty State**: Onboarding content for new users or empty data scenarios
- **Special States**: Page-specific states (e.g., agent-node-selected for Workflow Designer)

### Responsive Breakpoints

- **Mobile**: Stacked layout for small screens
- **Tablet**: Side-by-side or centered layouts for medium screens
- **Desktop**: Multi-panel or grid layouts for large screens

## Technical Implementation

### JSON Structure

Each wireframe follows the Flow Template Content schema with:

- **Template metadata**: Version, description, and output specifications
- **Page metadata**: Creation dates, component counts, state types
- **Nodes**: Page states with HTML content and metadata
- **Edges**: State transitions and relationships
- **Layout**: Hierarchical layout configuration

### HTML Content

- **Static HTML**: Gray-scale wireframe representations
- **CSS-in-JS**: Inline styles for immediate visualization
- **Responsive classes**: CSS Grid and Flexbox for responsive behavior
- **Accessibility**: Semantic HTML and ARIA attributes

### Component Mapping

Each wireframe includes detailed component specifications:

- Component names and relationships
- Responsive behavior patterns
- Accessibility requirements
- State-specific visibility rules

## Next Steps

### Remaining Wireframes

The following pages still need wireframe creation:

- Dashboard Analytics Page
- Dashboard Notifications Page
- Dashboard Settings Page
- Workflow Create Wizard Page
- Workflow Settings Page
- Workflow Templates Page
- Workflow Shared Page
- Marketplace Template Detail Page
- Marketplace Categories Page
- Marketplace Trending Page
- Marketplace My Sales Page
- Marketplace Purchase History Page
- Marketplace Publish Page
- Learning Center Page
- Collaboration Workspace Page

### Validation and Review

- Stakeholder review of completed wireframes
- User experience validation
- Technical feasibility assessment
- Accessibility compliance verification
- Responsive design testing

### Handoff to Development

- Component specification documentation
- State transition mapping
- Responsive behavior guidelines
- Accessibility implementation notes
- Performance considerations

## File Structure

```
docs/wireframes/
├── README.md                           # This overview document
├── wireframe-dashboard-overview.json   # Dashboard overview wireframe
├── wireframe-workflow-designer.json    # Workflow designer wireframe
├── wireframe-workflows-list.json       # Workflows list wireframe
├── wireframe-agent-execution.json      # Agent execution wireframe
├── wireframe-marketplace-browse.json   # Marketplace browse wireframe
└── wireframe-user-profile.json         # User profile wireframe
```

## Success Criteria

✅ **Completed**: 6 comprehensive wireframes with state variations
✅ **Responsive Design**: All wireframes include mobile, tablet, and desktop specifications
✅ **Accessibility**: WCAG 2.1 AA compliance documented for all wireframes
✅ **State Management**: Clear state transitions and relationships defined
✅ **Component Architecture**: Detailed component specifications and relationships
✅ **HTML Wireframes**: Static HTML representations with gray-scale styling
✅ **JSON Structure**: Proper Flow Template Content schema compliance

## Notes

- All wireframes use gray-scale styling for static HTML representation
- State transitions are clearly mapped with transition types and descriptions
- Responsive behavior is specified for all viewport sizes
- Accessibility requirements are integrated throughout all wireframes
- Component relationships and dependencies are clearly documented
- Each wireframe includes comprehensive metadata for development handoff
