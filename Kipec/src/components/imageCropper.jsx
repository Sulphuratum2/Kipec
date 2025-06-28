import { useContext, useState, useRef, useEffect } from 'react';
import { ImageContext } from '../context/imageContext';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

const countryDocumentFormats = {
  Sve: [
    { label: '35x45 mm', value: '35x45' },
    { label: '30x35 mm', value: '30x35' },
    { label: '4x5 cm', value: '40x50' },
    { label: '2.5x3.5 cm', value: '25x35' },
    { label: '5x7 cm', value: '50x70' },
    { label: '2x2 inch', value: '51x51' },
    { label: '1.5x1.5 inch', value: '38x38' },
  ],
  Albania:[
    { label: 'Passport (4x5 cm)', value: '40x50' },
  ],
  Argentina: [
    { label: 'Passport (1.5x1.5 inch)', value: '38x38' },
  ],
  Croatia: [
    { label: 'Osobna, putovnica, vozačka (35x45 mm)', value: '35x45' },
    { label: 'Putni list (30x35 mm)', value: '30x35' },
  ],
  USA: [
    { label: 'Passport (2x2 inch)', value: '51x51' },
  ],
  Japan: [
    { label: 'Passport (3.5x4.5 cm)', value: '35x45' },
  ],
  France: [
    { label: 'Passport (35x45 mm)', value: '35x45' },
  ],
  Germany: [
    { label: 'Passport (35x45 mm)', value: '35x45' },
  ],
  EU: [
    { label: 'Passport (35x45 mm)', value: '35x45' },
  ],
  UK: [
    { label: 'Passport (35x45 mm)', value: '35x45' },
  ],
  Russia: [
    { label: 'Passport (35x45 mm)', value: '35x45' },
  ],
  Italy: [
    { label: 'Passport (35x45 mm)', value: '35x45' },
  ],
  China: [
    { label: 'Passport (33x48 mm)', value: '33x48' },
    { label: 'Visa (2x2 inch)', value: '51x51' },
  ],
  India: [
    { label: 'Passport, OCI (35x35 mm)', value: '35x35' },
    { label: 'Passport (2x2 inch)', value: '51x51' },
    { label: 'Passport (3.5x4.5 cm)', value: '35x45' },
    { label: 'Visa (2x2 inch)', value: '51x51' },
    { label: 'PAN Card (2.5x3.5 cm)', value: '25x35' },
  ],
  Brazil: [
    { label: 'Passport (5x7 cm)', value: '50x70' },
    { label: 'Visa (2x2 inch)', value: '51x51' },
    { label: 'ID Card (3x4 cm)', value: '30x40' },
  ],
};

