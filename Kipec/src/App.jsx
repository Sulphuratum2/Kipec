import { useContext } from 'react'; 
import { ImageProvider, ImageContext } from './context/imageContext'; 
import ImageUploader from './components/imageUploader';
import ImageCanvas from './components/imageCanvas';
import ImageAdjustments from './components/imageAdjustments';
import ImageCropper from './components/imageCropper';
import ImageChecker from './components/imageChecker';
import ImageDownloader from './components/imageDownloader';
import Alerts from './components/alerts';
import LoadingIndicator from './components/LoadingIndicator'; 

function AppContent() {
  const { isLoading } = useContext(ImageContext); 

  return (
    <div className="app">
      {isLoading && <LoadingIndicator />} {}
      <header>
        <h1>Kipec</h1>
        <p>Pripremite savršenu fotografiju za osobnu iskaznicu ili putovnicu</p>
      </header> 
      <div className="workflow-container">
        <ImageUploader />
                
        <div className="editor-container">
          <div className="image-view">
            <ImageCanvas className="main-canvas" />
          </div>
          
          <div className="manual-controls">
            <ImageAdjustments />
            <ImageCropper />
            <ImageChecker />
            <ImageDownloader />
          </div>
        </div>

        <div className="alerts-container"> {}
          <Alerts />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ImageProvider>
      <AppContent />
    </ImageProvider>
  );
}