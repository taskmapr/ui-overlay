import { Link } from 'react-router-dom';

export const FeaturesPage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link 
          to="/" 
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4 no-underline"
        >
          ← Back to Home
        </Link>
        <h1 
          id="features-title"
          data-highlight-keywords="title, heading, features"
          className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
        >
          Features
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div 
          id="features-ui"
          data-highlight-keywords="ui, user interface, design, styling"
          data-highlight-description="UI and styling features"
          className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-md"
        >
          <h2 className="text-2xl font-semibold mb-4 text-purple-400">
            🎨 Beautiful UI
          </h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              Smooth slide-in animation
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              Dark theme with modern UI
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              Fully customizable colors
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              Responsive design
            </li>
          </ul>
        </div>

        <div 
          id="features-interaction"
          data-highlight-keywords="interaction, interactive, chat, messaging"
          data-highlight-description="Interactive chat features"
          className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-md"
        >
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">
            💬 Chat Features
          </h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              Floating toggle button
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              Auto-scroll to latest message
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              Resizable chat panel
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              Keyboard shortcuts
            </li>
          </ul>
        </div>

        <div 
          id="features-highlighting"
          data-highlight-keywords="highlighting, highlight, ui elements, scanner"
          data-highlight-description="UI highlighting capabilities"
          className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-md"
        >
          <h2 className="text-2xl font-semibold mb-4 text-green-400">
            🎯 Smart Highlighting
          </h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              Automatic UI element discovery
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              Keyword-based searching
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              Highlight any element by name
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              Timed auto-dismiss
            </li>
          </ul>
        </div>

        <div 
          id="features-walkthroughs"
          data-highlight-keywords="walkthrough, tour, guided, onboarding"
          data-highlight-description="Walkthrough and tour features"
          className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-md"
        >
          <h2 className="text-2xl font-semibold mb-4 text-yellow-400">
            🚶 Guided Tours
          </h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="text-yellow-400 mr-2">•</span>
              Step-by-step walkthroughs
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-2">•</span>
              Multi-page support
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-2">•</span>
              Click-to-proceed navigation
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-2">•</span>
              Automatic resumption
            </li>
          </ul>
        </div>
      </div>

      <div 
        id="features-technical"
        data-highlight-keywords="technical, tech stack, typescript, react"
        data-highlight-description="Technical details and stack"
        className="bg-slate-900 rounded-xl p-8 border border-slate-800 shadow-lg"
      >
        <h2 className="text-2xl font-semibold mb-4 text-pink-400">
          ⚙️ Technical Stack
        </h2>
        <p className="text-gray-300 mb-4">
          Built with modern web technologies:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-950 rounded-lg p-3 text-center border border-slate-800/60">
            <div className="text-2xl mb-1">⚛️</div>
            <div className="text-sm text-gray-300">React 18</div>
          </div>
          <div className="bg-slate-950 rounded-lg p-3 text-center border border-slate-800/60">
            <div className="text-2xl mb-1">📘</div>
            <div className="text-sm text-gray-300">TypeScript</div>
          </div>
          <div className="bg-slate-950 rounded-lg p-3 text-center border border-slate-800/60">
            <div className="text-2xl mb-1">🎨</div>
            <div className="text-sm text-gray-300">Tailwind CSS</div>
          </div>
          <div className="bg-slate-950 rounded-lg p-3 text-center border border-slate-800/60">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-sm text-gray-300">Vite</div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link 
          to="/about" 
          className="inline-flex items-center text-blue-400 hover:text-blue-300 no-underline"
        >
          Learn more about the project →
        </Link>
      </div>
    </div>
  );
};
