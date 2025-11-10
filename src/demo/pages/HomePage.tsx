import { Link } from 'react-router-dom';

export const HomePage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 
          id="home-title"
          data-highlight-keywords="title, heading, header, main, taskmapr, home"
          className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
        >
          TaskMapr UI Overlay
        </h1>
      </div>
      
      <p 
        id="home-subtitle"
        data-highlight-keywords="subtitle, description, intro"
        className="text-xl text-gray-300 mb-8"
      >
        A beautiful, Cursor-style chat interface for your website
      </p>

      <div 
        id="home-navigation"
        data-highlight-keywords="navigation, nav, links, menu"
        data-highlight-description="Navigation links to other pages"
        className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-md mb-8"
      >
        <h2 className="text-2xl font-semibold mb-4 text-blue-400">
          🧭 Explore
        </h2>
        <div className="space-y-3">
          <Link 
            to="/features" 
            className="block p-3 bg-slate-950 hover:bg-slate-800 rounded-lg transition-colors no-underline shadow-sm"
          >
            <span className="text-lg font-semibold text-purple-400">✨ Features</span>
            <p className="text-sm text-gray-400">Discover what TaskMapr can do</p>
          </Link>
          <Link 
            to="/about" 
            className="block p-3 bg-slate-950 hover:bg-slate-800 rounded-lg transition-colors no-underline shadow-sm"
          >
            <span className="text-lg font-semibold text-green-400">📖 About</span>
            <p className="text-sm text-gray-400">Learn more about the project</p>
          </Link>
        </div>
      </div>

      <div 
        id="home-quickstart"
        data-highlight-keywords="quick start, quickstart, install, setup, installation, getting started"
        data-highlight-description="Installation and setup instructions"
        className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-md mb-8"
      >
        <h2 className="text-2xl font-semibold mb-4 text-purple-400">
          🚀 Quick Start
        </h2>
        <div className="space-y-4 text-gray-300 text-sm">
          <div>
            <p className="mb-2">1. Install the package:</p>
            <code className="block bg-slate-950 px-3 py-2 rounded text-green-400 overflow-x-auto break-words shadow-inner">
              npm install @taskmapr/ui-overlay
            </code>
          </div>
          <div>
            <p className="mb-2">2. Import and use:</p>
            <code className="block bg-slate-950 px-3 py-2 rounded text-blue-300 overflow-x-auto shadow-inner">
              {`import { TaskMaprOverlay } from '@taskmapr/ui-overlay'`}
            </code>
          </div>
        </div>
      </div>

      <div 
        id="home-demo"
        data-highlight-keywords="demo, try, example, test, try it out, chat"
        data-highlight-description="Try it out section with keyboard shortcuts"
        className="bg-slate-900 rounded-xl p-8 border border-slate-800 shadow-lg"
      >
        <h2 className="text-2xl font-semibold mb-4">
          👉 Try it out!
        </h2>
        <p className="text-gray-300 mb-4">
          Click the chat button in the bottom-right corner to see the overlay in action.
        </p>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <kbd className="px-2 py-1 bg-slate-950 rounded border border-slate-700 shadow-inner">
              Enter
            </kbd>
            <span>Send message</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <kbd className="px-2 py-1 bg-slate-950 rounded border border-slate-700 shadow-inner">
              Shift+Enter
            </kbd>
            <span>New line</span>
          </div>
        </div>
      </div>
    </div>
  );
};
