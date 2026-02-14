const { useState, useEffect } = React;
import { Icons } from './Icons.jsx';

export const StarRating = ({ value, onChange, max = 10, size = "md" }) => {
  const [hovered, setHovered] = useState(null);
  const sizeClasses = { sm: "w-5 h-5", md: "w-7 h-7", lg: "w-9 h-9" };
  
  return (
    <div className="flex gap-1">
      {[...Array(max)].map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          onMouseEnter={() => setHovered(i + 1)}
          onMouseLeave={() => setHovered(null)}
          className="transition-transform hover:scale-110"
        >
          <Icons.Star 
            className={`${sizeClasses[size]} ${
              (hovered !== null ? i < hovered : i < value) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            filled={(hovered !== null ? i < hovered : i < value)}
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-medium text-gray-700 self-center">{hovered || value}/{max}</span>
    </div>
  );
};

export const FormInput = ({ label, tooltip, required, error, children }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
      {tooltip && <span className="ml-2 text-gray-400 text-xs">ℹ️ {tooltip}</span>}
    </label>
    {children}
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

export const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in z-50`}>
      {type === 'success' && <Icons.Check className="w-5 h-5" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 p-1 rounded">
        <Icons.X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const InstructionBanner = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg overflow-hidden mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icons.Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <h4 className="font-semibold text-blue-900">{title}</h4>
        </div>
        {isOpen ? (
          <Icons.ChevronUp className="w-5 h-5 text-blue-600" />
        ) : (
          <Icons.ChevronDown className="w-5 h-5 text-blue-600" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-blue-800 space-y-2 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

export const Button = ({ children, variant = 'primary', onClick, disabled, type = 'button', className = '' }) => {
  const baseClasses = "px-6 py-3 font-medium rounded-lg transition-all disabled:opacity-50 flex items-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    success: "bg-green-600 text-white hover:bg-green-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);
