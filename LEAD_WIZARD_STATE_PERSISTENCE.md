# Lead Wizard State Persistence Solution

## Problem
When creating leads in the CRM system, users sometimes need to minimize the browser to copy contact details from Excel. Previously, this would cause the popup modal to disappear and users would lose their progress, forcing them to start over.

## Solution
Implemented a comprehensive state persistence system that automatically saves and restores the lead creation wizard progress.

## Features

### 1. Automatic State Saving
- **Auto-save every 5 seconds**: Progress is automatically saved to localStorage
- **Browser event handling**: State is saved when:
  - Browser window is minimized (`document:visibilitychange`)
  - Browser tab is switched
  - Browser is closed or refreshed (`window:beforeunload`)

### 2. State Restoration
- **Automatic restoration**: When the leads page loads, it checks for saved state
- **Visual indicators**: Users see a notification when progress is restored
- **Complete form state**: All form data, selected companies, and wizard step are preserved

### 3. State Management
- **Expiration**: Saved state expires after 24 hours to prevent stale data
- **Cleanup**: State is automatically cleared when:
  - Lead creation is successfully completed
  - User cancels the wizard
  - State expires

## Implementation Details

### New Service: `LeadWizardStateService`
```typescript
// Location: src/app/core/services/lead-wizard-state.service.ts
```
- Manages localStorage operations
- Handles state expiration
- Provides methods for save/restore/clear operations

### Updated Components

#### `LeadWizardComponent`
- Added `@HostListener` decorators for browser events
- Implements auto-save functionality
- Restores state on initialization
- Shows visual indicators for state restoration

#### `LeadsComponent`
- Checks for saved state on initialization
- Auto-opens wizard if saved state exists

## User Experience Improvements

### Visual Feedback
1. **Progress restoration indicator**: Shows when previous session data is restored
2. **Auto-save indicator**: Informs users that progress is being saved automatically
3. **Seamless experience**: Users can minimize browser without losing work

### Workflow
1. User starts creating a lead
2. Progress is automatically saved every 5 seconds
3. User minimizes browser to check Excel
4. When returning, the wizard automatically reopens with all data intact
5. User can continue from where they left off

## Technical Benefits

### Reliability
- Multiple save triggers ensure data is never lost
- Graceful handling of browser events
- Automatic cleanup prevents data accumulation

### Performance
- Minimal impact on application performance
- Efficient localStorage usage
- Smart state expiration

### Maintainability
- Clean separation of concerns
- Reusable service pattern
- Well-documented code

## Usage

The feature works automatically without any user intervention:

1. Start creating a lead using the "Add Leads" button
2. Fill in company search or company creation form
3. Minimize browser or switch tabs as needed
4. Return to the CRM - the wizard will automatically reopen with your progress

## Future Enhancements

Potential improvements that could be added:
- Multiple draft support (save multiple lead creation sessions)
- Cloud-based state persistence (sync across devices)
- State versioning for rollback capabilities
- Analytics on state restoration usage

## Files Modified

1. `src/app/core/services/lead-wizard-state.service.ts` (new)
2. `src/app/features/leads/lead-wizard/lead-wizard.component.ts`
3. `src/app/features/leads/lead-wizard/lead-wizard.component.html`
4. `src/app/features/leads/leads.component.ts`

## Testing

To test the functionality:
1. Start creating a lead
2. Fill in some form data
3. Minimize the browser window
4. Reopen the browser and navigate back to the leads page
5. Verify the wizard reopens with your data intact
