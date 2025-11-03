import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { WalkthroughStep } from '../types';
import { useHighlight } from '../contexts/HighlightContext';
import { useTaskMapr } from './useTaskMapr';
import { HomePage } from './pages/HomePage';
import { FeaturesPage } from './pages/FeaturesPage';
import { AboutPage } from './pages/AboutPage';
import '../styles/globals.css';

function App() {
  const { startWalkthrough, activeWalkthrough } = useHighlight();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize TaskMapr client with hook - returns client with pre-configured Overlay
  const taskmapr = useTaskMapr();
  
  
  // Multi-page walkthrough
  const startMultiPageTour = () => {
    const steps: WalkthroughStep[] = [
      {
        query: 'home title',
        page: '/',
        message: 'Welcome! Let\'s start our tour on the home page.',
        waitForClick: true,
      },
      {
        query: 'home quickstart',
        page: '/',
        message: 'Here\'s how to get started with installation.',
        waitForClick: true,
      },
      {
        query: 'home navigation',
        page: '/',
        message: 'Use these links to navigate. Click to continue to Features...',
        waitForClick: true,
      },
      {
        query: 'features title',
        page: '/features',
        message: 'Now we\'re on the Features page! (Navigate automatically)',
        waitForClick: true,
      },
      {
        query: 'features highlighting',
        page: '/features',
        message: 'Smart highlighting is one of the key features.',
        waitForClick: true,
      },
      {
        query: 'features walkthroughs',
        page: '/features',
        message: 'And here\'s the walkthrough feature you\'re experiencing!',
        waitForClick: true,
      },
      {
        query: 'about title',
        page: '/about',
        message: 'Finally, let\'s visit the About page...',
        waitForClick: true,
      },
      {
        query: 'about intro',
        page: '/about',
        message: 'Learn more about TaskMapr here.',
        waitForClick: true,
      },
      {
        query: 'about use cases',
        page: '/about',
        message: 'Check out these use cases for inspiration!',
        waitForClick: true,
      },
    ];
    
    startWalkthrough(steps, {
      onComplete: () => {
        console.log('🎉 Multi-page tour complete!');
      },
    });
  };

  // Watch for walkthrough navigation needs
  useEffect(() => {
    if (activeWalkthrough) {
      const currentStep = activeWalkthrough.steps[activeWalkthrough.currentStepIndex];
      const targetPage = currentStep.page || '/';
      
      if (location.pathname !== targetPage) {
        console.log('🚀 Navigating to', targetPage);
        navigate(targetPage);
      }
    }
  }, [activeWalkthrough, location.pathname, navigate]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white transition-all duration-300">
        {/* Fixed header with navigation and tour button */}
        <div className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 z-20">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              TaskMapr
            </div>
            <button
              onClick={startMultiPageTour}
              disabled={activeWalkthrough !== null}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              {activeWalkthrough ? (
                <>
                  <span className="animate-pulse">🎯</span>
                  Tour Active
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Start Multi-Page Tour
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main content with top padding for fixed header */}
        <div className="container mx-auto px-4 py-16 pt-24">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </div>

        {/* Footer */}
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>Built with React, TypeScript, Tailwind CSS, and React Router</p>
        </div>
      </div>

      {/* TaskMapr Overlay - fully self-contained, manages its own state */}
      <taskmapr.Overlay />
    </>
  );
}

export default App;
