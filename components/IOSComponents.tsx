import React from 'react';
import { Loader2, ChevronRight } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  isLoading?: boolean;
}

export const IOSButton: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading,
  ...props 
}) => {
  const baseStyles = "w-full py-3.5 rounded-xl font-semibold text-[17px] transition-transform active:scale-[0.98] flex items-center justify-center";
  
  const variants = {
    primary: "bg-ios-blue text-white active:opacity-90",
    secondary: "bg-gray-200 text-black active:bg-gray-300",
    destructive: "bg-white text-ios-red active:bg-gray-50",
    ghost: "bg-transparent text-ios-blue hover:opacity-70"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
      {children}
    </button>
  );
};

export const IOSCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-ios-card rounded-[12px] shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

interface IOSInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  labelClassName?: string;
}

export const IOSInput: React.FC<IOSInputProps> = ({ label, error, helperText, className = '', labelClassName = "text-[17px]", ...props }) => (
  <div className="flex flex-col py-3 border-b border-ios-separator last:border-0">
    <div className="flex justify-between items-center">
      <div className="w-1/3 shrink-0 flex flex-col justify-center">
        <label className={`${labelClassName} text-black`}>{label}</label>
        {helperText && <span className="text-[10px] text-ios-gray mt-0.5 leading-tight">{helperText}</span>}
      </div>
      <input 
        className={`w-2/3 text-right bg-transparent ${className || 'text-[17px]'} text-ios-blue placeholder-gray-400 focus:outline-none`}
        {...props}
      />
    </div>
    {error && <span className="text-xs text-ios-red mt-1 text-right">{error}</span>}
  </div>
);

export const IOSSelectRow: React.FC<{ 
  label: string; 
  value: string; 
  placeholder?: string; 
  onClick: () => void;
  labelClassName?: string;
  valueClassName?: string;
}> = ({ 
  label, 
  value, 
  placeholder, 
  onClick, 
  labelClassName = "text-[17px]", 
  valueClassName = "text-[17px]"
}) => (
  <div onClick={onClick} className="flex flex-col py-3 border-b border-ios-separator last:border-0 cursor-pointer active:bg-gray-50 transition-colors group">
    <div className="flex justify-between items-center">
      <label className={`${labelClassName} text-black w-1/3 shrink-0`}>{label}</label>
      <div className={`w-2/3 text-right ${valueClassName} flex items-center justify-end gap-1 ${value ? 'text-ios-blue' : 'text-gray-400'}`}>
        <span className="truncate">{value || placeholder}</span>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
      </div>
    </div>
  </div>
);

export const IOSHeader: React.FC<{ title: string; action?: React.ReactNode }> = ({ title, action }) => (
  <div className="pt-12 pb-4 px-4 bg-ios-bg sticky top-0 z-10 flex justify-between items-end backdrop-blur-xl bg-opacity-80 border-b border-gray-200/50">
    <h1 className="text-[34px] font-bold leading-tight tracking-tight text-black">{title}</h1>
    {action && <div className="pb-1">{action}</div>}
  </div>
);
