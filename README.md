# Face Distortion Camera App

A real-time face distortion application built with Next.js and p5.js that applies various artistic and camouflage effects to faces detected through the webcam.

## Features

-   Real-time face detection and tracking
-   Multiple distortion effects with adjustable intensity
-   Smooth transitions between frames
-   Responsive web interface
-   No server-side processing (runs entirely in browser)

## Available Distortion Types

### 1. Stretch Distortion

-   Stretches facial features in different directions
-   Adjustable intensity for each feature (eyes, nose, mouth)
-   Creates a surreal, elongated effect

### 2. Bulge Distortion

-   Creates a bulging effect around facial features
-   Features expand outward from their centers
-   Adjustable bulge factor for intensity control

### 3. Twist Distortion

-   Rotates facial features around their centers
-   Creates a swirling, twisted effect
-   Adjustable rotation angle

### 4. Dazzle Camouflage

-   Applies geometric patterns to disrupt face recognition
-   Three pattern styles:
    -   Geometric: Regular geometric shapes
    -   Asymmetric: Irregular, asymmetric patterns
    -   Minimal: Simplified, minimalistic patterns
-   Inspired by WWI dazzle camouflage

### 5. Juggalo Style

-   Three distinct styles:
    -   Classic: Traditional juggalo face paint
    -   Modern: Contemporary variations
    -   Extreme: Exaggerated, dramatic effects
-   Customizable color schemes

### 6. GAN3D Distortion

-   Creates 3D geometric effects on facial features
-   Three styles:
    -   Geometric: Regular 3D shapes (cubes, pyramids)
    -   Organic: Fluid, natural shapes
    -   Hybrid: Combination of geometric and organic
-   Adjustable depth and intensity

### 7. Contour Distortion

-   Enhances facial contours
-   Three styles:
    -   Natural: Subtle contour enhancement
    -   Dramatic: Bold contour definition
    -   Avantgarde: Abstract contour patterns
-   Customizable intensity

### 8. CV Dazzle

-   Computer vision-specific camouflage
-   Three styles:
    -   Mesh: Grid-based patterns
    -   Asymmetric: Irregular patterns
    -   Occlusion: Feature-blocking patterns
-   Designed to confuse face detection algorithms

### 9. Face Paint

-   Artistic face painting effects
-   Three styles:
    -   Cubist: Geometric, Picasso-inspired
    -   Scarf: Pattern-based designs
    -   Fractal: Recursive, mathematical patterns
-   Customizable color palettes

### 10. Blur Distortion

-   Applies selective blur to facial features
-   Adjustable blur intensity
-   Can be combined with other effects

### 11. Mosaic Distortion

-   Pixelates facial features
-   Adjustable pixel size
-   Creates a privacy-protecting effect

## Technical Details

### Dependencies

-   Next.js 15.2.3
-   React 19
-   p5.js (via react-p5)
-   FaceAPI.js (for face detection)

### Setup and Installation

1. Clone the repository
2. Install dependencies:
    ```bash
    npm install
    ```
3. Run the development server:
    ```bash
    npm run dev
    ```
4. Open http://localhost:3000 in your browser

### Usage

1. Click "Start Camera" to begin
2. Select a distortion type from the dropdown
3. Adjust the distortion level using the slider
4. For specific distortion types, additional style options will appear
5. Click "Stop Camera" to end the session

## Performance Considerations

-   The application uses smooth transitions between frames to reduce jitter
-   Face detection is optimized for real-time performance
-   Distortion effects are applied using p5.js for efficient rendering
-   All processing is done client-side to minimize latency

## Browser Compatibility

-   Chrome (recommended)
-   Firefox
-   Safari
-   Edge

## License

MIT License
