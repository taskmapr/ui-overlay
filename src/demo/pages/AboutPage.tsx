import { Link } from 'react-router-dom';

export const AboutPage = () => {
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
          id="about-title"
          data-highlight-keywords="title, heading, about"
          className="text-5xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent"
        >
          About TaskMapr
        </h1>
      </div>

      <div 
        id="about-intro"
        data-highlight-keywords="introduction, intro, overview"
        data-highlight-description="Project introduction"
        className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-md mb-8"
      >
        <h2 className="text-2xl font-semibold mb-4 text-green-400">
          📖 What is TaskMapr?
        </h2>
        <p className="text-gray-300 mb-4">
          TaskMapr is a React component library that brings Cursor-style interactive chat overlays
          to your web applications. It combines beautiful UI with powerful features like automatic
          element highlighting and guided walkthroughs.
        </p>
        <p className="text-gray-300">
          Perfect for onboarding new users, providing contextual help, or building interactive
          product tours across your entire application.
        </p>
      </div>

      <div 
        id="about-philosophy"
        data-highlight-keywords="philosophy, design, principles, approach"
        data-highlight-description="Design philosophy and principles"
        className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-md mb-8"
      >
        <h2 className="text-2xl font-semibold mb-4 text-blue-400">
          💡 Design Philosophy
        </h2>
        <div className="space-y-4 text-gray-300">
          <div>
            <h3 className="font-semibold text-white mb-2">🎯 Simple to Use</h3>
            <p>Drop in a single component and you're ready to go. No complex configuration required.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">🔧 Highly Customizable</h3>
            <p>Every aspect can be styled and configured to match your brand and needs.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">🚀 Performance First</h3>
            <p>Built with React best practices, efficient DOM scanning, and minimal re-renders.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">♿ Accessible</h3>
            <p>Keyboard navigation, ARIA labels, and focus management built-in.</p>
          </div>
        </div>
      </div>

      <div 
        id="about-use-cases"
        data-highlight-keywords="use cases, examples, applications, scenarios"
        data-highlight-description="Common use cases and applications"
        className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-md mb-8"
      >
        <h2 className="text-2xl font-semibold mb-4 text-purple-400">
          🎯 Use Cases
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/60">
            <div className="text-lg font-semibold text-purple-400 mb-2">User Onboarding</div>
            <p className="text-sm text-gray-400">
              Guide new users through your application with interactive walkthroughs
            </p>
          </div>
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/60">
            <div className="text-lg font-semibold text-blue-400 mb-2">Feature Announcements</div>
            <p className="text-sm text-gray-400">
              Highlight new features and show users how to use them
            </p>
          </div>
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/60">
            <div className="text-lg font-semibold text-green-400 mb-2">Contextual Help</div>
            <p className="text-sm text-gray-400">
              Provide in-context assistance by highlighting relevant UI elements
            </p>
          </div>
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800/60">
            <div className="text-lg font-semibold text-yellow-400 mb-2">Interactive Demos</div>
            <p className="text-sm text-gray-400">
              Create engaging product demos that users can interact with
            </p>
          </div>
        </div>
      </div>

      <div 
        id="about-footer"
        data-highlight-keywords="footer, github, open source, contribute"
        className="bg-slate-900 rounded-xl p-8 border border-slate-800 shadow-lg text-center"
      >
        <h2 className="text-2xl font-semibold mb-4">
          🌟 Open Source
        </h2>
        <p className="text-gray-300 mb-6">
          TaskMapr is open source and available on GitHub.
          Contributions are welcome!
        </p>
        <div className="flex gap-4 justify-center">
          <a 
            href="https://github.com/yourusername/taskmapr"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-slate-950 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800/60"
          >
            View on GitHub
          </a>
          <Link 
            to="/features" 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors no-underline shadow-md"
          >
            Explore Features
          </Link>
        </div>
      </div>
    </div>
  );
};
