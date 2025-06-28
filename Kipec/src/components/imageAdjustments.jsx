import { useContext } from 'react';
import { ImageContext } from '../context/imageContext';

export default function ImageAdjustments() {
  const { adjustments, updateAdjustments, resetAdjustments } = useContext(ImageContext);

  return (
    <div className="adjustments">
      <div className="control">
        <label>Svjetlina</label>
        <input
          type="range"
          min="-100"
          max="100"
          value={adjustments.brightness}
          onChange={(e) => updateAdjustments({ 
            brightness: parseInt(e.target.value) 
          })}
        />
        <span>{adjustments.brightness}</span>
      </div>
      
      <div className="control">
        <label>Kontrast</label>
        <input
          type="range"
          min="0"
          max="200"
          value={adjustments.contrast}
          onChange={(e) => updateAdjustments({ 
            contrast: parseInt(e.target.value) 
          })}
        />
        <span>{adjustments.contrast}%</span>
      </div>
      
      <button onClick={resetAdjustments}>Reset</button>
    </div>
  );
}