import React from 'react';
import { HelpCircle, Book, MessageCircle } from 'lucide-react';

export default function Help() {
  return (
    <div className="space-y-6 max-w-4xl">
       <h2 className="text-2xl font-bold text-gray-800 flex items-center">
         <HelpCircle className="mr-3 text-blue-600" /> Help & Support
       </h2>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
             <Book size={20} className="mr-2 text-gray-400" /> User Guide
           </h3>
           <ul className="space-y-3 text-sm text-gray-600">
             <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>How to start a new season?</li>
             <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Recording a meeting correctly</li>
             <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Calculating loan interest</li>
             <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Exporting reports to PDF</li>
           </ul>
         </div>

         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
             <MessageCircle size={20} className="mr-2 text-gray-400" /> Contact Support
           </h3>
           <p className="text-sm text-gray-600 mb-4">
             Need help with a technical issue? Contact the VJN technical team.
           </p>
           <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
             Contact Support Team
           </button>
         </div>
       </div>
    </div>
  );
}