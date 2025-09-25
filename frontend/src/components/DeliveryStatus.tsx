import React from 'react';
import './DeliveryStatus.css';

interface DeliveryStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'failed';
}

const DeliveryStatus: React.FC<DeliveryStatusProps> = ({ status }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return '⏳';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'failed':
        return '⚠️';
      default:
        return '';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'failed':
        return 'Failed';
      default:
        return '';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'sending':
        return 'sending';
      case 'sent':
        return 'sent';
      case 'delivered':
        return 'delivered';
      case 'failed':
        return 'failed';
      default:
        return '';
    }
  };

  return (
    <div className={`delivery-status ${getStatusClass()}`} title={getStatusText()}>
      <span className="status-icon">{getStatusIcon()}</span>
    </div>
  );
};

export default DeliveryStatus;