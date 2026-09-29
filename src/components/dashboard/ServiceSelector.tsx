import React, { useState, useRef, useEffect } from 'react';
import { Scissors } from 'lucide-react';
import { SalonService } from '@/lib/api';
import { useGlobalData } from '@/context/GlobalDataContext';

interface ServiceSelectorProps {
  onAddService: (service: SalonService) => void;
  disabled?: boolean;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onAddService, disabled }) => {
  const { salonServices } = useGlobalData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredServices = salonServices.filter(s => 
    s.active && s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredServices.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredServices[highlightedIndex]) {
        onAddService(filteredServices[highlightedIndex]);
        setSearchTerm('');
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full z-40" ref={wrapperRef}>
      <Scissors className="absolute left-3 top-2.5 text-pink-500 w-5 h-5" />
      <input
        type="text"
        placeholder="Search Salon Services..."
        value={searchTerm}
        onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="pl-10 pr-4 py-2.5 w-full border border-pink-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm bg-white/90 backdrop-blur"
      />
      
      {isOpen && filteredServices.length > 0 && (
        <div className="absolute top-full mt-1 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filteredServices.map((service, idx) => (
            <div
              key={service.id}
              className={`px-3 py-1.5 text-sm cursor-pointer border-b last:border-b-0 flex justify-between items-center transition-colors ${idx === highlightedIndex ? 'bg-pink-600 text-white' : 'hover:bg-pink-50 text-gray-800'}`}
              onMouseEnter={() => setHighlightedIndex(idx)}
              onClick={() => {
                onAddService(service);
                setSearchTerm('');
                setIsOpen(false);
              }}
            >
              <div>
                <div className={`font-medium ${idx === highlightedIndex ? 'text-white' : 'text-gray-800'}`}>{service.name}</div>
                {service.duration ? <div className={`text-xs ${idx === highlightedIndex ? 'text-pink-100' : 'text-gray-400'}`}>{service.duration} mins</div> : null}
              </div>
              <div className="text-right">
                <div className={`font-bold ${idx === highlightedIndex ? 'text-white' : 'text-green-600'}`}>₹{service.price}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceSelector;
