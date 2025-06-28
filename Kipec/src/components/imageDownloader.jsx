import { useContext } from 'react';
import { ImageContext } from '../context/imageContext';

export default function ImageDownloader() {
  const { displayImage } = useContext(ImageContext);

  const handleDownload = () => {
    if (!displayImage) return;

    const link = document.createElement('a');
    link.download = `cropped-image-${Date.now()}.png`;
    link.href = displayImage.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={!displayImage}
      className="download-button">
      Preuzmi
    </button>
  );
}