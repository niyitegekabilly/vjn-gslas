
import React, { useRef, useState, useContext } from 'react';
import { Upload, Loader2, AlertCircle, CheckCircle, FileSpreadsheet, X } from 'lucide-react';
import { AppContext } from '../App';
import { LABELS } from '../constants';

interface Field {
  key: string;
  label: string;
  sample: string;
  required?: boolean;
}

interface CsvImporterProps {
  entityName: string;
  fields: Field[];
  onImport: (data: any[]) => Promise<{ success: boolean; message: string }>;
  templateFileName?: string;
  className?: string;
}

export const CsvImporter: React.FC<CsvImporterProps> = ({ 
  entityName, 
  fields, 
  onImport,
  templateFileName,
  className
}) => {
  const { lang } = useContext(AppContext);
  const labels = LABELS[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const downloadTemplate = () => {
    const headers = fields.map(f => f.key).join(',');
    const sample = fields.map(f => f.sample).join(',');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sample;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", templateFileName || `${entityName.toLowerCase()}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = (file: File) => {
    setImporting(true);
    setResult(null);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        
        if (lines.length < 2) throw new Error("File is empty or missing data rows");
        
        // Parse headers (handle potential quotes)
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        // Normalize headers for comparison (case-insensitive)
        const normalizedHeaders = headers.map(h => h.toLowerCase());
        const normalizedFields = fields.map(f => ({ ...f, lowerKey: f.key.toLowerCase() }));

        // Validate required headers
        const missingRequired = normalizedFields
            .filter(f => f.required && !normalizedHeaders.includes(f.lowerKey))
            .map(f => f.key);

        if (missingRequired.length > 0) {
            throw new Error(`Missing required columns: ${missingRequired.join(', ')}`);
        }

        const data = lines.slice(1).map(line => {
            // Simple split handling (note: doesn't handle commas inside quotes perfectly, acceptable for simple templates)
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row: any = {};
            
            headers.forEach((h, i) => {
                // Map the header from file to the expected key if possible, or keep original
                const fieldMatch = normalizedFields.find(f => f.lowerKey === h.toLowerCase());
                const key = fieldMatch ? fieldMatch.key : h;
                row[key] = values[i];
            });
            return row;
        });

        const response = await onImport(data);
        setResult({ 
            type: response.success ? 'success' : 'error', 
            message: response.message 
        });
      } catch (err: any) {
        setResult({ type: 'error', message: err.message });
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button 
        onClick={downloadTemplate}
        className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition shadow-sm whitespace-nowrap"
        title={`Download ${entityName} CSV Template`}
      >
        <FileSpreadsheet size={16} className="mr-2 text-green-600" />
        {labels.template}
      </button>
      
      <div className="relative">
        <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />
        <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition shadow-sm whitespace-nowrap disabled:opacity-50"
        >
            {importing ? <Loader2 size={16} className="animate-spin mr-2"/> : <Upload size={16} className="mr-2"/>}
            {labels.importCsv}
        </button>
        
        {/* Result Toast */}
        {result && (
            <div className={`absolute top-full right-0 mt-2 w-72 p-3 rounded-lg shadow-xl border text-xs z-50 animate-in fade-in slide-in-from-top-2 ${result.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <div className="flex items-start">
                    {result.type === 'success' ? <CheckCircle size={14} className="mr-2 mt-0.5 flex-shrink-0"/> : <AlertCircle size={14} className="mr-2 mt-0.5 flex-shrink-0"/>}
                    <div className="flex-1">
                        <p className="font-bold mb-1">{result.type === 'success' ? 'Import Successful' : 'Import Failed'}</p>
                        <p>{result.message}</p>
                    </div>
                    <button onClick={() => setResult(null)} className="ml-2 text-gray-400 hover:text-gray-600"><X size={14}/></button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
