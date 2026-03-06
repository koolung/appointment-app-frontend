export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-purple-600">Salon Booking</h1>
            <div className="space-x-4">
              <a href="/login" className="text-gray-600 hover:text-purple-600">Login</a>
              <a href="/signup" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Sign Up</a>
            </div>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Book Your Perfect Salon Experience
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Schedule appointments with top stylists at your convenience
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a 
              href="/booking" 
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 text-lg font-semibold"
            >
              Book as Member
            </a>
            <a 
              href="/booking/guest" 
              className="inline-block bg-pink-600 text-white px-8 py-3 rounded-lg hover:bg-pink-700 text-lg font-semibold"
            >
              Book as Guest
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">100+</div>
              <p className="text-gray-600">Professional Stylists</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">10K+</div>
              <p className="text-gray-600">Happy Clients</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">5★</div>
              <p className="text-gray-600">Average Rating</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
