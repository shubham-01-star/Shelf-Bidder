export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold">Shelf-Bidder</h1>
        <p className="text-lg text-gray-600">
          Transform your shelf space into revenue
        </p>
        <div className="mt-8 space-y-4">
          <button className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </main>
  );
}
