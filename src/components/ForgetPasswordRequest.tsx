import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgetPasswordRequest() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:4000/api/users/forgetpass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-gray-900 to-gray-800 text-gray-100 noise-bg">
    

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {success ? (
            
            <div className="bg-gradient-to-b from-white/5 to-white/10 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                
                <h1 className="text-2xl font-bold text-white mb-3">Check Your Email</h1>
                
                <p className="text-gray-400 mb-2">
                  We've sent a password reset link to
                </p>
                <p className="text-white font-medium mb-6">{email}</p>
                
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-200/80">
                    The link will expire in <strong>1 hour</strong>. If you don't see the email, check your spam folder.
                  </p>
                </div>

                <Link
                  to="/"
                  className="inline-block w-full px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition font-medium"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
      
            <div className="bg-gradient-to-b from-white/5 to-white/10 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Forgot Password?</h1>
                <p className="text-gray-400 text-sm">
                  Enter your email address and we'll send you a link to reset your password
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/20 bg-gradient-to-b from-white/0 to-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition shadow-lg disabled:shadow-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 inline-block animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/" className="text-sm text-sky-400 hover:text-sky-300 transition">
                  ← Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      
      <footer className="py-8 text-center text-gray-500 text-sm border-t border-white/5">
        <p>&copy; {new Date().getFullYear()} RRS. All rights reserved.</p>
      </footer>
    </div>
  );
}