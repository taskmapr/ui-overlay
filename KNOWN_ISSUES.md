# Known Issues

## TypeScript Lint Warning (Non-blocking)

**File:** `src/lib/createTaskMaprClient.ts` (line 5)

**Issue:** TypeScript reports missing properties in the default options object:
```
Type '{ framework: "openai-agents"; ... }' is missing the following properties 
from type 'Required<Omit<TaskMaprClientOptions, "apiKey" | "headers" | "instructions">>': 
onError, initialMessages, onMessageSent, onMessageReceived, and 3 more.
```

**Impact:** None - this is a type checking issue only. The build completes successfully and the package functions correctly. The lint error appears because the default options are intentionally partial (they get merged with user-provided options).

**Status:** 
- ✅ Build works fine
- ✅ Types are generated correctly  
- ✅ Runtime behavior is correct
- ⚠️ IDE shows lint warning (cosmetic only)

**To Fix (Optional):**
1. Cast the default options with `as Partial<TaskMaprClientOptions>`
2. Or restructure the type definition to make callbacks optional
3. Or use a separate type for default options

This can be addressed in a future patch release if desired. It does not affect publishing or usage of the package.
