import React from 'react';
import EscrowStepper from '../components/ui/EscrowStepper';

// Exporting as a named constant so it matches 'import { OrdersPage }' in App.tsx
export const OrdersPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Order Tracking</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Main Order Details Area */}
        <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-8 min-h-[400px]">
          <h2 className="text-white text-lg font-semibold mb-4">Order Details</h2>
          <p className="text-gray-400">Placeholder for order items, chat, or delivery information.</p>
        </div>

        {/* Sidebar: Escrow Stepper */}
        <div className="flex items-start justify-center lg:justify-end">
          <EscrowStepper />
        </div>
        
      </div>
    </div>
  );
};