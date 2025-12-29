import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App';
import { api } from '../api/client';
import { LABELS } from '../constants';
import { Cycle } from '../types';
import { Sprout, Lock, Play, Archive } from 'lucide-react';

export default function Seasons() {
  const { activeGroupId, lang, groups } = useContext(AppContext);
  const labels = LABELS[lang];
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const group = groups.find(g => g.id === activeGroupId);

  useEffect(() => {
    if (group?.currentCycleId) {
      api.getCycle(group.currentCycleId).then(c => setCycle(c || null));
    }
  }, [group]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{labels.cycle} Management</h2>
      </div>

      {cycle ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
             <div className="flex items-center justify-between">
               <div className="flex items-center">
                 <div className="p-3 bg-white rounded-full shadow-sm text-green-600 mr-4">
                   <Sprout size={24} />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-green-900">Current Season Active</h3>
                   <p className="text-green-700 text-sm">Started on {cycle.startDate}</p>
                 </div>
               </div>
               <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold uppercase tracking-wide">
                 {cycle.status}
               </span>
             </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Interest Rate</span>
                <p className="text-xl font-bold text-gray-900">{cycle.interestRate}% <span className="text-sm font-normal text-gray-400">/ month</span></p>
             </div>
             <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Status</span>
                <p className="text-xl font-bold text-gray-900">Open for Transactions</p>
             </div>
             <div className="p-4 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Actions</span>
                <button className="block w-full text-center mt-1 py-1 px-3 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 font-medium">
                  <Lock size={14} className="inline mr-1" /> Close Season
                </button>
             </div>
          </div>
          
          <div className="p-6 border-t border-gray-100">
             <h4 className="font-semibold text-gray-800 mb-3">Share-out Simulation</h4>
             <p className="text-sm text-gray-600 mb-4">
               Calculating share-out values requires closing all outstanding loans and reconciling fines.
             </p>
             <button className="flex items-center text-blue-600 text-sm font-medium hover:underline">
               <Archive size={16} className="mr-2" /> View previous seasons
             </button>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
           <p className="text-gray-500 mb-4">No active season found for this group.</p>
           <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center mx-auto">
             <Play size={18} className="mr-2" /> Start New Season
           </button>
        </div>
      )}
    </div>
  );
}