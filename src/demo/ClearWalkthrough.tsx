// Quick utility component to clear walkthrough state
// Add this temporarily to your app if needed

import { useEffect } from 'react';

export const ClearWalkthrough = () => {
  useEffect(() => {
    localStorage.removeItem('taskmapr-active-walkthrough');
    console.log('✅ Cleared walkthrough from localStorage');
  }, []);
  
  return null;
};
