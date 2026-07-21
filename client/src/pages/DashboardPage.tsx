import React from 'react';
import DashboardCards from '../components/ui/DashboardCards'; 

// Exporting as a named constant so it matches 'import { DashboardPage }' in App.tsx
export const DashboardPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, GoldLanePilot</h1>
        <p className="text-sm text-gray-400">
          Marksman | Gold Lane | Cambodia | Trust 82. Track MLBB matches, marketplace notifications, and mock escrow orders from one place.
        </p>
      </div>

      {/* Metric Cards Component */}
      <DashboardCards />

      {/* The rest of your dashboard grids (Live matches, Orders, etc.) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Insert your other dashboard cards here in the future */}
      </div>
      
    </div>
  );
};