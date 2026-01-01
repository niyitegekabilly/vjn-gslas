
import React, { useState, useEffect } from 'react';
import { 
  Info, Settings, FileText, MapPin, Upload, CheckCircle, 
  Loader2, DollarSign, Save, X 
} from 'lucide-react';
import { GSLAGroup, GroupStatus, MeetingFrequency } from '../types';

interface GroupFormProps {
  initialData?: Partial<GSLAGroup>;
  onSubmit: (data: any) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
  labels: any;
  title?: string;
  submitLabel?: string;
}

export const GroupForm: React.FC<GroupFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  labels,
  title,
  submitLabel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    branchId: 'b1',
    district: '',
    sector: '',
    cell: '',
    village: '',
    meetingDay: 'Friday',
    meetingFrequency: MeetingFrequency.WEEKLY,
    shareValue: 100,
    minShares: 1,
    maxShares: 5,
    maxLoanMultiplier: 3,
    status: GroupStatus.ACTIVE,
    lateFeeAmount: 5,
    lateFeeType: 'PERCENTAGE',
    ...initialData
  });

  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(
    initialData?.coordinates || null
  );
  const [constitutionFile, setConstitutionFile] = useState<string>(
    initialData?.constitutionUrl || ''
  );
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
        setFormData(prev => ({ ...prev, ...initialData }));
        setCoordinates(initialData.coordinates || null);
        setConstitutionFile(initialData.constitutionUrl || '');
    }
  }, [initialData]);

  const handleGetLocation = () => {
    setGeoLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGeoLoading(false);
        },
        (error) => {
          alert("Error getting location: " + error.message);
          setGeoLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setGeoLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5000000) {
        alert("File is too large. Max 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setConstitutionFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      coordinates,
      constitutionUrl: constitutionFile,
      location: `${formData.sector}, ${formData.district}` // Derived field
    });
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">{title || labels.createGroupTitle}</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        {/* Section 1: Identification & Location */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center border-b border-gray-100 pb-2">
            <Info size={16} className="mr-2" /> {labels.identification}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{labels.groupName} <span className="text-red-500">*</span></label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="e.g., Abakorerabushake"
              />
            </div>
            
            {/* Status Selection (Visible if editing or explicit create) */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">{labels.status}</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as GroupStatus})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                {Object.values(GroupStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Location Fields */}
            <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{labels.district}</label>
                    <input 
                        value={formData.district}
                        onChange={e => setFormData({...formData, district: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                        placeholder="e.g. Musanze"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{labels.sector}</label>
                    <input 
                        value={formData.sector}
                        onChange={e => setFormData({...formData, sector: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                        placeholder="e.g. Muhoza"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{labels.cell}</label>
                    <input 
                        value={formData.cell}
                        onChange={e => setFormData({...formData, cell: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{labels.village}</label>
                    <input 
                        value={formData.village}
                        onChange={e => setFormData({...formData, village: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    />
                </div>
                
                {/* Geo-Tagging Control */}
                <div className="col-span-2">
                   <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div>
                         <label className="block text-xs font-bold text-blue-900 uppercase mb-1">{labels.gpsLocation}</label>
                         {coordinates ? (
                           <div className="font-mono text-sm text-blue-800 flex items-center">
                              <CheckCircle size={14} className="mr-1 text-blue-600" />
                              {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                           </div>
                         ) : (
                           <p className="text-xs text-blue-600">{labels.coordinatesNotCaptured}</p>
                         )}
                      </div>
                      <button 
                        type="button" 
                        onClick={handleGetLocation} 
                        disabled={geoLoading}
                        className="text-xs bg-white border border-blue-200 text-blue-700 px-3 py-2 rounded-lg font-bold hover:bg-blue-50 flex items-center shadow-sm"
                      >
                        {geoLoading ? <Loader2 size={14} className="animate-spin mr-1"/> : <MapPin size={14} className="mr-1"/>}
                        {coordinates ? labels.updateGps : labels.getGps}
                      </button>
                   </div>
                </div>
            </div>
          </div>
        </div>

        {/* Section 2: Financial Rules */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center border-b border-gray-100 pb-2">
            <Settings size={16} className="mr-2" /> {labels.financialRules}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="col-span-2 md:col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Day</label>
               <select 
                 value={formData.meetingDay}
                 onChange={e => setFormData({...formData, meetingDay: e.target.value})}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
               >
                 {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                   <option key={d} value={d}>{d}</option>
                 ))}
               </select>
             </div>
             <div className="col-span-2 md:col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">{labels.meetingFreq}</label>
               <select 
                 value={formData.meetingFrequency}
                 onChange={e => setFormData({...formData, meetingFrequency: e.target.value as MeetingFrequency})}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
               >
                 {Object.values(MeetingFrequency).map(f => (
                   <option key={f} value={f}>{f}</option>
                 ))}
               </select>
             </div>
             <div className="col-span-2 md:col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">{labels.shareValue}</label>
               <div className="relative">
                 <DollarSign size={14} className="absolute left-3 top-3 text-gray-400" />
                 <input 
                   type="number"
                   min="50"
                   step="50"
                   value={formData.shareValue}
                   onChange={e => setFormData({...formData, shareValue: parseInt(e.target.value)})}
                   className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                 />
               </div>
             </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">Min Shares</label>
               <input 
                 type="number"
                 min="1"
                 value={formData.minShares}
                 onChange={e => setFormData({...formData, minShares: parseInt(e.target.value)})}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
               />
             </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">Max Shares</label>
               <input 
                 type="number"
                 min="1"
                 value={formData.maxShares}
                 onChange={e => setFormData({...formData, maxShares: parseInt(e.target.value)})}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
               />
             </div>
             <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">{labels.loanMultiplier}</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-bold">x</span>
                    <input 
                        type="number"
                        min="1"
                        step="0.5"
                        value={formData.maxLoanMultiplier}
                        onChange={e => setFormData({...formData, maxLoanMultiplier: parseFloat(e.target.value)})}
                        className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    />
                </div>
             </div>
             <div className="col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">Late Payment Fee (Auto-Apply)</label>
               <div className="flex gap-2">
                  <select 
                    value={formData.lateFeeType}
                    onChange={e => setFormData({...formData, lateFeeType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                    className="w-1/3 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed (RWF)</option>
                  </select>
                  <input 
                    type="number"
                    min="0"
                    step={formData.lateFeeType === 'PERCENTAGE' ? 0.1 : 50}
                    value={formData.lateFeeAmount}
                    onChange={e => setFormData({...formData, lateFeeAmount: parseFloat(e.target.value)})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                    placeholder="Fee amount"
                  />
               </div>
             </div>
          </div>
        </div>

        {/* Section 3: Documents */}
        <div className="space-y-4">
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center border-b border-gray-100 pb-2">
             <FileText size={16} className="mr-2" /> Documents
           </h3>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{labels.constitution} (PDF/Image)</label>
              <div className="flex items-center gap-3">
                 <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center shadow-sm">
                    <Upload size={16} className="mr-2 text-gray-500" />
                    {constitutionFile ? 'Replace File' : 'Upload File'}
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                 </label>
                 {constitutionFile ? (
                    <span className="text-xs text-green-600 font-medium flex items-center bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                        <CheckCircle size={12} className="mr-1"/> {labels.fileAttached}
                    </span>
                 ) : (
                    <span className="text-xs text-gray-400">{labels.noFileSelected}</span>
                 )}
              </div>
              <p className="text-xs text-gray-500 mt-2">{labels.uploadInstruction}</p>
           </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onCancel} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors">{labels.cancel}</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex justify-center items-center font-bold shadow-md transition-colors">
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <div className="flex items-center"><Save className="mr-2" size={18} /> {submitLabel || labels.save}</div>}
          </button>
        </div>
      </form>
    </div>
  );
};
