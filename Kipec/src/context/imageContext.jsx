import { createContext, useState, useCallback, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

export const ImageContext = createContext();

export function ImageProvider({ children }) {
  const [originalImage, setOriginalImageState] = useState(null);
  const [displayImage, setDisplayImage] = useState(null);
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 100
  });
  const [faceModel, setFaceModel] = useState(null);
  const [segmentationModel, setSegmentationModel] = useState(null);
  const [showManualEditor, setShowManualEditor] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const alertTimeoutsRef = useRef([]); 
  const [globalFormat, setGlobalFormat] = useState([]);

  const setOriginalImage = (img) => {
    clearAlerts();
    setOriginalImageState(img);
    setDisplayImage(img); 
    setShowManualEditor(false); 
  };

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    try {
      await tf.ready();
      
      const faceDetectionModel = await blazeface.load({
        maxFaces: 1,
        inputWidth: 128,
        inputHeight: 128,
      });
      setFaceModel(faceDetectionModel);

      const selfieSegmentation = new SelfieSegmentation({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
      });

      selfieSegmentation.setOptions({
        modelSelection: 1 
      });

      await selfieSegmentation.initialize();
      setSegmentationModel(selfieSegmentation);
    } catch (error) {
      addAlert('error', 'Greška pri učitavanju modela za obradu slike');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getGlobalFormat = () => {
    return globalFormat;
  }

  const addAlert = (type, message) => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, type, message }]);
    const timeoutId = setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
      alertTimeoutsRef.current = alertTimeoutsRef.current.filter(tid => tid !== timeoutId);
    }, 20000);
    alertTimeoutsRef.current.push(timeoutId); 
    };

  const clearAlerts = () => {
    alertTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    alertTimeoutsRef.current = []; 
    setAlerts([]);
  };

  const updateAdjustments = (newAdjustments) => {
    setAdjustments(prev => ({ ...prev, ...newAdjustments }));
    applyAdjustments();
  };

  const resetAdjustments = () => {
    setAdjustments({ brightness: 0, contrast: 100 });
    setDisplayImage(originalImage);
  };

  const applyAdjustments = () => {
    if (!originalImage) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    const ctx = canvas.getContext('2d');
    
    ctx.filter = `
      brightness(${100 + adjustments.brightness}%)
      contrast(${adjustments.contrast}%)
    `;
    
    ctx.drawImage(originalImage, 0, 0);
    setDisplayImage(canvas);
  };

  const value = {
    originalImage,
    displayImage,
    setOriginalImage,
    setDisplayImage,
    adjustments,
    updateAdjustments,
    resetAdjustments,
    faceModel,
    segmentationModel,
    showManualEditor,
    setShowManualEditor,
    alerts,
    addAlert,
    clearAlerts,
    isLoading,
    loadModels, 
    setIsLoading,
    getGlobalFormat,
    setGlobalFormat
  };
  return (
    <ImageContext.Provider value={value}>
      {children}
    </ImageContext.Provider>
  );
}