export default function ImageCropper() {
  const { displayImage, setDisplayImage, setIsLoading, clearAlerts, setGlobalFormat} = useContext(ImageContext);
  const [faceModel, setFaceModel] = useState(null);
  const [segmentationModel, setSegmentationModel] = useState(null);

  const [selectedCountry, setSelectedCountry] = useState('Croatia');
  const [availableFormats, setAvailableFormats] = useState(countryDocumentFormats['Sve']);
  const [format, setFormat] = useState(availableFormats[0]?.value || '35x45');

  const canvasRef = useRef(null);


  useEffect(() => {
    async function loadModels() {
      await tf.ready();

      const faceDetectionModel = await blazeface.load({
        maxFaces: 1,
        inputWidth: 128,
        inputHeight: 128,
      });
      setFaceModel(faceDetectionModel);

      const selfieSegmentationInstance = new SelfieSegmentation({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
      });

      selfieSegmentationInstance.setOptions({
        modelSelection: 1
      });

      await selfieSegmentationInstance.initialize();
      setSegmentationModel(selfieSegmentationInstance);
    }

    loadModels();

    return () => {
      if (faceModel) {
        faceModel.dispose();
      }
      if (segmentationModel) {
        segmentationModel.close();
      }
    };
  }, []);

  useEffect(() => {
    const newFormats = countryDocumentFormats[selectedCountry] || countryDocumentFormats.Sve; 
    setAvailableFormats(newFormats);
    if (newFormats.length > 0) {
      setFormat(newFormats[0].value);
      setGlobalFormat(newFormats[0].value);
    } else {
      setFormat('');
      setGlobalFormat('');
    }
  }, [selectedCountry]);


  const makeWhiteBackground = async (imageSource) => {
    if (!imageSource || !segmentationModel) {
      alert('Model za segmentaciju nije učitan ili nema slike za obradu.');
      return null; 
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = imageSource.width;
      canvas.height = imageSource.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageSource, 0, 0);

      const results = await new Promise((resolve) => {
        segmentationModel.onResults(resolve);
        segmentationModel.send({ image: canvas });
      });

      const maskCanvas = results.segmentationMask;

      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      const outputCtx = outputCanvas.getContext('2d');

      outputCtx.fillStyle = '#eeeeee';
      outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
      
      const personCanvas = document.createElement('canvas');
      personCanvas.width = canvas.width;
      personCanvas.height = canvas.height;
      const personCtx = personCanvas.getContext('2d');
      personCtx.drawImage(imageSource, 0, 0);
      personCtx.globalCompositeOperation = 'destination-in';
      personCtx.drawImage(maskCanvas, 0, 0);

      outputCtx.drawImage(personCanvas, 0, 0);

      return outputCanvas; 

    } catch (error) {
      console.error('White background failed:', error);
      alert('Greška pri izradi bijele pozadine.');
      return null;
    }
  };

  const handleCrop = async (imageSource) => {
    if (!imageSource || !faceModel) {
      alert('Model za prepoznavanje lica nije učitan ili nema slike za obradu.');
      return null; 
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageSource.width;
    tempCanvas.height = imageSource.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(imageSource, 0, 0);

    try {
      const predictions = await faceModel.estimateFaces(tempCanvas, false);
      if (!predictions || predictions.length === 0) {
        alert('Lice nije pronađeno na fotografiji.');
        return null; 
      }

      const [widthPart, heightPart] = format.split('x').map(Number);
      const targetAspect = heightPart / widthPart;

      const face = predictions[0];
      const landmarks = face.landmarks;
      const nose = landmarks[2];
      const noseCenterX = nose[0];
      const faceWidth = face.bottomRight[0] - face.topLeft[0];
      const faceCenterY = (face.topLeft[1] + face.bottomRight[1]) / 2;

      const cropWidth = faceWidth * 1.65;
      const cropHeight = cropWidth * targetAspect;

      let cropX = noseCenterX - cropWidth / 2;
      let cropY = faceCenterY - cropHeight * 0.65;

      if (cropX < 0) cropX = 0;
      if (cropX + cropWidth > imageSource.width) cropX = imageSource.width - cropWidth;
      if (cropY < 0) cropY = 0;
      if (cropY + cropHeight > imageSource.height) cropY = imageSource.height - cropHeight;

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;
      const croppedCtx = croppedCanvas.getContext('2d');

      croppedCtx.drawImage(
        imageSource,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );

      tf.disposeVariables(); 

      return croppedCanvas; 
    } catch (error) {
      console.error('Face detection failed:', error);
      alert('Greška pri izrezivanju slike. Lice nije pronađeno ili je došlo do druge greške.');
      return null;
    }
  };

  const automatic = async () => {
    clearAlerts();
    setIsLoading(true);
    if (!displayImage || !faceModel || !segmentationModel || !format) {
      alert('Nedostaju modeli, slika ili format.');
      setIsLoading(false);
      return;
    }

    try {
      const croppedImage = await handleCrop(displayImage);
      if (!croppedImage) {
        return;
      }
      const finalImage = await makeWhiteBackground(croppedImage);
      if (!finalImage) {
        return;
      }
      setDisplayImage(finalImage);

    } catch (error) {
      console.error('Automatic processing failed:', error);
      alert('Došlo je do greške tijekom automatske obrade.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cropper-container">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="format-selector">
        <label htmlFor="country-select">Država:</label>
        <select
          id="country-select"
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          {Object.keys(countryDocumentFormats).map(countryCode => {
            return <option key={countryCode} value={countryCode}>{countryCode}</option>;
          })}
        </select>
      </div>

      <div className="format-selector">
        <label htmlFor="format-select">Format:</label>
        <select
          id="format-select"
          value={format}
          onChange={(e) => {setFormat(e.target.value); setGlobalFormat(e.target.value)}}
          disabled={availableFormats.length === 0}
        >
          {availableFormats.map(fmt => (
            <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
          ))}
        </select>
      </div>

      <button onClick={async () => {
        clearAlerts();
        setIsLoading(true);
        const result = await handleCrop(displayImage);
        if (result) {
          setDisplayImage(result);
        }
        setIsLoading(false);
      }} disabled={!displayImage || !faceModel || !format}>
        {faceModel ? 'Izreži' : 'Učitavanje...'}
      </button>

      <button onClick={async () => {
        clearAlerts();
        setIsLoading(true);
        const result = await makeWhiteBackground(displayImage);
        if (result) {
          setDisplayImage(result);
        }
        setIsLoading(false);
      }} disabled={!displayImage || !segmentationModel} className="white-bg-button">
        {segmentationModel ? 'Bijela pozadina' : 'Učitavanje...'}
      </button>

      <button onClick={automatic} disabled={!displayImage || !faceModel || !segmentationModel || !format} className="automatic-button">
        {faceModel && segmentationModel ? 'Automatsko uređivanje' : 'Učitavanje...'}
      </button>
    </div>
  );
}