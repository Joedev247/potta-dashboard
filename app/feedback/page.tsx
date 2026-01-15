'use client';

import { useState, useEffect } from 'react';
import { 
  ChatCircle, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  PaperPlaneTilt,
  CheckCircle
} from '@phosphor-icons/react';

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    type: 'feature',
    rating: 0,
    title: '',
    message: '',
    contact: false,
    email: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Simulate page load
    setTimeout(() => {
      setPageLoading(false);
    }, 300);
  }, []);

  const feedbackTypes = [
    { id: 'feature', label: 'Feature Request' },
    { id: 'bug', label: 'Bug Report' },
    { id: 'improvement', label: 'Improvement' },
    { id: 'other', label: 'Other' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRating = (rating: number) => {
    setFormData({ ...formData, rating });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ 
        type: 'feature', 
        rating: 0, 
        title: '', 
        message: '', 
        contact: false, 
        email: '' 
      });
    }, 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white fade-in">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 fade-in">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <ChatCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Give Feedback</h1>
          </div>
        </div>

        {/* Feedback Form */}
        {pageLoading ? (
          <div className="bg-white border-2 border-gray-200 p-6 sm:p-8 fade-in">
            {/* Skeleton Loader */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-7 bg-gray-200  w-48 animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-20 w-40 mb-3 animate-pulse"></div>
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200  animate-pulse"></div>
                  ))}
                </div>
              </div>
              <div>
                <div className="h-4 bg-gray-200  w-48 mb-3 animate-pulse"></div>
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  ))}
                </div>
              </div>
              <div>
                <div className="h-4 bg-gray-200  w-16 mb-2 animate-pulse"></div>
                <div className="h-12 bg-gray-200 animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-200  w-20 mb-2 animate-pulse"></div>
                <div className="h-32 bg-gray-200 animate-pulse"></div>
              </div>
              <div className="h-16 bg-gray-200  animate-pulse"></div>
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <div className="h-11 bg-gray-200 w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
              <ChatCircle className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Share Your Thoughts</h2>
          </div>

            {submitted ? (
              <div className="text-center py-12 fade-in">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle className="w-8 h-8 text-green-600" weight="fill" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-gray-600">Your feedback has been submitted successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 fade-in">
                {/* Feedback Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    What type of feedback is this?
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {feedbackTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.id })}
                        className={`p-4 border-2 transition-all duration-200 text-left ${
                          formData.type === type.id
                            ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md'
                            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    How would you rate your experience?
                  </label>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRating(star)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                          star <= formData.rating
                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" weight={star <= formData.rating ? 'fill' : 'regular'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Brief summary of your feedback"
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 bg-white hover:border-gray-300 placeholder:text-gray-400"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Details
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Please provide more details about your feedback..."
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 resize-none bg-white hover:border-gray-300 placeholder:text-gray-400"
                  />
                </div>

                {/* Contact Option */}
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 ">
                  <input
                    type="checkbox"
                    id="contact"
                    name="contact"
                    checked={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.checked })}
                    className="mt-1 w-5 h-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="contact" className="text-sm font-semibold text-gray-900 cursor-pointer">
                      I'd like to be contacted about this feedback
                    </label>
                    {formData.contact && (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        className="w-full mt-3 px-4 py-2.5 border-2 border-gray-200 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 bg-white hover:border-gray-300 placeholder:text-gray-400"
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <PaperPlaneTilt className="w-4 h-4" />
                    Submit Feedback
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

