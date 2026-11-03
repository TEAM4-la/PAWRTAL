import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BackButton({ 
  to, 
  onClick, 
  label = 'Back', 
  className = '' 
}) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-xl shadow-xs transition-all mb-4 group cursor-pointer select-none",
        className
      )}
    >
      <ChevronLeft className="w-4 h-4 text-gray-500 group-hover:-translate-x-0.5 transition-transform" />
      <span>{label}</span>
    </button>
  );
}
