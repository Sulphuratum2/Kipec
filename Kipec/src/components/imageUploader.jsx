import { useContext, useRef, useEffect, useState } from 'react';
import { ImageContext } from '../context/imageContext';

export default function ImageUploader() {
  const { setOriginalImage, loadModels, setDisplayImage, clearAlerts } = useContext(ImageContext);
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const handleUpload = (e) => {
    clearAlerts();
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setDisplayImage(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="uploader">
      <label htmlFor="file-upload">
        Odaberite fotografiju
      </label>
      <input
        id="file-upload"
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleUpload}
      />
      {fileName && <div className="file-name">{fileName}</div>}
    </div>
  );
}