'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      console.log('Submitting forgot password with email:', email);
      const payload = { email };
      console.log('Payload being sent:', JSON.stringify(payload));
      
      // Call forgot password API endpoint
      const response = await authAPI.forgotPassword(payload);
      console.log('Forgot password success response:', response);
      
      setMessage('Password reset link has been sent to your email. Please check your inbox.');
      setIsSubmitted(true);
      setEmail('');
    } catch (err: any) {
      console.error('Forgot password error caught:', err);
      console.error('Error response data:', err.response?.data);
      
      const errorMsg = err.response?.data?.message || 
                       (Array.isArray(err.response?.data?.message) 
                         ? err.response.data.message.join(', ')
                         : 'Failed to send reset link. Please try again.');
      setError(String(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Forgot Password?</h1>
        <p className="text-center text-gray-600 mb-8">Enter your email to receive a password reset link.</p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
            {message}
          </div>
        )}

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white font-semibold py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">Check your email for further instructions.</p>
          </div>
        )}

        <p className="text-center text-gray-600 mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
