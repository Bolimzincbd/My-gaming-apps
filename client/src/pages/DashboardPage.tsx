import React from 'react';
import DashboardCards from '../components/ui/DashboardCards';

const DashboardPage: React.FC = () => {
  return (
    <div className="bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Overview</h1>
        
        {/* Top Metric Cards */}
        <DashboardCards />
        
        {/* Placeholder for the rest of your dashboard content */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 min-h-[400px]">
          <p className="text-gray-400 text-center mt-20">Additional dashboard content goes here.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;