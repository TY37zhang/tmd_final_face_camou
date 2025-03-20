import ClientWrapper from '../components/ClientWrapper'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="max-w-3xl w-full flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Face Distortion Demo</h1>
          <p className="text-gray-600">
            This app uses ML5.js and P5.js to detect and distort facial features.
            Click &quot;Start Camera&quot; to begin the experience.
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <ClientWrapper />
        </div>
        
        <div className="text-sm text-gray-500">
          <p>
            Note: This app requires camera access and works best in good lighting.
            All processing happens locally in your browser.
          </p>
        </div>
      </div>
    </main>
  )
}