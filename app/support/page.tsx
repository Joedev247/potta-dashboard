'use client';

import { useState } from 'react';
import { 
  ChatCircle, 
  Envelope, 
  Phone, 
  Clock, 
  PaperPlaneTilt,
  CheckCircle
} from '@phosphor-icons/react';

export default function SupportPage() {
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    message: '',
    priority: 'medium'
  });
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    'Payment Issue',
    'Account Problem',
    'Technical Support',
    'Billing Question',
    'Feature Request',
    'Other'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ subject: '', category: '', message: '', priority: 'medium' });
    }, 3000);
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <ChatCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Get Support</h1>
          </div>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white border-2 border-gray-200 p-6 text-center hover:border-green-500 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Live Chat</h3>
            <p className="text-sm text-gray-600 mb-4">Chat with our support team</p>
            <button className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all text-sm">
              Start Chat
            </button>
          </div>

          <div className="bg-white border-2 border-gray-200 p-6 text-center hover:border-green-500 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Envelope className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Email Support</h3>
            <p className="text-sm text-gray-600 mb-4">Get help via email</p>
            <p className="text-sm font-medium text-green-600">support@Instanvi.com</p>
          </div>

          <div className="bg-white border-2 border-gray-200 p-6 text-center hover:border-green-500 transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Phone Support</h3>
            <p className="text-sm text-gray-600 mb-4">Call us directly</p>
            <p className="text-sm font-medium text-green-600">+1 (555) 123-4567</p>
          </div>
        </div>

        {/* Support Form */}
        <div className="bg-white border-2 border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
              <ChatCircle className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Submit a Support Ticket</h2>
          </div>

          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ticket Submitted!</h3>
              <p className="text-gray-600">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                  placeholder="What can we help you with?"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-green-500 resize-none"
                  placeholder="Please describe your issue in detail..."
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Average response time: 2-4 hours</span>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2"
                >
                  <PaperPlaneTilt className="w-4 h-4" />
                  Submit Ticket
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

