import { useContext, useEffect, useRef } from 'react';
import { ImageContext } from '../context/imageContext';

export default function ImageCanvas({ className }) {
  const { displayImage } = useContext(ImageContext);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (displayImage) {
      canvas.width = displayImage.width;
      canvas.height = displayImage.height;
      
      ctx.drawImage(displayImage, 0, 0);
    } else {
      canvas.width = 600;
      canvas.height = 400;
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#999';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Učitajte fotografiju', canvas.width/2, canvas.height/2);
    }
  }, [displayImage]);

  return <canvas ref={canvasRef} className={className} />;
}