import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import './TupiToast.css';

const TupiToast = ({ mensaje, tipo = 'success', onClose }) => {
  if (!mensaje) return null;

  return (
    <div className={`tupi-toast-popup ${tipo}`}>
      <div className="toast-popup-content">
        {tipo === 'success' ? (
          <CheckCircle2 size={18} className="toast-icon success" />
        ) : (
          <AlertCircle size={18} className="toast-icon error" />
        )}
        <span>{mensaje}</span>
      </div>
      {onClose && (
        <button type="button" className="toast-close-btn" onClick={onClose}>
          <X size={15} />
        </button>
      )}
    </div>
  );
};

export default TupiToast;