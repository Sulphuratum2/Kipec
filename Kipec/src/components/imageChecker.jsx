import { useContext } from 'react';
import { ImageContext } from '../context/imageContext';
import { runYoloDetection } from '../utils/useYoloDetection'; 
import { all } from '@tensorflow/tfjs';

export default function ImageChecker() {
  const { displayImage, faceModel, addAlert, clearAlerts, segmentationModel, setIsLoading, getGlobalFormat, setDisplayImage } = useContext(ImageContext);

  
  const checkImage = async () => {
    setIsLoading(true); 
    clearAlerts();
    try {
      let allGood = true;
      if (!displayImage) {
        addAlert('error', 'Nema učitane slike');
        addAlert('info', 'Molimo vas da učitate sliku');
        return;
      }

      if (!faceModel || !segmentationModel) {
        addAlert('error', 'Modeli nisu učitani');
        addAlert('info', 'Molimo vas da pokušate ponovo učitati stranicu');
        return; 
      }

      const canvas = document.createElement('canvas');
      canvas.width = displayImage.width;
      canvas.height = displayImage.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(displayImage, 0, 0);

      const predictions = await faceModel.estimateFaces(canvas, false);
      if (!predictions || predictions.length === 0) {
        addAlert('error', 'Nemoguće prepoznati lice na slici');
        addAlert('info', 'Molimo vas da učitate sliku sa jasnim licem');
        allGood = false; 
      } else { 
        if (predictions.length > 1) {
          addAlert('warning', 'Otkriveno je više od jednog lica');
          addAlert('info', 'Molimo vas da učitate sliku sa jednim licem');
          allGood = false;
        }

        const face = predictions[0];
        const landmarks = face.landmarks;
        const nose = landmarks[2];
        const noseCenterX = nose[0];
        const imageWidth = canvas.width;
        const xDiff = Math.abs(noseCenterX - imageWidth / 2);
        let tolerance = 0.05; 
        console.log(`Nose center X: ${noseCenterX}, Image width*tolerance: ${imageWidth * tolerance}, X diff: ${xDiff}`);
        if (xDiff > tolerance * imageWidth) {
          addAlert('error', 'Lice nije u sredini slike');
          allGood = false;
        }

        const rightEye = landmarks[0];
        const leftEye = landmarks[1];

        const eyeDeltaX = Math.abs(rightEye[0] - leftEye[0]);
        const eyeDeltaY = Math.abs(rightEye[1] - leftEye[1]);

        const eyeLevelDiff = eyeDeltaY / eyeDeltaX;
        const noseMidX = (rightEye[0] + leftEye[0]) / 2;
        const noseOffset = Math.abs(nose[0] - noseMidX) / eyeDeltaX; 
        console.log(`Eye level diff: ${eyeLevelDiff}, Nose offset: ${noseOffset}`);

        if (eyeLevelDiff > 0.15 || noseOffset > 0.35) {
          addAlert('error', 'Lice ne gleda ravno prema kameri');
          addAlert('info', 'Molimo vas da gledate ravno prema kameri');
          allGood = false;
        }

        //Nacrtaj crvenom liniju nosa cijelom visinom slike, zelen kvadrate oko očiju i plavi kvadrat oko lica
        /*
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(nose[0], 0);
        ctx.lineTo(nose[0], canvas.height);
        ctx.stroke();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.strokeRect(rightEye[0] - 10, rightEye[1] - 10, 20, 20);
        ctx.strokeRect(leftEye[0] - 10, leftEye[1] - 10, 20, 20);
        ctx.strokeStyle = 'blue'; 
        ctx.lineWidth = 2;
        ctx.strokeRect(face.topLeft[0], face.topLeft[1], face.bottomRight[0] - face.topLeft[0], face.bottomRight[1] - face.topLeft[1]);
        ctx.drawImage(canvas, 0, 0);
        setDisplayImage(canvas); 
        */
      } 
      
      const dpi = 300;
      const format = getGlobalFormat();
      console.log(`Format: ${format}`);
      const [widthPart, heightPart] = format.split('x').map(Number);

      const canvasRatio = canvas.width / canvas.height;
      const formatRatio = widthPart / heightPart;
      let tolarance = 0.02

      if (Math.abs(canvasRatio - formatRatio) > tolarance) {
        addAlert('error', 'Format slike nije ispravan');
        addAlert('info', `Očekivani format je ${format}`);
        allGood = false;
      }

      const minWidth = widthPart * dpi / 25.4; 
      const minHeight = heightPart * dpi / 25.4; 
      if (canvas.width < minWidth || canvas.height < minHeight) {
        addAlert('error', 'Niska rezolucija slike');
        let poruka = 'Trenutna rezolucija je ' + canvas.width + 'x' + canvas.height + ' piksela';
        addAlert('info', poruka);
        poruka = 'Minimalna preporućena rezolucija je 300 piksela po inču (DPI)';
        addAlert('info', poruka);
        addAlert('info', 'Pokušajte se približiti kameri ili učitati sliku veće rezolucije');
        allGood = false;
      }
      console.log(`Canvas size: ${canvas.width}x${canvas.height}, DPI: ${dpi}, Min size: ${minWidth}x${minHeight}`);

      const detections = await runYoloDetection(canvas);
      const hasHat = detections.some(det =>det.classId ===1);
      console.log(`Detections: ${JSON.stringify(detections)}`);
      if (hasHat) {
        addAlert('warning', 'Otkriveno pokrivalo za glavu');
        addAlert('info', 'Pokrivala za glavu su dozvoljena, ali samo iz religijskih ili medicinskih razloga');
        allGood = false;
      }

      if (allGood) {
        addAlert('success', 'Fotografija se čini ispravnom');
        addAlert('info', 'Trenutno ne pronazimo nikakve greške');
      }
    } catch (error) {
      console.error("Error during image check:", error);
      addAlert('error', 'Dogodila se greška prilikom provjere slike.');
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <button onClick={checkImage} className="check-image-button">
      Provjeri sliku
    </button>
  );
}
