import React, { useEffect } from 'react';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import '../AlertsUI/AlertasUI.css';

const ToastNotification = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast-container-notification">
      <div className={`toast-item ${tipo}`}>
        {tipo === 'success' ? <FiCheckCircle color="#10b981" /> : <FiXCircle color="#ef4444" />}
        <span>{mensaje}</span>
      </div>
    </div>
  );
};

export default ToastNotification;