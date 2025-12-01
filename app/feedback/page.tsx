'use client';

import { useState } from 'react';
import { 
  MessageSquare, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  Send,
  CheckCircle
} from 'lucide-react';

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
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Give Feedback</h1>
          </div>
        </div>

        {/* Feedback Form */}
        <div className="bg-white border-2 border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Share Your Thoughts</h2>
          </div>

          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
              <p className="text-gray-600">Your feedback has been submitted successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What type of feedback is this?
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.id })}
                      className={`p-4 border-2 transition-all text-left ${
                        formData.type === type.id
                          ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How would you rate your experience?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRating(star)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        star <= formData.rating
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                  placeholder="Brief summary of your feedback"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Details
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500 resize-none"
                  placeholder="Please provide more details about your feedback..."
                />
              </div>

              {/* Contact Option */}
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                <input
                  type="checkbox"
                  id="contact"
                  name="contact"
                  checked={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.checked })}
                  className="mt-1 w-5 h-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
                />
                <div className="flex-1">
                  <label htmlFor="contact" className="text-sm font-medium text-gray-900">
                    I'd like to be contacted about this feedback
                  </label>
                  {formData.contact && (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      className="w-full mt-2 px-4 py-2 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

