"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import react-p5
const Sketch = dynamic(() => import("react-p5").then((mod) => mod.default));

export default function FaceDistortion() {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [distortionLevel, setDistortionLevel] = useState(1);
    const [error, setError] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const faceApiRef = useRef(null);
    const detectionsRef = useRef([]);
    const p5Ref = useRef(null);

    const setup = (p5, canvasParentRef) => {
        console.log("P5 setup called");
        p5Ref.current = p5;
        p5.createCanvas(640, 480).parent(canvasParentRef);

        if (showCamera) {
            initializeCamera(p5);
        }
    };

    const draw = (p5) => {
        p5.background(220);

        if (!showCamera || !videoRef.current) {
            p5.textSize(24);
            p5.textAlign(p5.CENTER, p5.CENTER);
            p5.fill(0);
            p5.text(
                'Click "Start Camera" to begin',
                p5.width / 2,
                p5.height / 2
            );
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
                    let expandedLeftEyeBox = expandBoundingBox(
                        leftEyeBox,
                        marginFactor
                    );
                    let expandedRightEyeBox = expandBoundingBox(
                        rightEyeBox,
                        marginFactor
                    );
                    let expandedNoseBox = expandBoundingBox(
                        noseBox,
                        marginFactor
                    );
                    let expandedMouthBox = expandBoundingBox(
                        mouthBox,
                        marginFactor
                    );

                    let leftEyeCenter = {
                        x: leftEyeBox.x + leftEyeBox.w / 2,
                        y: leftEyeBox.y + leftEyeBox.h / 2,
                    };
                    let rightEyeCenter = {
                        x: rightEyeBox.x + rightEyeBox.w / 2,
                        y: rightEyeBox.y + rightEyeBox.h / 2,
                    };
                    let noseCenter = {
                        x: noseBox.x + noseBox.w / 2,
                        y: noseBox.y + noseBox.h / 2,
                    };
                    let mouthCenter = {
                        x: mouthBox.x + mouthBox.w / 2,
                        y: mouthBox.y + mouthBox.h / 2,
                    };

                    let leftEyeOffset = {
                        x: -0.3 * distortionLevel,
                        y: 0.4 * distortionLevel,
                    };
                    let rightEyeOffset = {
                        x: 0.3 * distortionLevel,
                        y: 0.4 * distortionLevel,
                    };
                    let noseOffset = { x: 0.0, y: 0.2 * distortionLevel };
                    let mouthOffset = { x: 0.0, y: 0.5 * distortionLevel };

                    let newLeftEyeCenter = {
                        x: leftEyeCenter.x + leftEyeBox.w * leftEyeOffset.x,
                        y: leftEyeCenter.y + leftEyeBox.h * leftEyeOffset.y,
                    };
                    let newRightEyeCenter = {
                        x: rightEyeCenter.x + rightEyeBox.w * rightEyeOffset.x,
                        y: rightEyeCenter.y + rightEyeBox.h * rightEyeOffset.y,
                    };
                    let newNoseCenter = {
                        x: noseCenter.x + noseBox.w * noseOffset.x,
                        y: noseCenter.y + noseBox.h * noseOffset.y,
                    };
                    let newMouthCenter = {
                        x: mouthCenter.x + mouthBox.w * mouthOffset.x,
                        y: mouthCenter.y + mouthBox.h * mouthOffset.y,
                    };

                    let leftEyeDest = {
                        x: newLeftEyeCenter.x - expandedLeftEyeBox.w / 2,
                        y: newLeftEyeCenter.y - expandedLeftEyeBox.h / 2,
                    };
                    let rightEyeDest = {
                        x: newRightEyeCenter.x - expandedRightEyeBox.w / 2,
                        y: newRightEyeCenter.y - expandedRightEyeBox.h / 2,
                    };
                    let noseDest = {
                        x: newNoseCenter.x - expandedNoseBox.w / 2,
                        y: newNoseCenter.y - expandedNoseBox.h / 2,
                    };
                    let mouthDest = {
                        x: newMouthCenter.x - expandedMouthBox.w / 2,
                        y: newMouthCenter.y - expandedMouthBox.h / 2,
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

    const initializeCamera = (p5) => {
        try {
            console.log("Setting up camera");
            if (videoRef.current) {
                videoRef.current.remove();
            }

            videoRef.current = p5.createCapture(p5.VIDEO);
            videoRef.current.size(640, 480);
            videoRef.current.hide();

            console.log("Camera ready, initializing FaceAPI");
            initFaceAPI();
        } catch (err) {
            console.error("Error initializing camera:", err);
            setError("Could not initialize camera");
        }
    };

    const initFaceAPI = () => {
        if (!window.ml5) {
            console.error("ML5 is not available");
            setError("ML5 library not loaded. Please refresh and try again.");
            return;
        }

        try {
            console.log("Starting FaceAPI with model");
            const faceOptions = {
                withLandmarks: true,
                withDescriptors: false,
            };

            setIsCapturing(true);

            faceApiRef.current = window.ml5.faceApi(
                videoRef.current,
                faceOptions,
                modelReady
            );
        } catch (err) {
            console.error("Error initializing FaceAPI:", err);
            setError("Could not initialize FaceAPI model");
        }
    };

    const modelReady = () => {
        console.log("FaceAPI model loaded successfully!");
        setIsModelLoaded(true);
        if (faceApiRef.current) {
            faceApiRef.current.detect(gotResults);
        }
    };

    const gotResults = (err, result) => {
        if (err) {
            console.error("Error detecting faces:", err);
            return;
        }

        if (faceApiRef.current) {
            console.log("Face detection result:", result?.length || 0, "faces");
            detectionsRef.current = result;
            faceApiRef.current.detect(gotResults);
        }
    };

    const startCapture = () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Your browser doesn't support camera access");
            return;
        }

        // First request camera permission
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                // Close the stream immediately - p5 will handle it
                stream.getTracks().forEach((track) => track.stop());

                setShowCamera(true);
                if (p5Ref.current) {
                    initializeCamera(p5Ref.current);
                }
            })
            .catch((err) => {
                console.error("Camera permission error:", err);
                setError(
                    "Camera access denied. Please allow camera access and try again."
                );
            });
    };

    const stopCapture = () => {
        setShowCamera(false);
        setIsCapturing(false);
        setIsModelLoaded(false);

        if (videoRef.current) {
            videoRef.current.remove();
            videoRef.current = null;
        }

        faceApiRef.current = null;
        detectionsRef.current = [];
    };

    const computeBoundingBox = (points) => {
        let minX = Infinity,
            minY = Infinity;
        let maxX = -Infinity,
            maxY = -Infinity;

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

    // Clean up on component unmount
    useEffect(() => {
        return () => {
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
                        <p className="text-xs mt-2">
                            This may take a moment on first load
                        </p>
                    </div>
                )}
                <Sketch setup={setup} draw={draw} />
            </div>

            <div className="flex flex-col gap-4 w-full">
                <div className="flex gap-4 justify-center">
                    {!showCamera ? (
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

                {isCapturing && isModelLoaded && (
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
                            onChange={(e) =>
                                setDistortionLevel(parseFloat(e.target.value))
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
