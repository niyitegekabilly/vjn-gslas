
import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { LABELS, HELP_CONTENT } from '../constants';
import { HelpCircle, ChevronDown, ChevronRight, CheckCircle, Mail } from 'lucide-react';

export default function Help() {
  const { lang } = useContext(AppContext);
  const labels = LABELS[lang];
  const [openSection, setOpenSection] = useState<string | null>(null);

  const content = HELP_CONTENT[lang];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
       <div className="text-center py-8">
          <div className="inline-flex p-4 bg-blue-50 rounded-full text-blue-600 mb-4">
             <HelpCircle size={48} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">{labels.userGuide}</h2>
          <p className="text-gray-500 mt-2 max-w-lg mx-auto">Find answers to common questions and learn how to manage your GSLA effectively.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="md:col-span-2 space-y-4">
            {content.map((item) => (
               <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <button 
                    onClick={() => setOpenSection(openSection === item.id ? null : item.id)}
                    className="w-full flex justify-between items-center p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                     <span className="font-bold text-gray-800">{item.title}</span>
                     {openSection === item.id ? <ChevronDown className="text-blue-600" /> : <ChevronRight className="text-gray-400" />}
                  </button>
                  {openSection === item.id && (
                     <div className="p-5 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-gray-50/50">
                        {item.content}
                     </div>
                  )}
               </div>
            ))}
         </div>

         {/* Sidebar Support */}
         <div className="space-y-6">
           <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2">{labels.contactSupport}</h3>
                <p className="text-blue-100 text-sm mb-4">Need further assistance? Our team is here to help.</p>
                <a href="mailto:support@vjn.rw" className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
                   <Mail size={16} className="mr-2" /> Email Support
                </a>
             </div>
             <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500 rounded-full opacity-50"></div>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="font-bold text-gray-900 mb-4">{labels.quickTips}</h3>
             <ul className="space-y-3 text-sm text-gray-600">
               <li className="flex items-start">
                 <CheckCircle className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                 <span>Always close the season before generating the Share-out report.</span>
               </li>
               <li className="flex items-start">
                 <CheckCircle className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                 <span>Use "Meeting Mode" for faster data entry during gatherings.</span>
               </li>
               <li className="flex items-start">
                 <CheckCircle className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                 <span>Export data weekly to ensure you have offline backups.</span>
               </li>
             </ul>
           </div>
         </div>
       </div>
    </div>
  );
}
