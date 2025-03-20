import './globals.css'
import Script from 'next/script'

export const metadata = {
  title: 'Face Distortion App',
  description: 'A Next.js app showcasing p5.js face distortion effects',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        {children}
        <Script 
          src="https://unpkg.com/ml5@0.12.2/dist/ml5.min.js" 
          strategy="beforeInteractive"
        />
      </body>
    </html>
  )
}