'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import react-p5 with no SSR
const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default));

export default function FaceDistortion() {
  const [isMl5Available, setIsMl5Available] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [distortionLevel, setDistortionLevel] = useState(1);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const faceApiRef = useRef(null);
  const detectionsRef = useRef([]);

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(640, 480).parent(canvasParentRef);
    
    if (typeof navigator !== 'undefined' && isCapturing) {
      try {
        videoRef.current = p5.createCapture(p5.VIDEO);
        videoRef.current.size(p5.width, p5.height);
        videoRef.current.hide();

        if (typeof ml5 !== 'undefined' && isMl5Available) {
          const faceOptions = {
            withLandmarks: true,
            withDescriptors: false,
          };

          faceApiRef.current = ml5.faceApi(videoRef.current, faceOptions, () => {
            console.log("FaceAPI model loaded!");
            setIsModelLoaded(true);
            faceApiRef.current.detect(gotResults);
          });
        } else {
          setError("ML5 library not available. Please refresh the page.");
        }
      } catch (err) {
        console.error("Error setting up video:", err);
        setError("Could not access camera. Please check permissions and try again.");
      }
    }
  };

  const startCapture = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Your browser doesn't support camera access");
      return;
    }
    
    // First request camera permission explicitly
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        // Stop the stream immediately, p5 will handle it
        stream.getTracks().forEach(track => track.stop());
        setIsCapturing(true);
      })
      .catch(err => {
        console.error("Camera access error:", err);
        setError("Could not access camera. Please check permissions and try again.");
      });
  };

  const stopCapture = () => {
    setIsCapturing(false);
    if (videoRef.current) {
      videoRef.current.remove();
      videoRef.current = null;
    }
  };

  const gotResults = (err, result) => {
    if (err) {
      console.error(err);
      return;
    }
    
    if (faceApiRef.current) {
      detectionsRef.current = result;
      faceApiRef.current.detect(gotResults);
    }
  };

  const computeBoundingBox = (points) => {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (let pt of points) {
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    }
    
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  };

  const expandBoundingBox = (box, factor) => {
    let newW = box.w * factor;
    let newH = box.h * factor;
    let newX = box.x - (newW - box.w) / 2;
    let newY = box.y - (newH - box.h) / 2;
    
    return { x: newX, y: newY, w: newW, h: newH };
  };

  const draw = (p5) => {
    p5.background(220);
    
    if (!isCapturing || !videoRef.current) {
      p5.textSize(24);
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.fill(0);
      p5.text('Click "Start Camera" to begin', p5.width/2, p5.height/2);
      return;
    }
    
    p5.image(videoRef.current, 0, 0, p5.width, p5.height);
    const srcFrame = p5.get();
    
    const detections = detectionsRef.current;
    if (detections && detections.length > 0) {
      for (let i = 0; i < detections.length; i++) {
        let detection = detections[i];
        if (detection.landmarks) {
          let leftEyePoints = detection.landmarks.getLeftEye();
          let rightEyePoints = detection.landmarks.getRightEye();
          let nosePoints = detection.landmarks.getNose();
          let mouthPoints = detection.landmarks.getMouth();

          let leftEyeBox = computeBoundingBox(leftEyePoints);
          let rightEyeBox = computeBoundingBox(rightEyePoints);
          let noseBox = computeBoundingBox(nosePoints);
          let mouthBox = computeBoundingBox(mouthPoints);
         
          let marginFactor = 1.4;
          let expandedLeftEyeBox = expandBoundingBox(leftEyeBox, marginFactor);
          let expandedRightEyeBox = expandBoundingBox(rightEyeBox, marginFactor);
          let expandedNoseBox = expandBoundingBox(noseBox, marginFactor);
          let expandedMouthBox = expandBoundingBox(mouthBox, marginFactor);
          
          let leftEyeCenter = { 
            x: leftEyeBox.x + leftEyeBox.w/2, 
            y: leftEyeBox.y + leftEyeBox.h/2 
          };
          let rightEyeCenter = { 
            x: rightEyeBox.x + rightEyeBox.w/2, 
            y: rightEyeBox.y + rightEyeBox.h/2 
          };
          let noseCenter = { 
            x: noseBox.x + noseBox.w/2, 
            y: noseBox.y + noseBox.h/2 
          };
          let mouthCenter = { 
            x: mouthBox.x + mouthBox.w/2, 
            y: mouthBox.y + mouthBox.h/2 
          };

          let leftEyeOffset = { x: -0.3 * distortionLevel, y: 0.4 * distortionLevel };
          let rightEyeOffset = { x: 0.3 * distortionLevel, y: 0.4 * distortionLevel };
          let noseOffset = { x: 0.0, y: 0.2 * distortionLevel };
          let mouthOffset = { x: 0.0, y: 0.5 * distortionLevel };

          let newLeftEyeCenter = { 
            x: leftEyeCenter.x + leftEyeBox.w * leftEyeOffset.x, 
            y: leftEyeCenter.y + leftEyeBox.h * leftEyeOffset.y 
          };
          let newRightEyeCenter = { 
            x: rightEyeCenter.x + rightEyeBox.w * rightEyeOffset.x, 
            y: rightEyeCenter.y + rightEyeBox.h * rightEyeOffset.y 
          };
          let newNoseCenter = { 
            x: noseCenter.x + noseBox.w * noseOffset.x, 
            y: noseCenter.y + noseBox.h * noseOffset.y 
          };
          let newMouthCenter = { 
            x: mouthCenter.x + mouthBox.w * mouthOffset.x, 
            y: mouthCenter.y + mouthBox.h * mouthOffset.y 
          };

          let leftEyeDest = {
            x: newLeftEyeCenter.x - expandedLeftEyeBox.w / 2,
            y: newLeftEyeCenter.y - expandedLeftEyeBox.h / 2
          };
          let rightEyeDest = {
            x: newRightEyeCenter.x - expandedRightEyeBox.w / 2,
            y: newRightEyeCenter.y - expandedRightEyeBox.h / 2
          };
          let noseDest = {
            x: newNoseCenter.x - expandedNoseBox.w / 2,
            y: newNoseCenter.y - expandedNoseBox.h / 2
          };
          let mouthDest = {
            x: newMouthCenter.x - expandedMouthBox.w / 2,
            y: newMouthCenter.y - expandedMouthBox.h / 2
          };

          p5.copy(
            srcFrame, 
            parseInt(expandedLeftEyeBox.x), 
            parseInt(expandedLeftEyeBox.y), 
            parseInt(expandedLeftEyeBox.w), 
            parseInt(expandedLeftEyeBox.h),
            parseInt(leftEyeDest.x), 
            parseInt(leftEyeDest.y), 
            parseInt(expandedLeftEyeBox.w), 
            parseInt(expandedLeftEyeBox.h)
          );
               
          p5.copy(
            srcFrame, 
            parseInt(expandedRightEyeBox.x), 
            parseInt(expandedRightEyeBox.y), 
            parseInt(expandedRightEyeBox.w), 
            parseInt(expandedRightEyeBox.h),
            parseInt(rightEyeDest.x), 
            parseInt(rightEyeDest.y), 
            parseInt(expandedRightEyeBox.w), 
            parseInt(expandedRightEyeBox.h)
          );
               
          p5.copy(
            srcFrame, 
            parseInt(expandedNoseBox.x), 
            parseInt(expandedNoseBox.y), 
            parseInt(expandedNoseBox.w), 
            parseInt(expandedNoseBox.h),
            parseInt(noseDest.x), 
            parseInt(noseDest.y), 
            parseInt(expandedNoseBox.w), 
            parseInt(expandedNoseBox.h)
          );
               
          p5.copy(
            srcFrame, 
            parseInt(expandedMouthBox.x), 
            parseInt(expandedMouthBox.y), 
            parseInt(expandedMouthBox.w), 
            parseInt(expandedMouthBox.h),
            parseInt(mouthDest.x), 
            parseInt(mouthDest.y), 
            parseInt(expandedMouthBox.w), 
            parseInt(expandedMouthBox.h)
          );
        }
      }
    }
  };

  useEffect(() => {
    // Check if ml5 is available
    const checkMl5 = setInterval(() => {
      if (typeof window !== 'undefined' && (window.ml5 || window.ml5Ready)) {
        console.log("ML5 detected");
        setIsMl5Available(true);
        clearInterval(checkMl5);
      }
    }, 500);

    return () => {
      clearInterval(checkMl5);
      if (videoRef.current) {
        videoRef.current.remove();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-80 text-white p-4">
            <p>{error}</p>
          </div>
        )}
        {isCapturing && !isModelLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white p-4">
            <div className="animate-spin h-8 w-8 border-2 border-white rounded-full border-t-transparent mb-2"></div>
            <p>Loading FaceAPI model...</p>
            <p className="text-xs mt-2">This may take a moment on first load</p>
          </div>
        )}
        <Sketch setup={setup} draw={draw} />
      </div>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex gap-4 justify-center">
          {!isCapturing ? (
            <button 
              onClick={startCapture}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Start Camera
            </button>
          ) : (
            <button 
              onClick={stopCapture}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Stop Camera
            </button>
          )}
        </div>
        
        {isCapturing && (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distortion Level: {distortionLevel.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={distortionLevel}
              onChange={(e) => setDistortionLevel(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
}