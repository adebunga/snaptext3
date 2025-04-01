import ImageToText from './components/ImageToText';
import AnimatedBackground from './components/AnimatedBackground';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white relative">
      <AnimatedBackground />
      <nav className="border-b border-gray-800 px-8 py-6 relative">
        <h1 className="text-2xl font-bold font-montserrat flex items-center">
          <span className="text-white">snap</span>
          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">text</span>
          <span className="text-white">.</span>
        </h1>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-light mb-6">Snap. Extract. Copy.</h2>
          <p className="text-xl text-gray-400/80 font-light">
            Get the text content in your images instantly.
          </p>
        </div>
        
        <ImageToText />

        {/* Features Section */}
        <div className="mt-32 perspective-1000">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Smart Design Card */}
            <div className="group relative bg-gray-900/30 backdrop-blur-xl rounded-2xl p-8 shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden transform-gpu hover:-rotate-y-2 hover:rotate-x-2 hover:shadow-2xl hover:shadow-pink-500/10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-px rounded-2xl bg-gradient-to-b from-white/[0.07] to-transparent"></div>
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 group-hover:ring-white/30 transition-colors duration-500"></div>
              
              <div className="relative flex flex-col items-center text-center transform-gpu transition-transform duration-300 group-hover:translate-z-10">
                <div className="w-12 h-12 mb-6 flex items-center justify-center">
                  <svg className="w-8 h-8 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 font-montserrat">Smart Design</h3>
                <p className="text-gray-400">
                  AI-powered OCR technology that understands your images and extracts text with precision.
                </p>
              </div>
            </div>

            {/* Real-time Card */}
            <div className="group relative bg-gray-900/30 backdrop-blur-xl rounded-2xl p-8 shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden transform-gpu hover:rotate-y-2 hover:rotate-x-2 hover:shadow-2xl hover:shadow-pink-500/10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-px rounded-2xl bg-gradient-to-b from-white/[0.07] to-transparent"></div>
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 group-hover:ring-white/30 transition-colors duration-500"></div>
              
              <div className="relative flex flex-col items-center text-center transform-gpu transition-transform duration-300 group-hover:translate-z-10">
                <div className="w-12 h-12 mb-6 flex items-center justify-center">
                  <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 font-montserrat">Real-time</h3>
                <p className="text-gray-400">
                  Instant text extraction that adapts to your images in real-time.
                </p>
              </div>
            </div>

            {/* Editable Card */}
            <div className="group relative bg-gray-900/30 backdrop-blur-xl rounded-2xl p-8 shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden transform-gpu hover:-rotate-y-2 hover:rotate-x-2 hover:shadow-2xl hover:shadow-pink-500/10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-px rounded-2xl bg-gradient-to-b from-white/[0.07] to-transparent"></div>
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 group-hover:ring-white/30 transition-colors duration-500"></div>
              
              <div className="relative flex flex-col items-center text-center transform-gpu transition-transform duration-300 group-hover:translate-z-10">
                <div className="w-12 h-12 mb-6 flex items-center justify-center">
                  <svg 
                    className="w-8 h-8 text-pink-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4 font-montserrat">Editable Text</h3>
                <p className="text-gray-400">
                  Edit and refine your extracted text before copying to ensure perfect accuracy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
