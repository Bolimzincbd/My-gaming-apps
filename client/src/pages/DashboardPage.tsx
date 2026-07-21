import React from 'react';
// Changed to a named import with curly braces
import { AppShell } from '../components/layout/AppShell';
import DashboardCards from '../components/ui/DashboardCards';

export const DashboardPage: React.FC = () => {
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Overview</h1>
        
        {/* Top Metric Cards */}
        <DashboardCards />
        
        {/* Placeholder for the rest of your dashboard content */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 min-h-[400px] mt-8">
          <p className="text-gray-400 text-center mt-20">
            Additional dashboard content (charts, tables, active matches) goes here.
          </p>
        </div>
      </div>
    </AppShell>
  );
};