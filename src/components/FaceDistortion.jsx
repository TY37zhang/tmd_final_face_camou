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
    const [previousDetections, setPreviousDetections] = useState([]);
    const [smoothFactor, setSmoothFactor] = useState(0.3); // For smooth transitions
    const [distortionType, setDistortionType] = useState("stretch"); // 'stretch', 'bulge', 'twist', 'dazzle', 'juggalo', 'gan3d', 'contour', 'cvdazzle', 'facepaint', 'blur', 'mosaic'
    const [dazzlePattern, setDazzlePattern] = useState("geometric"); // 'geometric', 'asymmetric', 'minimal'
    const [juggaloStyle, setJuggaloStyle] = useState("classic"); // 'classic', 'modern', 'extreme'
    const [gan3dStyle, setGan3dStyle] = useState("geometric"); // 'geometric', 'organic', 'hybrid'
    const [gan3dIntensity, setGan3dIntensity] = useState(0.5);
    const [contourStyle, setContourStyle] = useState("natural"); // 'natural', 'dramatic', 'avantgarde'
    const [contourIntensity, setContourIntensity] = useState(0.5);
    const [cvdazzleStyle, setCvdazzleStyle] = useState("mesh"); // 'mesh', 'asymmetric', 'occlusion'
    const [facepaintStyle, setFacepaintStyle] = useState("cubist"); // 'cubist', 'scarf', 'fractal'
    const [blurIntensity, setBlurIntensity] = useState(0.5);
    const [mosaicSize, setMosaicSize] = useState(10);

    const setup = (p5, canvasParentRef) => {
        console.log("P5 setup called");
        p5Ref.current = p5;
        p5.createCanvas(640, 480).parent(canvasParentRef);

        if (showCamera) {
            initializeCamera(p5);
        }
    };

    const draw = (p5) => {
        p5.background(0);

        if (!showCamera || !videoRef.current) {
            p5.textSize(24);
            p5.textAlign(p5.CENTER, p5.CENTER);
            p5.fill(255);
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
            // Smooth transitions between detections
            const smoothedDetections = smoothDetections(
                detections,
                previousDetections,
                smoothFactor
            );
            setPreviousDetections(detections);

            for (let i = 0; i < smoothedDetections.length; i++) {
                let detection = smoothedDetections[i];
                if (detection.landmarks) {
                    const features = extractFacialFeatures(detection.landmarks);
                    applyDistortion(p5, srcFrame, features, distortionType);
                }
            }
        }
    };

    const smoothDetections = (current, previous, factor) => {
        if (!previous || previous.length === 0) return current;

        return current.map((curr, i) => {
            const prev = previous[i] || curr;
            return {
                ...curr,
                landmarks: {
                    ...curr.landmarks,
                    positions: curr.landmarks.positions.map((pos, j) => ({
                        x:
                            pos.x * (1 - factor) +
                            prev.landmarks.positions[j].x * factor,
                        y:
                            pos.y * (1 - factor) +
                            prev.landmarks.positions[j].y * factor,
                    })),
                },
            };
        });
    };

    const extractFacialFeatures = (landmarks) => {
        // FaceAPI landmarks are in a different format than expected
        // They are arrays of points with x, y coordinates
        const leftEye = landmarks.positions.slice(36, 42); // Left eye points
        const rightEye = landmarks.positions.slice(42, 48); // Right eye points
        const nose = landmarks.positions.slice(27, 36); // Nose points
        const mouth = landmarks.positions.slice(48, 68); // Mouth points
        const jaw = landmarks.positions.slice(0, 17); // Jaw points

        return {
            leftEye: computeBoundingBox(leftEye),
            rightEye: computeBoundingBox(rightEye),
            nose: computeBoundingBox(nose),
            mouth: computeBoundingBox(mouth),
            jaw: computeBoundingBox(jaw),
            centers: {
                leftEye: computeCenter(leftEye),
                rightEye: computeCenter(rightEye),
                nose: computeCenter(nose),
                mouth: computeCenter(mouth),
            },
        };
    };

    const computeCenter = (points) => {
        const sum = points.reduce(
            (acc, pt) => ({
                x: acc.x + pt.x,
                y: acc.y + pt.y,
            }),
            { x: 0, y: 0 }
        );

        return {
            x: sum.x / points.length,
            y: sum.y / points.length,
        };
    };

    const applyDistortion = (p5, srcFrame, features, type) => {
        const distortionFunctions = {
            stretch: applyStretchDistortion,
            bulge: applyBulgeDistortion,
            twist: applyTwistDistortion,
            dazzle: applyDazzleDistortion,
            juggalo: applyJuggaloDistortion,
            gan3d: applyGan3dDistortion,
            contour: applyContourDistortion,
            cvdazzle: applyCvDazzleDistortion,
            facepaint: applyFacePaintDistortion,
            blur: applyBlurDistortion,
            mosaic: applyMosaicDistortion,
        };

        const distorter = distortionFunctions[type] || applyStretchDistortion;
        distorter(p5, srcFrame, features);
    };

    const applyStretchDistortion = (p5, srcFrame, features) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Apply different distortion patterns based on feature type
        const distortions = {
            leftEye: { x: -0.3 * distortionLevel, y: 0.4 * distortionLevel },
            rightEye: { x: 0.3 * distortionLevel, y: 0.4 * distortionLevel },
            nose: { x: 0.0, y: 0.2 * distortionLevel },
            mouth: { x: 0.0, y: 0.5 * distortionLevel },
        };

        Object.entries(distortions).forEach(([feature, offset]) => {
            const box = features[feature];
            const center = centers[feature];
            const expandedBox = expandBoundingBox(box, 1.4);

            const newCenter = {
                x: center.x + box.w * offset.x,
                y: center.y + box.h * offset.y,
            };

            const dest = {
                x: newCenter.x - expandedBox.w / 2,
                y: newCenter.y - expandedBox.h / 2,
            };

            p5.copy(
                srcFrame,
                parseInt(expandedBox.x),
                parseInt(expandedBox.y),
                parseInt(expandedBox.w),
                parseInt(expandedBox.h),
                parseInt(dest.x),
                parseInt(dest.y),
                parseInt(expandedBox.w),
                parseInt(expandedBox.h)
            );
        });
    };

    const applyBulgeDistortion = (p5, srcFrame, features) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Create a bulge effect by scaling features outward from their centers
        const bulgeFactor = 1 + distortionLevel * 0.5;

        [leftEye, rightEye, nose, mouth].forEach((box, index) => {
            const center = centers[Object.keys(centers)[index]];
            const expandedBox = expandBoundingBox(box, 1.4 * bulgeFactor);

            const dest = {
                x: center.x - expandedBox.w / 2,
                y: center.y - expandedBox.h / 2,
            };

            p5.copy(
                srcFrame,
                parseInt(expandedBox.x),
                parseInt(expandedBox.y),
                parseInt(expandedBox.w),
                parseInt(expandedBox.h),
                parseInt(dest.x),
                parseInt(dest.y),
                parseInt(expandedBox.w),
                parseInt(expandedBox.h)
            );
        });
    };

    const applyTwistDistortion = (p5, srcFrame, features) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Create a twisting effect by rotating features around their centers
        const twistAngle = (distortionLevel * Math.PI) / 4;

        [leftEye, rightEye, nose, mouth].forEach((box, index) => {
            const center = centers[Object.keys(centers)[index]];
            const expandedBox = expandBoundingBox(box, 1.4);

            p5.push();
            p5.translate(center.x, center.y);
            p5.rotate(twistAngle);
            p5.translate(-center.x, -center.y);

            p5.copy(
                srcFrame,
                parseInt(expandedBox.x),
                parseInt(expandedBox.y),
                parseInt(expandedBox.w),
                parseInt(expandedBox.h),
                parseInt(center.x - expandedBox.w / 2),
                parseInt(center.y - expandedBox.h / 2),
                parseInt(expandedBox.w),
                parseInt(expandedBox.h)
            );

            p5.pop();
        });
    };

    const applyDazzleDistortion = (p5, srcFrame, features) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Save the current state
        p5.push();

        // Draw high-contrast geometric patterns
        p5.noStroke();

        // Base colors for dazzle effect
        const colors = [
            p5.color(255, 255, 255), // White
            p5.color(0, 0, 0), // Black
            p5.color(255, 0, 0), // Red
            p5.color(0, 0, 255), // Blue
        ];

        // Draw patterns based on selected style
        switch (dazzlePattern) {
            case "geometric":
                drawGeometricDazzle(p5, features, colors);
                break;
            case "asymmetric":
                drawAsymmetricDazzle(p5, features, colors);
                break;
            case "minimal":
                drawMinimalDazzle(p5, features, colors);
                break;
        }

        // Restore the state
        p5.pop();
    };

    const drawGeometricDazzle = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Draw geometric patterns around eyes
        drawEyeDazzle(p5, centers.leftEye, leftEye, colors);
        drawEyeDazzle(p5, centers.rightEye, rightEye, colors);

        // Draw nose bridge pattern
        drawNoseDazzle(p5, centers.nose, nose, colors);

        // Draw mouth area pattern
        drawMouthDazzle(p5, centers.mouth, mouth, colors);
    };

    const drawEyeDazzle = (p5, center, box, colors) => {
        const size = box.w * 1.5;
        const angle = p5.random(0, p5.PI);

        // Draw multiple geometric shapes around the eye
        for (let i = 0; i < 3; i++) {
            p5.fill(colors[i % colors.length]);
            p5.push();
            p5.translate(center.x, center.y);
            p5.rotate(angle + (i * p5.PI) / 3);

            // Draw triangles
            p5.triangle(-size / 2, -size / 2, size / 2, -size / 2, 0, size / 2);

            // Draw rectangles
            p5.rect(-size / 3, -size / 3, size / 2, size / 2);

            p5.pop();
        }
    };

    const drawNoseDazzle = (p5, center, box, colors) => {
        const width = box.w * 1.2;
        const height = box.h * 1.5;

        // Draw vertical stripes
        for (let i = 0; i < 4; i++) {
            p5.fill(colors[i % colors.length]);
            p5.rect(
                center.x - width / 2 + (i * width) / 4,
                center.y - height / 2,
                width / 4,
                height
            );
        }
    };

    const drawMouthDazzle = (p5, center, box, colors) => {
        const width = box.w * 1.5;
        const height = box.h * 1.2;

        // Draw diagonal patterns
        for (let i = 0; i < 3; i++) {
            p5.fill(colors[i % colors.length]);
            p5.push();
            p5.translate(center.x, center.y);
            p5.rotate((i * p5.PI) / 4);
            p5.rect(-width / 3, -height / 3, width / 2, height / 2);
            p5.pop();
        }
    };

    const drawAsymmetricDazzle = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Draw asymmetric patterns with different shapes on each side
        drawAsymmetricEyePattern(p5, centers.leftEye, leftEye, colors, true);
        drawAsymmetricEyePattern(p5, centers.rightEye, rightEye, colors, false);

        // Draw asymmetric nose pattern
        drawAsymmetricNosePattern(p5, centers.nose, nose, colors);

        // Draw asymmetric mouth pattern
        drawAsymmetricMouthPattern(p5, centers.mouth, mouth, colors);
    };

    const drawAsymmetricEyePattern = (p5, center, box, colors, isLeft) => {
        const size = box.w * 1.5;
        p5.fill(colors[isLeft ? 0 : 1]);

        p5.push();
        p5.translate(center.x, center.y);
        p5.rotate(isLeft ? p5.PI / 4 : -p5.PI / 4);

        // Draw different shapes for left and right
        if (isLeft) {
            p5.triangle(-size / 2, -size / 2, size / 2, -size / 2, 0, size / 2);
        } else {
            p5.rect(-size / 3, -size / 3, size / 2, size / 2);
        }

        p5.pop();
    };

    const drawAsymmetricNosePattern = (p5, center, box, colors) => {
        const width = box.w * 1.2;
        const height = box.h * 1.5;

        // Draw asymmetric nose pattern
        p5.fill(colors[2]);
        p5.rect(center.x - width / 3, center.y - height / 2, width / 2, height);
        p5.fill(colors[3]);
        p5.triangle(
            center.x + width / 6,
            center.y - height / 2,
            center.x + width / 2,
            center.y,
            center.x + width / 6,
            center.y + height / 2
        );
    };

    const drawAsymmetricMouthPattern = (p5, center, box, colors) => {
        const width = box.w * 1.5;
        const height = box.h * 1.2;

        // Draw asymmetric mouth pattern
        p5.fill(colors[0]);
        p5.ellipse(center.x - width / 4, center.y, width / 3, height / 2);
        p5.fill(colors[1]);
        p5.rect(
            center.x + width / 6,
            center.y - height / 3,
            width / 3,
            height / 2
        );
    };

    const drawMinimalDazzle = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Draw minimal patterns with just black and white
        const minimalColors = [colors[0], colors[1]]; // Just black and white

        // Minimal eye patterns
        drawMinimalEyePattern(p5, centers.leftEye, leftEye, minimalColors);
        drawMinimalEyePattern(p5, centers.rightEye, rightEye, minimalColors);

        // Minimal nose pattern
        drawMinimalNosePattern(p5, centers.nose, nose, minimalColors);

        // Minimal mouth pattern
        drawMinimalMouthPattern(p5, centers.mouth, mouth, minimalColors);
    };

    const drawMinimalEyePattern = (p5, center, box, colors) => {
        const size = box.w * 0.8;
        p5.fill(colors[0]); // Black

        // Draw small dots around the eye
        for (let i = 0; i < 4; i++) {
            const angle = (i * p5.PI) / 2;
            p5.ellipse(
                center.x + (p5.cos(angle) * size) / 2,
                center.y + (p5.sin(angle) * size) / 2,
                size / 4,
                size / 4
            );
        }
    };

    const drawMinimalNosePattern = (p5, center, box, colors) => {
        const width = box.w * 0.8;
        const height = box.h * 1.2;

        // Draw minimal nose pattern
        p5.fill(colors[1]); // White
        p5.rect(
            center.x - width / 4,
            center.y - height / 3,
            width / 2,
            height / 3
        );
    };

    const drawMinimalMouthPattern = (p5, center, box, colors) => {
        const width = box.w * 0.8;
        const height = box.h * 0.8;

        // Draw minimal mouth pattern
        p5.fill(colors[0]); // Black
        p5.ellipse(center.x, center.y, width / 2, height / 2);
    };

    const applyJuggaloDistortion = (p5, srcFrame, features) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Save the current state
        p5.push();
        p5.noStroke();

        // Juggalo-style colors (black and white base with optional accent)
        const colors = [
            p5.color(0, 0, 0), // Black
            p5.color(255, 255, 255), // White
            p5.color(255, 0, 0), // Red (for accents)
        ];

        // Draw patterns based on selected style
        switch (juggaloStyle) {
            case "classic":
                drawClassicJuggalo(p5, features, colors);
                break;
            case "modern":
                drawModernJuggalo(p5, features, colors);
                break;
            case "extreme":
                drawExtremeJuggalo(p5, features, colors);
                break;
        }

        p5.pop();
    };

    const drawClassicJuggalo = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Classic Juggalo style with bold black and white patterns
        p5.fill(colors[0]); // Black

        // Draw the classic eye patterns
        drawClassicEyePattern(p5, centers.leftEye, leftEye, true);
        drawClassicEyePattern(p5, centers.rightEye, rightEye, false);

        // Draw the nose bridge pattern
        drawClassicNosePattern(p5, centers.nose, nose);

        // Draw the mouth area pattern
        drawClassicMouthPattern(p5, centers.mouth, mouth);
    };

    const drawClassicEyePattern = (p5, center, box, isLeft) => {
        const size = box.w * 2;

        p5.push();
        p5.translate(center.x, center.y);

        // Draw the classic Juggalo eye pattern
        if (isLeft) {
            // Left eye: downward triangle
            p5.triangle(-size / 2, -size / 2, size / 2, -size / 2, 0, size / 2);
        } else {
            // Right eye: upward triangle
            p5.triangle(-size / 2, size / 2, size / 2, size / 2, 0, -size / 2);
        }

        p5.pop();
    };

    const drawClassicNosePattern = (p5, center, box) => {
        const width = box.w * 1.5;
        const height = box.h * 2;

        // Draw the classic nose bridge pattern
        p5.rect(center.x - width / 4, center.y - height / 2, width / 2, height);
    };

    const drawClassicMouthPattern = (p5, center, box) => {
        const width = box.w * 2;
        const height = box.h * 1.5;

        // Draw the classic mouth pattern
        p5.ellipse(center.x, center.y, width, height);
    };

    const drawModernJuggalo = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Modern Juggalo style with more complex patterns
        p5.fill(colors[0]); // Black

        // Draw modern eye patterns
        drawModernEyePattern(p5, centers.leftEye, leftEye, true);
        drawModernEyePattern(p5, centers.rightEye, rightEye, false);

        // Draw modern nose pattern
        drawModernNosePattern(p5, centers.nose, nose);

        // Draw modern mouth pattern
        drawModernMouthPattern(p5, centers.mouth, mouth);
    };

    const drawModernEyePattern = (p5, center, box, isLeft) => {
        const size = box.w * 2;

        p5.push();
        p5.translate(center.x, center.y);

        // Draw modern eye pattern with multiple shapes
        if (isLeft) {
            // Left eye: combination of shapes
            p5.triangle(-size / 2, -size / 2, size / 2, -size / 2, 0, size / 2);
            p5.rect(-size / 4, -size / 4, size / 2, size / 2);
        } else {
            // Right eye: different combination
            p5.ellipse(0, 0, size, size);
            p5.triangle(-size / 2, size / 2, size / 2, size / 2, 0, -size / 2);
        }

        p5.pop();
    };

    const drawModernNosePattern = (p5, center, box) => {
        const width = box.w * 1.5;
        const height = box.h * 2;

        // Draw modern nose pattern
        p5.rect(center.x - width / 4, center.y - height / 2, width / 2, height);

        // Add accent shapes
        p5.fill(colors[2]); // Red
        p5.triangle(
            center.x - width / 3,
            center.y - height / 2,
            center.x + width / 3,
            center.y - height / 2,
            center.x,
            center.y
        );
    };

    const drawModernMouthPattern = (p5, center, box) => {
        const width = box.w * 2;
        const height = box.h * 1.5;

        // Draw modern mouth pattern
        p5.fill(colors[0]); // Black
        p5.ellipse(center.x, center.y, width, height);

        // Add accent shapes
        p5.fill(colors[2]); // Red
        p5.rect(
            center.x - width / 4,
            center.y - height / 4,
            width / 2,
            height / 2
        );
    };

    const drawExtremeJuggalo = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Extreme Juggalo style with maximum disruption
        p5.fill(colors[0]); // Black

        // Draw extreme eye patterns
        drawExtremeEyePattern(p5, centers.leftEye, leftEye, true);
        drawExtremeEyePattern(p5, centers.rightEye, rightEye, false);

        // Draw extreme nose pattern
        drawExtremeNosePattern(p5, centers.nose, nose);

        // Draw extreme mouth pattern
        drawExtremeMouthPattern(p5, centers.mouth, mouth);
    };

    const drawExtremeEyePattern = (p5, center, box, isLeft) => {
        const size = box.w * 2.5;

        p5.push();
        p5.translate(center.x, center.y);

        // Draw extreme eye pattern with multiple overlapping shapes
        if (isLeft) {
            // Left eye: complex pattern
            p5.triangle(-size / 2, -size / 2, size / 2, -size / 2, 0, size / 2);
            p5.rect(-size / 3, -size / 3, size / 2, size / 2);
            p5.fill(colors[2]); // Red
            p5.ellipse(0, 0, size / 2, size / 2);
        } else {
            // Right eye: different complex pattern
            p5.ellipse(0, 0, size, size);
            p5.fill(colors[2]); // Red
            p5.triangle(-size / 2, size / 2, size / 2, size / 2, 0, -size / 2);
            p5.fill(colors[0]); // Black
            p5.rect(-size / 4, -size / 4, size / 2, size / 2);
        }

        p5.pop();
    };

    const drawExtremeNosePattern = (p5, center, box) => {
        const width = box.w * 2;
        const height = box.h * 2.5;

        // Draw extreme nose pattern
        p5.rect(
            center.x - width / 3,
            center.y - height / 2,
            width / 1.5,
            height
        );

        // Add multiple accent shapes
        p5.fill(colors[2]); // Red
        p5.triangle(
            center.x - width / 3,
            center.y - height / 2,
            center.x + width / 3,
            center.y - height / 2,
            center.x,
            center.y
        );
        p5.ellipse(center.x, center.y + height / 4, width / 2, height / 3);
    };

    const drawExtremeMouthPattern = (p5, center, box) => {
        const width = box.w * 2.5;
        const height = box.h * 2;

        // Draw extreme mouth pattern
        p5.fill(colors[0]); // Black
        p5.ellipse(center.x, center.y, width, height);

        // Add multiple accent shapes
        p5.fill(colors[2]); // Red
        p5.rect(
            center.x - width / 3,
            center.y - height / 3,
            width / 1.5,
            height / 1.5
        );
        p5.triangle(
            center.x - width / 4,
            center.y + height / 4,
            center.x + width / 4,
            center.y + height / 4,
            center.x,
            center.y - height / 4
        );
    };

    const applyGan3dDistortion = (p5, srcFrame, features) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Save the current state
        p5.push();
        p5.noStroke();

        // 3D-aware colors with depth perception
        const colors = [
            p5.color(255, 255, 255), // White
            p5.color(0, 0, 0), // Black
            p5.color(100, 100, 100), // Gray
            p5.color(200, 200, 200), // Light Gray
        ];

        // Draw patterns based on selected style
        switch (gan3dStyle) {
            case "geometric":
                drawGeometricGan3d(p5, features, colors);
                break;
            case "organic":
                drawOrganicGan3d(p5, features, colors);
                break;
            case "hybrid":
                drawHybridGan3d(p5, features, colors);
                break;
        }

        p5.pop();
    };

    const drawGeometricGan3d = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Draw 3D-aware geometric patterns
        drawGan3dEyePattern(p5, centers.leftEye, leftEye, colors, true);
        drawGan3dEyePattern(p5, centers.rightEye, rightEye, colors, false);
        drawGan3dNosePattern(p5, centers.nose, nose, colors);
        drawGan3dMouthPattern(p5, centers.mouth, mouth, colors);
    };

    const drawGan3dEyePattern = (p5, center, box, colors, isLeft) => {
        const size = box.w * (1 + gan3dIntensity);
        const depth = gan3dIntensity * 2;

        p5.push();
        p5.translate(center.x, center.y);

        // Create 3D effect with multiple layers
        for (let i = 0; i < 3; i++) {
            const layerSize = size * (1 - i * 0.2);
            const layerDepth = depth * (1 - i * 0.3);

            p5.fill(colors[i % colors.length]);

            // Draw 3D geometric pattern
            if (isLeft) {
                // Left eye: 3D cube pattern
                draw3DCube(p5, layerSize, layerDepth);
            } else {
                // Right eye: 3D pyramid pattern
                draw3DPyramid(p5, layerSize, layerDepth);
            }
        }

        p5.pop();
    };

    const draw3DCube = (p5, size, depth) => {
        // Draw a 3D cube with perspective
        const halfSize = size / 2;

        // Front face
        p5.rect(-halfSize, -halfSize, size, size);

        // Side faces
        p5.fill(p5.color(200, 200, 200));
        p5.quad(
            halfSize,
            -halfSize,
            halfSize + depth,
            -halfSize - depth,
            halfSize + depth,
            halfSize - depth,
            halfSize,
            halfSize
        );

        // Top face
        p5.fill(p5.color(150, 150, 150));
        p5.quad(
            -halfSize,
            -halfSize,
            -halfSize + depth,
            -halfSize - depth,
            halfSize + depth,
            -halfSize - depth,
            halfSize,
            -halfSize
        );
    };

    const draw3DPyramid = (p5, size, depth) => {
        // Draw a 3D pyramid with perspective
        const halfSize = size / 2;

        // Base
        p5.rect(-halfSize, -halfSize, size, size);

        // Sides
        p5.fill(p5.color(200, 200, 200));
        p5.triangle(
            -halfSize,
            -halfSize,
            0,
            -halfSize - depth,
            halfSize,
            -halfSize
        );
        p5.triangle(
            halfSize,
            -halfSize,
            0,
            -halfSize - depth,
            halfSize,
            halfSize
        );
        p5.triangle(
            halfSize,
            halfSize,
            0,
            -halfSize - depth,
            -halfSize,
            halfSize
        );
        p5.triangle(
            -halfSize,
            halfSize,
            0,
            -halfSize - depth,
            -halfSize,
            -halfSize
        );
    };

    const drawGan3dNosePattern = (p5, center, box, colors) => {
        const width = box.w * (1 + gan3dIntensity);
        const height = box.h * (1 + gan3dIntensity);
        const depth = gan3dIntensity * 2;

        // Draw 3D nose pattern
        for (let i = 0; i < 3; i++) {
            const layerWidth = width * (1 - i * 0.2);
            const layerHeight = height * (1 - i * 0.2);
            const layerDepth = depth * (1 - i * 0.3);

            p5.fill(colors[i % colors.length]);

            // Draw 3D cylinder pattern
            draw3DCylinder(p5, center, layerWidth, layerHeight, layerDepth);
        }
    };

    const draw3DCylinder = (p5, center, width, height, depth) => {
        const segments = 12;
        const angleStep = p5.TWO_PI / segments;

        // Draw cylinder sides
        for (let i = 0; i < segments; i++) {
            const angle1 = i * angleStep;
            const angle2 = (i + 1) * angleStep;

            const x1 = center.x + (p5.cos(angle1) * width) / 2;
            const y1 = center.y + (p5.sin(angle1) * height) / 2;
            const x2 = center.x + (p5.cos(angle2) * width) / 2;
            const y2 = center.y + (p5.sin(angle2) * height) / 2;

            p5.fill(p5.color(200, 200, 200));
            p5.quad(
                x1,
                y1,
                x1 + depth,
                y1 - depth,
                x2 + depth,
                y2 - depth,
                x2,
                y2
            );
        }

        // Draw top and bottom
        p5.fill(p5.color(255, 255, 255));
        p5.ellipse(center.x, center.y, width, height);
        p5.fill(p5.color(150, 150, 150));
        p5.ellipse(center.x + depth, center.y - depth, width, height);
    };

    const drawGan3dMouthPattern = (p5, center, box, colors) => {
        const width = box.w * (1 + gan3dIntensity);
        const height = box.h * (1 + gan3dIntensity);
        const depth = gan3dIntensity * 2;

        // Draw 3D mouth pattern
        for (let i = 0; i < 3; i++) {
            const layerWidth = width * (1 - i * 0.2);
            const layerHeight = height * (1 - i * 0.2);
            const layerDepth = depth * (1 - i * 0.3);

            p5.fill(colors[i % colors.length]);

            // Draw 3D torus pattern
            draw3DTorus(p5, center, layerWidth, layerHeight, layerDepth);
        }
    };

    const draw3DTorus = (p5, center, width, height, depth) => {
        const segments = 24;
        const angleStep = p5.TWO_PI / segments;

        // Draw torus
        for (let i = 0; i < segments; i++) {
            const angle1 = i * angleStep;
            const angle2 = (i + 1) * angleStep;

            const x1 = center.x + (p5.cos(angle1) * width) / 2;
            const y1 = center.y + (p5.sin(angle1) * height) / 2;
            const x2 = center.x + (p5.cos(angle2) * width) / 2;
            const y2 = center.y + (p5.sin(angle2) * height) / 2;

            p5.fill(p5.color(200, 200, 200));
            p5.quad(
                x1,
                y1,
                x1 + depth,
                y1 - depth,
                x2 + depth,
                y2 - depth,
                x2,
                y2
            );
        }

        // Draw front and back
        p5.fill(p5.color(255, 255, 255));
        p5.ellipse(center.x, center.y, width, height);
        p5.fill(p5.color(150, 150, 150));
        p5.ellipse(center.x + depth, center.y - depth, width, height);
    };

    const drawOrganicGan3d = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Draw organic 3D patterns
        drawOrganicEyePattern(p5, centers.leftEye, leftEye, colors, true);
        drawOrganicEyePattern(p5, centers.rightEye, rightEye, colors, false);
        drawOrganicNosePattern(p5, centers.nose, nose, colors);
        drawOrganicMouthPattern(p5, centers.mouth, mouth, colors);
    };

    const drawOrganicEyePattern = (p5, center, box, colors, isLeft) => {
        const size = box.w * (1 + gan3dIntensity);
        const depth = gan3dIntensity * 2;

        p5.push();
        p5.translate(center.x, center.y);

        // Create organic 3D effect
        for (let i = 0; i < 3; i++) {
            const layerSize = size * (1 - i * 0.2);
            const layerDepth = depth * (1 - i * 0.3);

            p5.fill(colors[i % colors.length]);

            // Draw organic pattern
            drawOrganicShape(p5, layerSize, layerDepth, isLeft);
        }

        p5.pop();
    };

    const drawOrganicShape = (p5, size, depth, isLeft) => {
        const points = [];
        const numPoints = 8;

        // Generate organic shape points
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * p5.TWO_PI;
            const radius = (size / 2) * (1 + p5.noise(i * 0.1) * 0.2);
            points.push({
                x: p5.cos(angle) * radius,
                y: p5.sin(angle) * radius,
            });
        }

        // Draw shape
        p5.beginShape();
        for (let i = 0; i < points.length; i++) {
            p5.vertex(points[i].x, points[i].y);
        }
        p5.endShape(p5.CLOSE);

        // Draw 3D effect
        p5.fill(p5.color(200, 200, 200));
        for (let i = 0; i < points.length; i++) {
            const next = (i + 1) % points.length;
            p5.quad(
                points[i].x,
                points[i].y,
                points[i].x + depth,
                points[i].y - depth,
                points[next].x + depth,
                points[next].y - depth,
                points[next].x,
                points[next].y
            );
        }
    };

    const drawHybridGan3d = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Draw hybrid patterns (mix of geometric and organic)
        drawHybridEyePattern(p5, centers.leftEye, leftEye, colors, true);
        drawHybridEyePattern(p5, centers.rightEye, rightEye, colors, false);
        drawHybridNosePattern(p5, centers.nose, nose, colors);
        drawHybridMouthPattern(p5, centers.mouth, mouth, colors);
    };

    const drawHybridEyePattern = (p5, center, box, colors, isLeft) => {
        const size = box.w * (1 + gan3dIntensity);
        const depth = gan3dIntensity * 2;

        p5.push();
        p5.translate(center.x, center.y);

        // Create hybrid 3D effect
        for (let i = 0; i < 3; i++) {
            const layerSize = size * (1 - i * 0.2);
            const layerDepth = depth * (1 - i * 0.3);

            p5.fill(colors[i % colors.length]);

            if (i % 2 === 0) {
                // Geometric pattern
                if (isLeft) {
                    draw3DCube(p5, layerSize, layerDepth);
                } else {
                    draw3DPyramid(p5, layerSize, layerDepth);
                }
            } else {
                // Organic pattern
                drawOrganicShape(p5, layerSize, layerDepth, isLeft);
            }
        }

        p5.pop();
    };

    const applyContourDistortion = (p5, srcFrame, features) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Save the current state
        p5.push();
        p5.noStroke();

        // Professional makeup colors
        const colors = {
            highlight: p5.color(255, 240, 220), // Warm highlight
            contour: p5.color(120, 80, 60), // Cool contour
            blush: p5.color(220, 140, 120), // Natural blush
            corrector: p5.color(180, 150, 130), // Color corrector
        };

        // Draw patterns based on selected style
        switch (contourStyle) {
            case "natural":
                drawNaturalContour(p5, features, colors);
                break;
            case "dramatic":
                drawDramaticContour(p5, features, colors);
                break;
            case "avantgarde":
                drawAvantgardeContour(p5, features, colors);
                break;
        }

        p5.pop();
    };

    const drawNaturalContour = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Apply natural-looking contour
        drawCheekContour(p5, centers, colors, false);
        drawNoseContour(p5, centers.nose, nose, colors, false);
        drawForeheadContour(p5, centers, colors, false);
        drawJawContour(p5, centers, colors, false);
    };

    const drawDramaticContour = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Apply dramatic contour with stronger contrast
        drawCheekContour(p5, centers, colors, true);
        drawNoseContour(p5, centers.nose, nose, colors, true);
        drawForeheadContour(p5, centers, colors, true);
        drawJawContour(p5, centers, colors, true);

        // Add dramatic highlighting
        drawDramaticHighlight(p5, centers, colors);
    };

    const drawAvantgardeContour = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Apply avant-garde contour with artistic patterns
        drawAbstractCheekContour(p5, centers, colors);
        drawAbstractNoseContour(p5, centers.nose, nose, colors);
        drawAbstractForeheadContour(p5, centers, colors);
        drawAbstractJawContour(p5, centers, colors);
    };

    const drawCheekContour = (p5, centers, colors, isDramatic) => {
        const intensity = isDramatic
            ? contourIntensity * 1.5
            : contourIntensity;

        // Draw cheek contour
        p5.fill(colors.contour);
        p5.noStroke();

        // Create cheek hollow effect
        const cheekSize = 60 * intensity;
        const cheekOffset = 30 * intensity;

        // Left cheek
        p5.push();
        p5.translate(
            centers.leftEye.x - cheekOffset,
            centers.leftEye.y + cheekOffset
        );
        p5.rotate(p5.PI / 4);
        p5.ellipse(0, 0, cheekSize, cheekSize * 1.5);
        p5.pop();

        // Right cheek
        p5.push();
        p5.translate(
            centers.rightEye.x + cheekOffset,
            centers.rightEye.y + cheekOffset
        );
        p5.rotate(-p5.PI / 4);
        p5.ellipse(0, 0, cheekSize, cheekSize * 1.5);
        p5.pop();

        // Add blush
        p5.fill(colors.blush);
        p5.ellipse(
            centers.leftEye.x - cheekOffset / 2,
            centers.leftEye.y + cheekOffset,
            cheekSize / 2,
            cheekSize / 3
        );
        p5.ellipse(
            centers.rightEye.x + cheekOffset / 2,
            centers.rightEye.y + cheekOffset,
            cheekSize / 2,
            cheekSize / 3
        );
    };

    const drawNoseContour = (p5, center, box, colors, isDramatic) => {
        const intensity = isDramatic
            ? contourIntensity * 1.5
            : contourIntensity;
        const width = box.w * (1 + intensity);
        const height = box.h * (1 + intensity);

        // Draw nose contour
        p5.fill(colors.contour);
        p5.noStroke();

        // Nose bridge contour
        p5.rect(center.x - width / 4, center.y - height / 2, width / 2, height);

        // Nose tip highlight
        p5.fill(colors.highlight);
        p5.ellipse(center.x, center.y + height / 3, width / 3, height / 4);
    };

    const drawForeheadContour = (p5, centers, colors, isDramatic) => {
        const intensity = isDramatic
            ? contourIntensity * 1.5
            : contourIntensity;

        // Draw forehead contour
        p5.fill(colors.contour);
        p5.noStroke();

        // Temple contour
        const templeSize = 40 * intensity;
        p5.ellipse(
            centers.leftEye.x - 50,
            centers.leftEye.y - 80,
            templeSize,
            templeSize
        );
        p5.ellipse(
            centers.rightEye.x + 50,
            centers.rightEye.y - 80,
            templeSize,
            templeSize
        );

        // Center forehead highlight
        p5.fill(colors.highlight);
        p5.ellipse(
            (centers.leftEye.x + centers.rightEye.x) / 2,
            centers.leftEye.y - 100,
            60 * intensity,
            30 * intensity
        );
    };

    const drawJawContour = (p5, centers, colors, isDramatic) => {
        const intensity = isDramatic
            ? contourIntensity * 1.5
            : contourIntensity;

        // Draw jaw contour
        p5.fill(colors.contour);
        p5.noStroke();

        // Jawline contour
        const jawSize = 50 * intensity;
        p5.ellipse(
            centers.leftEye.x - 60,
            centers.mouth.y + 50,
            jawSize,
            jawSize * 1.2
        );
        p5.ellipse(
            centers.rightEye.x + 60,
            centers.mouth.y + 50,
            jawSize,
            jawSize * 1.2
        );

        // Chin highlight
        p5.fill(colors.highlight);
        p5.ellipse(
            centers.mouth.x,
            centers.mouth.y + 60,
            40 * intensity,
            30 * intensity
        );
    };

    const drawDramaticHighlight = (p5, centers, colors) => {
        // Add dramatic highlighting points
        p5.fill(colors.highlight);
        p5.noStroke();

        // Under-eye highlight
        p5.ellipse(centers.leftEye.x, centers.leftEye.y + 20, 30, 15);
        p5.ellipse(centers.rightEye.x, centers.rightEye.y + 20, 30, 15);

        // Cupid's bow highlight
        p5.ellipse(centers.mouth.x, centers.mouth.y - 10, 20, 10);

        // Brow bone highlight
        p5.ellipse(centers.leftEye.x - 15, centers.leftEye.y - 30, 20, 10);
        p5.ellipse(centers.rightEye.x + 15, centers.rightEye.y - 30, 20, 10);
    };

    const drawAbstractCheekContour = (p5, centers, colors) => {
        // Draw abstract cheek patterns
        const size = 50 * contourIntensity;

        // Left cheek abstract pattern
        p5.push();
        p5.translate(centers.leftEye.x - 40, centers.leftEye.y + 40);
        drawAbstractPattern(p5, size, colors);
        p5.pop();

        // Right cheek abstract pattern
        p5.push();
        p5.translate(centers.rightEye.x + 40, centers.rightEye.y + 40);
        p5.rotate(p5.PI);
        drawAbstractPattern(p5, size, colors);
        p5.pop();
    };

    const drawAbstractPattern = (p5, size, colors) => {
        // Draw an abstract makeup pattern
        const numShapes = 5;
        const angleStep = p5.TWO_PI / numShapes;

        for (let i = 0; i < numShapes; i++) {
            const angle = i * angleStep;
            const radius = size * (0.5 + p5.noise(i * 0.1) * 0.5);

            p5.fill(i % 2 === 0 ? colors.contour : colors.highlight);
            p5.push();
            p5.rotate(angle);
            p5.ellipse(radius, 0, size / 3, size / 2);
            p5.pop();
        }
    };

    const drawAbstractNoseContour = (p5, center, box, colors) => {
        // Draw abstract nose patterns
        const width = box.w * (1 + contourIntensity);
        const height = box.h * (1 + contourIntensity);

        // Draw geometric nose pattern
        p5.push();
        p5.translate(center.x, center.y);

        // Nose bridge pattern
        for (let i = 0; i < 3; i++) {
            p5.fill(i % 2 === 0 ? colors.contour : colors.highlight);
            p5.rect(
                -width / 4,
                -height / 2 + (i * height) / 3,
                width / 2,
                height / 4
            );
        }

        p5.pop();
    };

    const drawAbstractForeheadContour = (p5, centers, colors) => {
        // Draw abstract forehead patterns
        const centerX = (centers.leftEye.x + centers.rightEye.x) / 2;
        const centerY = centers.leftEye.y - 100;

        p5.push();
        p5.translate(centerX, centerY);

        // Draw concentric abstract patterns
        for (let i = 0; i < 4; i++) {
            const size = 40 + i * 20;
            p5.fill(i % 2 === 0 ? colors.contour : colors.highlight);
            p5.rotate(p5.PI / 8);
            p5.ellipse(0, 0, size, size * 0.7);
        }

        p5.pop();
    };

    const drawAbstractJawContour = (p5, centers, colors) => {
        // Draw abstract jaw patterns
        const jawSize = 60 * contourIntensity;

        // Left jaw pattern
        p5.push();
        p5.translate(centers.leftEye.x - 60, centers.mouth.y + 50);
        drawAbstractJawPattern(p5, jawSize, colors);
        p5.pop();

        // Right jaw pattern
        p5.push();
        p5.translate(centers.rightEye.x + 60, centers.mouth.y + 50);
        p5.rotate(p5.PI);
        drawAbstractJawPattern(p5, jawSize, colors);
        p5.pop();
    };

    const drawAbstractJawPattern = (p5, size, colors) => {
        // Draw an abstract jaw pattern
        const numPoints = 8;
        const points = [];

        // Generate points for abstract shape
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * p5.TWO_PI;
            const radius = size * (0.5 + p5.noise(i * 0.1) * 0.5);
            points.push({
                x: p5.cos(angle) * radius,
                y: p5.sin(angle) * radius,
            });
        }

        // Draw shape with alternating colors
        p5.beginShape();
        for (let i = 0; i < points.length; i++) {
            p5.fill(i % 2 === 0 ? colors.contour : colors.highlight);
            p5.vertex(points[i].x, points[i].y);
        }
        p5.endShape(p5.CLOSE);
    };

    const applyCvDazzleDistortion = (p5, srcFrame, features) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Save the current state
        p5.push();
        p5.noStroke();

        // High-contrast colors for CV Dazzle
        const colors = {
            primary: p5.color(255, 255, 255), // White
            secondary: p5.color(0, 0, 0), // Black
            accent: p5.color(255, 0, 0), // Red
        };

        // Draw patterns based on selected style
        switch (cvdazzleStyle) {
            case "mesh":
                drawMeshDazzle(p5, features, colors);
                break;
            case "asymmetric":
                drawAsymmetricDazzle(p5, features, colors);
                break;
            case "occlusion":
                drawOcclusionDazzle(p5, features, colors);
                break;
        }

        p5.pop();
    };

    const drawMeshDazzle = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Draw mesh patterns around key facial features
        drawMeshEyePattern(p5, centers.leftEye, leftEye, colors, true);
        drawMeshEyePattern(p5, centers.rightEye, rightEye, colors, false);
        drawMeshNosePattern(p5, centers.nose, nose, colors);
        drawMeshMouthPattern(p5, centers.mouth, mouth, colors);
    };

    const drawMeshEyePattern = (p5, center, box, colors, isLeft) => {
        const size = box.w * 2;
        const meshSize = size / 4;

        p5.push();
        p5.translate(center.x, center.y);

        // Draw mesh grid
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                const x = i * meshSize;
                const y = j * meshSize;

                // Alternate colors for high contrast
                p5.fill((i + j) % 2 === 0 ? colors.primary : colors.secondary);

                // Draw mesh cell
                p5.rect(x - meshSize / 2, y - meshSize / 2, meshSize, meshSize);

                // Add diagonal lines for extra disruption
                if ((i + j) % 2 === 0) {
                    p5.stroke(colors.accent);
                    p5.line(
                        x - meshSize / 2,
                        y - meshSize / 2,
                        x + meshSize / 2,
                        y + meshSize / 2
                    );
                    p5.noStroke();
                }
            }
        }

        p5.pop();
    };

    const drawMeshNosePattern = (p5, center, box, colors) => {
        const width = box.w * 2;
        const height = box.h * 2;
        const meshSize = width / 6;

        p5.push();
        p5.translate(center.x, center.y);

        // Draw vertical mesh pattern
        for (let i = -3; i <= 3; i++) {
            for (let j = -2; j <= 2; j++) {
                const x = i * meshSize;
                const y = j * meshSize;

                // Alternate colors
                p5.fill((i + j) % 2 === 0 ? colors.primary : colors.secondary);
                p5.rect(x - meshSize / 2, y - meshSize / 2, meshSize, meshSize);
            }
        }

        p5.pop();
    };

    const drawMeshMouthPattern = (p5, center, box, colors) => {
        const width = box.w * 2;
        const height = box.h * 1.5;
        const meshSize = width / 5;

        p5.push();
        p5.translate(center.x, center.y);

        // Draw diagonal mesh pattern
        for (let i = -3; i <= 3; i++) {
            for (let j = -2; j <= 2; j++) {
                const x = i * meshSize;
                const y = j * meshSize;

                // Alternate colors
                p5.fill((i + j) % 2 === 0 ? colors.primary : colors.secondary);
                p5.push();
                p5.rotate(p5.PI / 4);
                p5.rect(x - meshSize / 2, y - meshSize / 2, meshSize, meshSize);
                p5.pop();
            }
        }

        p5.pop();
    };

    const drawOcclusionDazzle = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Draw strategic occlusions around key points
        drawEyeOcclusion(p5, centers.leftEye, leftEye, colors, true);
        drawEyeOcclusion(p5, centers.rightEye, rightEye, colors, false);
        drawNoseOcclusion(p5, centers.nose, nose, colors);
        drawMouthOcclusion(p5, centers.mouth, mouth, colors);
    };

    const drawEyeOcclusion = (p5, center, box, colors, isLeft) => {
        const size = box.w * 2.5;

        p5.push();
        p5.translate(center.x, center.y);

        // Draw occlusion shapes
        p5.fill(colors.secondary);

        // Main occlusion
        p5.ellipse(0, 0, size, size * 1.2);

        // Additional shapes for disruption
        p5.fill(colors.primary);
        p5.rect(-size / 3, -size / 3, size / 2, size / 2);
        p5.fill(colors.accent);
        p5.triangle(
            size / 4,
            -size / 4,
            size / 2,
            size / 4,
            size / 4,
            size / 2
        );

        p5.pop();
    };

    const applyFacePaintDistortion = (p5, srcFrame, features) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Save the current state
        p5.push();
        p5.noStroke();

        // Colors for face paint and scarf effects
        const colors = {
            paint1: p5.color(255, 200, 150), // Skin tone
            paint2: p5.color(200, 150, 100), // Darker skin tone
            scarf1: p5.color(100, 100, 100), // Gray
            scarf2: p5.color(150, 150, 150), // Light gray
        };

        // Draw patterns based on selected style
        switch (facepaintStyle) {
            case "cubist":
                drawCubistPaint(p5, features, colors);
                break;
            case "scarf":
                drawScarfPattern(p5, features, colors);
                break;
            case "fractal":
                drawFractalPattern(p5, features, colors);
                break;
        }

        p5.pop();
    };

    const drawCubistPaint = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Draw cubist-style face paint
        drawCubistEyePattern(p5, centers.leftEye, leftEye, colors, true);
        drawCubistEyePattern(p5, centers.rightEye, rightEye, colors, false);
        drawCubistNosePattern(p5, centers.nose, nose, colors);
        drawCubistMouthPattern(p5, centers.mouth, mouth, colors);
    };

    const drawCubistEyePattern = (p5, center, box, colors, isLeft) => {
        const size = box.w * 2;

        p5.push();
        p5.translate(center.x, center.y);

        // Draw geometric shapes in cubist style
        p5.fill(colors.paint1);
        p5.rect(-size / 2, -size / 2, size, size);

        p5.fill(colors.paint2);
        p5.triangle(-size / 2, -size / 2, size / 2, -size / 2, 0, size / 2);

        // Add abstract shapes
        p5.fill(colors.scarf1);
        p5.ellipse(size / 4, -size / 4, size / 2, size / 2);

        p5.pop();
    };

    const drawCubistNosePattern = (p5, center, box, colors) => {
        const width = box.w * 2;
        const height = box.h * 2;

        p5.push();
        p5.translate(center.x, center.y);

        // Draw cubist nose pattern
        p5.fill(colors.paint1);
        p5.rect(-width / 3, -height / 2, width / 1.5, height);

        // Add geometric shapes
        p5.fill(colors.paint2);
        p5.triangle(-width / 4, -height / 2, width / 4, -height / 2, 0, 0);
        p5.triangle(-width / 4, height / 2, width / 4, height / 2, 0, 0);

        // Add abstract elements
        p5.fill(colors.scarf1);
        p5.ellipse(0, -height / 4, width / 3, height / 3);
        p5.ellipse(0, height / 4, width / 3, height / 3);

        p5.pop();
    };

    const drawCubistMouthPattern = (p5, center, box, colors) => {
        const width = box.w * 2;
        const height = box.h * 1.5;

        p5.push();
        p5.translate(center.x, center.y);

        // Draw cubist mouth pattern
        p5.fill(colors.paint1);
        p5.rect(-width / 2, -height / 2, width, height);

        // Add geometric shapes
        p5.fill(colors.paint2);
        p5.triangle(-width / 3, -height / 2, width / 3, -height / 2, 0, 0);
        p5.triangle(-width / 3, height / 2, width / 3, height / 2, 0, 0);

        // Add abstract elements
        p5.fill(colors.scarf1);
        p5.ellipse(-width / 4, 0, width / 4, height / 3);
        p5.ellipse(width / 4, 0, width / 4, height / 3);

        p5.pop();
    };

    const drawScarfPattern = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Draw scarf-like patterns
        drawScarfEyePattern(p5, centers.leftEye, leftEye, colors, true);
        drawScarfEyePattern(p5, centers.rightEye, rightEye, colors, false);
        drawScarfNosePattern(p5, centers.nose, nose, colors);
        drawScarfMouthPattern(p5, centers.mouth, mouth, colors);
    };

    const drawScarfEyePattern = (p5, center, box, colors, isLeft) => {
        const size = box.w * 2.5;

        p5.push();
        p5.translate(center.x, center.y);

        // Draw fabric-like patterns
        p5.fill(colors.scarf1);
        p5.rect(-size / 2, -size / 2, size, size);

        // Add texture
        for (let i = 0; i < 5; i++) {
            p5.fill(colors.scarf2);
            p5.rect(-size / 2 + (i * size) / 5, -size / 2, size / 10, size);
        }

        p5.pop();
    };

    const drawFractalPattern = (p5, features, colors) => {
        const { leftEye, rightEye, nose, mouth, centers } = features;

        // Draw fractal patterns
        drawFractalEyePattern(p5, centers.leftEye, leftEye, colors, true);
        drawFractalEyePattern(p5, centers.rightEye, rightEye, colors, false);
        drawFractalNosePattern(p5, centers.nose, nose, colors);
        drawFractalMouthPattern(p5, centers.mouth, mouth, colors);
    };

    const drawFractalEyePattern = (p5, center, box, colors, isLeft) => {
        const size = box.w * 2;

        p5.push();
        p5.translate(center.x, center.y);

        // Draw recursive fractal pattern
        drawFractalShape(p5, 0, 0, size, 3, colors);

        p5.pop();
    };

    const drawFractalShape = (p5, x, y, size, depth, colors) => {
        if (depth === 0) return;

        // Draw main shape
        p5.fill(depth % 2 === 0 ? colors.paint1 : colors.paint2);
        p5.rect(x - size / 2, y - size / 2, size, size);

        // Recursively draw smaller shapes
        const newSize = size / 2;
        drawFractalShape(
            p5,
            x - newSize,
            y - newSize,
            newSize,
            depth - 1,
            colors
        );
        drawFractalShape(
            p5,
            x + newSize,
            y - newSize,
            newSize,
            depth - 1,
            colors
        );
        drawFractalShape(
            p5,
            x - newSize,
            y + newSize,
            newSize,
            depth - 1,
            colors
        );
        drawFractalShape(
            p5,
            x + newSize,
            y + newSize,
            newSize,
            depth - 1,
            colors
        );
    };

    const applyBlurDistortion = (p5, srcFrame, features) => {
        const { leftEye, rightEye, nose, mouth } = features;

        // Apply blur to each facial feature
        [leftEye, rightEye, nose, mouth].forEach((box) => {
            const expandedBox = expandBoundingBox(box, 1.4);

            // Create a temporary graphics buffer for the blurred region
            const blurBuffer = p5.createGraphics(expandedBox.w, expandedBox.h);
            blurBuffer.copy(
                srcFrame,
                expandedBox.x,
                expandedBox.y,
                expandedBox.w,
                expandedBox.h,
                0,
                0,
                expandedBox.w,
                expandedBox.h
            );

            // Apply blur effect
            blurBuffer.filter(p5.BLUR, blurIntensity * 20);

            // Draw the blurred region back to the main canvas
            p5.image(blurBuffer, expandedBox.x, expandedBox.y);
        });
    };

    const applyMosaicDistortion = (p5, srcFrame, features) => {
        const { leftEye, rightEye, nose, mouth } = features;

        // Apply mosaic to each facial feature
        [leftEye, rightEye, nose, mouth].forEach((box) => {
            const expandedBox = expandBoundingBox(box, 1.4);

            // Create a temporary graphics buffer for the mosaic region
            const mosaicBuffer = p5.createGraphics(
                expandedBox.w,
                expandedBox.h
            );
            mosaicBuffer.copy(
                srcFrame,
                expandedBox.x,
                expandedBox.y,
                expandedBox.w,
                expandedBox.h,
                0,
                0,
                expandedBox.w,
                expandedBox.h
            );

            // Apply mosaic effect
            const tileSize = mosaicSize * (1 + distortionLevel);
            for (let x = 0; x < expandedBox.w; x += tileSize) {
                for (let y = 0; y < expandedBox.h; y += tileSize) {
                    // Sample color from center of tile
                    const centerX = x + tileSize / 2;
                    const centerY = y + tileSize / 2;
                    const c = mosaicBuffer.get(centerX, centerY);

                    // Fill the tile with the sampled color
                    mosaicBuffer.fill(c);
                    mosaicBuffer.noStroke();
                    mosaicBuffer.rect(x, y, tileSize, tileSize);
                }
            }

            // Draw the mosaic region back to the main canvas
            p5.image(mosaicBuffer, expandedBox.x, expandedBox.y);
        });
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

            {/* Camera Control - Centered */}
            <div className="flex gap-2">
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

            {/* Effect Controls - Horizontal Layout */}
            {isCapturing && isModelLoaded && (
                <div className="w-full max-w-2xl">
                    <div className="flex flex-wrap gap-4 justify-center items-center">
                        {/* Distortion Type */}
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <label className="text-sm font-medium text-gray-700">
                                Distortion Type
                            </label>
                            <select
                                value={distortionType}
                                onChange={(e) =>
                                    setDistortionType(e.target.value)
                                }
                                className="p-2 border rounded"
                            >
                                <option value="stretch">Stretch</option>
                                <option value="bulge">Bulge</option>
                                <option value="twist">Twist</option>
                                <option value="dazzle">Dazzle</option>
                                <option value="juggalo">Juggalo</option>
                                <option value="gan3d">GAN3D</option>
                                <option value="contour">Contour</option>
                                <option value="cvdazzle">CV Dazzle</option>
                                <option value="facepaint">Face Paint</option>
                                <option value="blur">Blur</option>
                                <option value="mosaic">Mosaic</option>
                            </select>
                        </div>

                        {/* Distortion Level */}
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <label className="text-sm font-medium text-gray-700">
                                Distortion Level: {distortionLevel.toFixed(1)}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={distortionLevel}
                                onChange={(e) =>
                                    setDistortionLevel(
                                        parseFloat(e.target.value)
                                    )
                                }
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Smoothness */}
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <label className="text-sm font-medium text-gray-700">
                                Smoothness: {(smoothFactor * 100).toFixed(0)}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={smoothFactor}
                                onChange={(e) =>
                                    setSmoothFactor(parseFloat(e.target.value))
                                }
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Dazzle Pattern */}
                        {distortionType === "dazzle" && (
                            <div className="flex flex-col gap-1 min-w-[200px]">
                                <label className="text-sm font-medium text-gray-700">
                                    Dazzle Pattern
                                </label>
                                <select
                                    value={dazzlePattern}
                                    onChange={(e) =>
                                        setDazzlePattern(e.target.value)
                                    }
                                    className="p-2 border rounded"
                                >
                                    <option value="geometric">Geometric</option>
                                    <option value="asymmetric">
                                        Asymmetric
                                    </option>
                                    <option value="minimal">Minimal</option>
                                </select>
                            </div>
                        )}

                        {/* Juggalo Style */}
                        {distortionType === "juggalo" && (
                            <div className="flex flex-col gap-1 min-w-[200px]">
                                <label className="text-sm font-medium text-gray-700">
                                    Juggalo Style
                                </label>
                                <select
                                    value={juggaloStyle}
                                    onChange={(e) =>
                                        setJuggaloStyle(e.target.value)
                                    }
                                    className="p-2 border rounded"
                                >
                                    <option value="classic">Classic</option>
                                    <option value="modern">Modern</option>
                                    <option value="extreme">Extreme</option>
                                </select>
                            </div>
                        )}

                        {/* GAN3D Style */}
                        {distortionType === "gan3d" && (
                            <>
                                <div className="flex flex-col gap-1 min-w-[200px]">
                                    <label className="text-sm font-medium text-gray-700">
                                        GAN3D Style
                                    </label>
                                    <select
                                        value={gan3dStyle}
                                        onChange={(e) =>
                                            setGan3dStyle(e.target.value)
                                        }
                                        className="p-2 border rounded"
                                    >
                                        <option value="geometric">
                                            Geometric
                                        </option>
                                        <option value="organic">Organic</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1 min-w-[200px]">
                                    <label className="text-sm font-medium text-gray-700">
                                        3D Intensity:{" "}
                                        {(gan3dIntensity * 100).toFixed(0)}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={gan3dIntensity}
                                        onChange={(e) =>
                                            setGan3dIntensity(
                                                parseFloat(e.target.value)
                                            )
                                        }
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </>
                        )}

                        {/* Contour Style */}
                        {distortionType === "contour" && (
                            <>
                                <div className="flex flex-col gap-1 min-w-[200px]">
                                    <label className="text-sm font-medium text-gray-700">
                                        Contour Style
                                    </label>
                                    <select
                                        value={contourStyle}
                                        onChange={(e) =>
                                            setContourStyle(e.target.value)
                                        }
                                        className="p-2 border rounded"
                                    >
                                        <option value="natural">Natural</option>
                                        <option value="dramatic">
                                            Dramatic
                                        </option>
                                        <option value="avantgarde">
                                            Avant-Garde
                                        </option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1 min-w-[200px]">
                                    <label className="text-sm font-medium text-gray-700">
                                        Contour Intensity:{" "}
                                        {(contourIntensity * 100).toFixed(0)}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={contourIntensity}
                                        onChange={(e) =>
                                            setContourIntensity(
                                                parseFloat(e.target.value)
                                            )
                                        }
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </>
                        )}

                        {/* CV Dazzle Style */}
                        {distortionType === "cvdazzle" && (
                            <div className="flex flex-col gap-1 min-w-[200px]">
                                <label className="text-sm font-medium text-gray-700">
                                    CV Dazzle Style
                                </label>
                                <select
                                    value={cvdazzleStyle}
                                    onChange={(e) =>
                                        setCvdazzleStyle(e.target.value)
                                    }
                                    className="p-2 border rounded"
                                >
                                    <option value="mesh">Mesh Pattern</option>
                                    <option value="asymmetric">
                                        Asymmetric
                                    </option>
                                    <option value="occlusion">
                                        Strategic Occlusion
                                    </option>
                                </select>
                            </div>
                        )}

                        {/* Face Paint Style */}
                        {distortionType === "facepaint" && (
                            <div className="flex flex-col gap-1 min-w-[200px]">
                                <label className="text-sm font-medium text-gray-700">
                                    Face Paint Style
                                </label>
                                <select
                                    value={facepaintStyle}
                                    onChange={(e) =>
                                        setFacepaintStyle(e.target.value)
                                    }
                                    className="p-2 border rounded"
                                >
                                    <option value="cubist">Cubist</option>
                                    <option value="scarf">Scarf Pattern</option>
                                    <option value="fractal">Fractal</option>
                                </select>
                            </div>
                        )}

                        {/* Blur Intensity */}
                        {distortionType === "blur" && (
                            <div className="flex flex-col gap-1 min-w-[200px]">
                                <label className="text-sm font-medium text-gray-700">
                                    Blur Intensity:{" "}
                                    {(blurIntensity * 100).toFixed(0)}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={blurIntensity}
                                    onChange={(e) =>
                                        setBlurIntensity(
                                            parseFloat(e.target.value)
                                        )
                                    }
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        )}

                        {/* Mosaic Size */}
                        {distortionType === "mosaic" && (
                            <div className="flex flex-col gap-1 min-w-[200px]">
                                <label className="text-sm font-medium text-gray-700">
                                    Mosaic Size: {mosaicSize}px
                                </label>
                                <input
                                    type="range"
                                    min="5"
                                    max="30"
                                    step="1"
                                    value={mosaicSize}
                                    onChange={(e) =>
                                        setMosaicSize(parseInt(e.target.value))
                                    }
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
