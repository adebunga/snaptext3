import ImageToText from './components/ImageToText';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-8 py-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
          Image to Text
        </h1>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4">Image to text in seconds.</h2>
          <p className="text-gray-400 text-xl">
            Upload your image and get the text content instantly.
          </p>
        </div>
        
        <ImageToText />
      </div>
    </main>
  );
}
