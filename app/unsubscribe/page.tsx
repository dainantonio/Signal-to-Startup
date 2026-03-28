export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z" fill="white" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Unsubscribed</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          You have been removed from the Signal to Startup waitlist. You will not receive any
          further emails from us.
        </p>
        <a
          href="/"
          className="inline-block mt-4 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-900 transition-colors"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}
