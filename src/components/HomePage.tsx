"use client";

import React from "react";

interface HomePageProps {
  onNavigateToLogin: () => void;
  onTryDemo: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  onNavigateToLogin,
  onTryDemo,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main Hero Section */}
          <div className="mb-16">
            <h1 className="text-8xl md:text-9xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-600 bg-clip-text text-transparent mb-8 leading-tight">
              SwimSetMaker
            </h1>
            <p className="text-2xl md:text-3xl text-slate-300 font-light mb-4 max-w-4xl mx-auto leading-relaxed">
              Transform your swim practice notes into professional formatted
              sets with automatic calculations
            </p>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Built for coaches who want to create beautiful, detailed swim
              practices with ease. Save time, look professional, and focus on
              what matters most - coaching your swimmers.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Smart Formatting
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Type natural language and watch it transform into professional
                swim set notation with proper spacing and alignment.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Auto Calculate
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Automatic yardage totals and practice duration calculations help
                you plan perfect training sessions.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Save & Export
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Save practices to your account and export beautiful PDFs ready
                for printing or sharing with your team.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join coaches who are already creating professional swim practices
              with MySetManager.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onNavigateToLogin}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center space-x-3"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Get Started</span>
              </button>
              <button
                onClick={onTryDemo}
                className="px-8 py-4 bg-white/10 backdrop-blur text-white text-lg rounded-xl hover:bg-white/20 transition-all duration-200 font-medium border border-white/20"
              >
                Try Demo First
              </button>
            </div>
          </div>

          {/* Demo Note */}
          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              Demo login:{" "}
              <span className="text-cyan-400">coach@example.com</span> with any
              password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
