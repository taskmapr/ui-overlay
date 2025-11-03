# Multi-Page Walkthrough Feature

## Overview

TaskMapr now supports **multi-page walkthroughs** that seamlessly guide users across different routes/pages in your application. The walkthrough state persists in localStorage, allowing users to refresh or navigate away and resume where they left off.

## Key Features

✅ **Cross-Page Navigation** - Automatically navigate users between pages as part of the tour  
✅ **State Persistence** - Walkthroughs survive page refreshes via localStorage  
✅ **Automatic Resumption** - Resume interrupted tours when returning to the correct page  
✅ **Smooth Transitions** - Coordinated highlighting and navigation  
✅ **Same API** - Minimal changes to existing walkthrough code

## How It Works

### 1. Page-Aware Steps

Each `WalkthroughStep` can now include an optional `page` property:

```typescript
const steps: WalkthroughStep[] = [
  {
    query: 'home title',
    page: '/',  // ← Specify the route/page
    message: 'Welcome to the home page!',
    waitForClick: true,
  },
  {
    query: 'features section',
    page: '/features',  // ← Will auto-navigate here
    message: 'Now we\'re on the features page!',
    waitForClick: true,
  },
];
```

### 2. Automatic Navigation

When a step's `page` property doesn't match the current route:
- The system automatically navigates to the target page
- The highlight is applied after navigation completes
- The walkthrough seamlessly continues

### 3. LocalStorage Persistence

The walkthrough state is automatically saved to localStorage:
- Current step index
- All steps in the tour
- Walkthrough ID

This allows the tour to resume if:
- User refreshes the page
- User manually navigates away
- Browser is closed and reopened

### 4. Resumption Logic

On mount, the `HighlightContext`:
1. Checks for a saved walkthrough in localStorage
2. Verifies the current page matches the expected page for the current step
3. Automatically resumes and highlights if on the correct page
4. Keeps the walkthrough in storage if on a different page (waiting for navigation)

## Implementation Details

### Type Changes

Added `page` property to `WalkthroughStep`:

```typescript
export interface WalkthroughStep {
  query: string;
  page?: string;  // ← New: route where this step occurs
  duration?: number;
  message?: string;
  waitForClick?: boolean;
}
```

### Context Updates

`HighlightContext` now includes:

- **`saveWalkthroughToStorage()`** - Persists walkthrough to localStorage
- **`loadWalkthroughFromStorage()`** - Loads saved walkthrough
- **Path change detection** - Monitors route changes via polling and popstate
- **Navigation coordination** - Triggers React Router navigation when needed

### Key Files Modified

- `src/types.ts` - Added `page` property to `WalkthroughStep`
- `src/contexts/HighlightContext.tsx` - Added persistence and navigation logic
- `src/demo/App.tsx` - Updated with routing and multi-page tour example
- `src/main.tsx` - Wrapped with `BrowserRouter`

## Usage Example

```typescript
import { useHighlight } from '../contexts/HighlightContext';
import { useNavigate } from 'react-router-dom';

function MyApp() {
  const { startWalkthrough } = useHighlight();
  const navigate = useNavigate();
  
  const startMultiPageTour = () => {
    const steps: WalkthroughStep[] = [
      {
        query: 'welcome banner',
        page: '/',
        message: 'Start here on the home page',
      },
      {
        query: 'feature list',
        page: '/features',
        message: 'Now check out our features',
      },
      {
        query: 'pricing table',
        page: '/pricing',
        message: 'Finally, see our pricing',
      },
    ];
    
    startWalkthrough(steps, {
      onStepChange: (index, step) => {
        console.log(`Step ${index + 1}: ${step.message}`);
        
        // Navigate if needed (HighlightContext will handle this automatically)
        if (step.page && window.location.pathname !== step.page) {
          navigate(step.page);
        }
      },
      onComplete: () => {
        console.log('Tour complete!');
      },
    });
  };
  
  return <button onClick={startMultiPageTour}>Start Tour</button>;
}
```

## Testing the Demo

1. **Run the dev server:**
   ```bash
   npm run dev
   ```

2. **Click "Start Multi-Page Tour"** in the header

3. **Follow the tour** which will:
   - Start on the home page (/)
   - Guide through home page elements
   - Auto-navigate to /features
   - Highlight features page elements
   - Auto-navigate to /about
   - Complete the tour

4. **Test persistence:**
   - Start the tour
   - Manually navigate away or refresh
   - Return to the expected page - the tour should resume!

## Limitations

- Callbacks (`onComplete`, `onStepChange`) are not persisted in localStorage
- Tours will only resume if you're on the expected page for the current step
- Manual navigation outside the tour doesn't automatically advance steps

## Browser Support

- Requires localStorage support
- Works with any React Router compatible routing solution
- Tested with React Router v6

## Future Enhancements

Possible improvements:
- Add tour preview/overview before starting
- Support conditional routing (multiple valid pages per step)
- Add animation preferences for page transitions
- Support for query parameters and dynamic routes
- Manual tour control buttons (next/prev/skip)
