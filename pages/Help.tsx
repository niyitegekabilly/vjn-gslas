
import React, { useContext, useState } from 'react';
import { HelpCircle, Book, MessageCircle, Search, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { AppContext } from '../App';
import { LABELS, HELP_CONTENT } from '../constants';

export default function Help() {
  const { lang } = useContext(AppContext);
  const labels = LABELS[lang];
  const content = HELP_CONTENT[lang];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredContent = content.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <h2 className="text-2xl font-bold text-gray-800 flex items-center">
           <HelpCircle className="mr-3 text-blue-600" /> {labels.userGuide}
         </h2>
         
         <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={labels.search} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Guide Content */}
         <div className="lg:col-span-2 space-y-4">
           {filteredContent.length === 0 ? (
             <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300">
               <p className="text-gray-500">{labels.noData}</p>
             </div>
           ) : (
             filteredContent.map((item) => (
               <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
                 <button 
                   onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                   className="w-full flex justify-between items-center p-5 text-left focus:outline-none"
                 >
                   <div className="flex items-center">
                     <div className={`p-2 rounded-lg mr-4 ${expandedId === item.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                       <Book size={20} />
                     </div>
                     <h3 className={`text-lg font-semibold ${expandedId === item.id ? 'text-blue-700' : 'text-gray-900'}`}>
                       {item.title}
                     </h3>
                   </div>
                   {expandedId === item.id ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                 </button>
                 
                 {expandedId === item.id && (
                   <div className="p-5 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-gray-50/50">
                     <div className="prose prose-sm max-w-none p-4">
                       {item.content}
                     </div>
                   </div>
                 )}
               </div>
             ))
           )}
         </div>

         {/* Sidebar Support */}
         <div className="space-y-6">
           <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="text-lg font-bold mb-2 flex items-center">
                 <MessageCircle size={20} className="mr-2" /> {labels.contactSupport}
               </h3>
               <p className="text-blue-100 text-sm mb-4">
                 Need help with a technical issue? Our team is available 8:00 AM - 5:00 PM.
               </p>
               <div className="space-y-2 text-sm font-mono bg-blue-700/50 p-3 rounded-lg">
                 <p>Phone: 0788-000-000</p>
                 <p>Email: support@vjn.rw</p>
               </div>
             </div>
             <div className="absolute -bottom-4 -right-4 opacity-20">
               <HelpCircle size={120} />
             </div>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="font-bold text-gray-900 mb-4">Quick Tips</h3>
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

function CheckCircle(props: any) {
  return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
}
