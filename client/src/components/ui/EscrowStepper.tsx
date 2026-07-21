import React from 'react';

const EscrowStepper: React.FC = () => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 w-full max-w-sm">
      <h2 className="text-white text-lg font-semibold mb-6">Order Status</h2>
      
      <ol className="relative border-l border-gray-700 ml-2">
        {/* Step 1 */}
        <li className="mb-8 ml-6">
          <span className="absolute flex items-center justify-center w-3 h-3 bg-blue-500 rounded-full -left-1.5 ring-4 ring-gray-800"></span>
          <h3 className="font-medium text-white">Pending Payment</h3>
        </li>
        
        {/* Step 2 */}
        <li className="mb-8 ml-6">
          <span className="absolute flex items-center justify-center w-3 h-3 bg-blue-500 rounded-full -left-1.5 ring-4 ring-gray-800"></span>
          <h3 className="font-medium text-white">Escrow Secured</h3>
        </li>
        
        {/* Step 3 */}
        <li className="mb-8 ml-6">
          <span className="absolute flex items-center justify-center w-3 h-3 bg-gray-600 rounded-full -left-1.5 ring-4 ring-gray-800"></span>
          <h3 className="font-medium text-gray-400">Seller Delivering</h3>
        </li>
        
        {/* Step 4 */}
        <li className="mb-8 ml-6">
          <span className="absolute flex items-center justify-center w-3 h-3 bg-gray-600 rounded-full -left-1.5 ring-4 ring-gray-800"></span>
          <h3 className="font-medium text-gray-400">Delivered</h3>
        </li>
        
        {/* Step 5 */}
        <li className="mb-8 ml-6">
          <span className="absolute flex items-center justify-center w-3 h-3 bg-gray-600 rounded-full -left-1.5 ring-4 ring-gray-800"></span>
          <h3 className="font-medium text-gray-400">Buyer Confirmed</h3>
        </li>
        
        {/* Step 6 */}
        <li className="ml-6">
          <span className="absolute flex items-center justify-center w-3 h-3 bg-gray-600 rounded-full -left-1.5 ring-4 ring-gray-800"></span>
          <h3 className="font-medium text-gray-400">Released to Seller</h3>
        </li>
      </ol>
    </div>
  );
};

export default EscrowStepper;