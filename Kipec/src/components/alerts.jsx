import { useContext } from 'react';
import { ImageContext } from '../context/imageContext';

export default function Alerts() {
  const { alerts } = useContext(ImageContext);

  return (
    <div className="alerts-list">
      {alerts.map(alert => (
        <div key={alert.id} className={`alert alert-${alert.type}`}>
          {alert.message}
        </div>
      ))}
    </div>
  );
}