import React, { useState, useEffect, useRef } from 'react';
import { Member } from '../types';
import { Search, X, CheckCircle } from 'lucide-react';

interface MemberSearchSelectProps {
  members: Member[];
  selectedMemberId: string;
  onSelect: (memberId: string) => void;
  onClear?: () => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  filterActive?: boolean;
  showSavings?: boolean;
  shareValue?: number;
  className?: string;
  showAllOption?: boolean;
  allOptionLabel?: string;
}

export const MemberSearchSelect: React.FC<MemberSearchSelectProps> = ({
  members,
  selectedMemberId,
  onSelect,
  onClear,
  placeholder = "Search members by name, phone, or ID...",
  label,
  required = false,
  filterActive = false,
  showSavings = false,
  shareValue = 0,
  className = "",
  showAllOption = false,
  allOptionLabel = "All Members"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // Filter members
  const filteredMembers = members.filter(member => {
    if (filterActive && member.status !== 'ACTIVE') return false;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      member.fullName.toLowerCase().includes(search) ||
      member.phone.includes(search) ||
      member.nationalId.includes(search) ||
      (member.email && member.email.toLowerCase().includes(search))
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Update search term when member is selected
  useEffect(() => {
    if (selectedMember) {
      setSearchTerm(selectedMember.fullName);
    } else if (showAllOption && !selectedMemberId) {
      setSearchTerm(allOptionLabel);
    } else {
      setSearchTerm('');
    }
  }, [selectedMemberId, selectedMember, showAllOption, allOptionLabel]);

  const handleSelect = (memberId: string) => {
    onSelect(memberId);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    setShowDropdown(false);
    if (onClear) {
      onClear();
    } else {
      onSelect('');
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
            required={required}
          />
          {(selectedMemberId || (showAllOption && !selectedMemberId && searchTerm)) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* Member Dropdown */}
        {showDropdown && (
          <div 
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto custom-scrollbar"
          >
            {filteredMembers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <Search size={24} className="mx-auto mb-2 text-gray-300" />
                <p>No members found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {showAllOption && (
                  <button
                    type="button"
                    onClick={() => handleSelect('')}
                    className={`w-full text-left p-3 hover:bg-blue-50 transition-colors ${
                      !selectedMemberId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{allOptionLabel}</span>
                      {!selectedMemberId && (
                        <CheckCircle size={18} className="text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                )}
                {filteredMembers.map((member) => {
                  const isSelected = selectedMemberId === member.id;
                  const memberSavings = showSavings ? member.totalShares * shareValue : 0;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleSelect(member.id)}
                      className={`w-full text-left p-3 hover:bg-blue-50 transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{member.fullName}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <span className="font-mono">{member.phone}</span>
                              {showSavings && memberSavings > 0 && (
                                <>
                                  <span>•</span>
                                  <span>Savings: {memberSavings.toLocaleString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle size={18} className="text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Selected Member Display */}
        {selectedMemberId && selectedMember && !showAllOption && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {selectedMember.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium text-blue-900">{selectedMember.fullName}</p>
                <p className="text-xs text-blue-700">{selectedMember.phone}</p>
              </div>
            </div>
          </div>
        )}
        {/* All Members Display for filters */}
        {showAllOption && !selectedMemberId && (
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-700">{allOptionLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
};
