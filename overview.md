# Face Distortion Application Overview

## Application Purpose
This is a frontend-only Next.js application that demonstrates real-time facial feature distortion using computer vision and machine learning techniques. The app allows users to access their webcam and apply adjustable distortion effects to their facial features for a face camouflage effect.

## Technologies Used

### Core Libraries
- **Next.js 15.2.3**: React framework for the application structure
- **React 19.0.0**: UI library for component-based development
- **react-p5 1.4.1**: React wrapper for p5.js creative coding library
- **ML5.js**: Machine learning library built on TensorFlow.js (loaded externally via CDN)
- **TailwindCSS 4**: Utility-first CSS framework for styling

### Implementation Approach
- **Client-side only rendering**: Uses Next.js's `'use client'` directive and dynamic imports with `ssr: false`
- **External script loading**: ML5.js loaded via Next.js Script component with `beforeInteractive` strategy

## Features
- Real-time webcam access and display
- Facial landmark detection (eyes, nose, mouth)
- Adjustable distortion level (0-2) via slider interface
- Visual feedback for loading and error states
- Processing happens entirely in the browser (no server-side computation)

## Algorithms and Technical Implementation

### Face Detection and Landmark Extraction
- Utilizes ML5.js's FaceAPI wrapper for:
  - Face detection in video stream
  - Facial landmark extraction for eyes, nose, and mouth

### Distortion Algorithm
1. **Detection**: Continuously detects facial landmarks using ML5's FaceAPI
2. **Bounding Box Calculation**:
   - Computes bounding boxes for key facial features (eyes, nose, mouth)
   - Expands boxes with margin factor (1.4x) for smoother blending
3. **Center Point Calculation**: Determines center points for each facial feature
4. **Distortion Application**:
   - Calculates offset positions based on user-selected distortion level
   - Moves features asymmetrically (eyes shift outward and up, nose shifts up, mouth shifts down)
   - Uses proportional distortion based on feature size
5. **Image Manipulation**:
   - Uses p5.js `copy()` method to extract and reposition facial features
   - Maintains continuous detection-distortion loop

### Performance Considerations
- Dynamic imports for client-side libraries to optimize loading
- Recursive callback pattern for continuous face detection
- Canvas-based rendering for real-time video manipulation

## Workflow
1. User visits the application and clicks "Start Camera"
2. The app requests webcam permission
3. Upon access, the video stream initializes and ML5 FaceAPI model loads
4. Once loaded, the app begins detecting facial landmarks
5. User can adjust distortion level using the slider
6. Distortion is applied in real-time as facial landmarks are tracked

## Technical Limitations
- Requires good lighting for optimal face detection
- Performance depends on client device capabilities
- Requires browser permission for camera access
- Works best with a single face in the frame