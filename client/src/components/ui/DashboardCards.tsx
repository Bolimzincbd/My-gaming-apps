import React from 'react';

const DashboardCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Card 1 */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm text-gray-400 font-medium">Total Revenue</h3>
          <p className="text-3xl font-bold text-white mt-1">$45,231</p>
        </div>
        <div className="text-gray-400 bg-gray-700/50 p-3 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
      </div>

      {/* Card 2 */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm text-gray-400 font-medium">Active Users</h3>
          <p className="text-3xl font-bold text-white mt-1">2,405</p>
        </div>
        <div className="text-gray-400 bg-gray-700/50 p-3 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
        </div>
      </div>

      {/* Card 3 */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm text-gray-400 font-medium">Active Escrows</h3>
          <p className="text-3xl font-bold text-white mt-1">142</p>
        </div>
        <div className="text-gray-400 bg-gray-700/50 p-3 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
      </div>

      {/* Card 4 */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm text-gray-400 font-medium">Completed Orders</h3>
          <p className="text-3xl font-bold text-white mt-1">8,912</p>
        </div>
        <div className="text-gray-400 bg-gray-700/50 p-3 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;