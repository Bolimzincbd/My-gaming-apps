import React from 'react';
import DashboardPage from "./pages/DashboardPage";
import { Activity, Bell, DollarSign, ShieldCheck } from 'lucide-react'; // Using DollarSign to match your screenshot

const DashboardCards = () => {
  const metrics = [
    { title: 'Active matches', value: '1', icon: Activity },
    { title: 'Notifications', value: '1', icon: Bell },
    { title: 'Purchases', value: '2', icon: DollarSign },
    { title: 'Trust score', value: '82', icon: ShieldCheck },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div 
            key={index} 
            className="bg-[#121619] border border-gray-800 rounded-lg p-6 flex items-center justify-between hover:border-gray-700 transition-colors"
          >
            <div>
              <p className="text-sm text-gray-400 font-medium mb-1">
                {metric.title}
              </p>
              <h3 className="text-3xl font-bold text-white">
                {metric.value}
              </h3>
            </div>
            
            {/* THE FIX IS HERE: STRICT SIZING ON THE WRAPPER AND THE ICON */}
            <div className="p-3 bg-gray-800/50 rounded-lg flex items-center justify-center w-12 h-12 shrink-0">
              <Icon className="w-6 h-6 text-emerald-400 shrink-0" />
            </div>
            
          </div>
        );
      })}
    </div>
  );
};

export default DashboardCards;