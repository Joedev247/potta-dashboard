'use client';

import { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Video, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      title: 'Getting Started',
      icon: BookOpen,
      articles: [
        'How to create your first payment',
        'Setting up your account',
        'Understanding test mode',
        'API integration basics'
      ]
    },
    {
      title: 'Payments',
      icon: FileText,
      articles: [
        'Payment methods overview',
        'Handling refunds',
        'Payment statuses explained',
        'Webhook configuration'
      ]
    },
    {
      title: 'Account Management',
      icon: MessageSquare,
      articles: [
        'Updating your profile',
        'Managing team members',
        'Organization settings',
        'Security best practices'
      ]
    },
    {
      title: 'Video Tutorials',
      icon: Video,
      articles: [
        'Platform overview',
        'Payment setup walkthrough',
        'API integration guide',
        'Advanced features'
      ]
    }
  ];

  const popularArticles = [
    'How do I get started?',
    'What payment methods are supported?',
    'How to handle refunds',
    'Setting up webhooks',
    'API authentication guide'
  ];

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Help Center</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 focus:outline-none focus:border-green-500 text-lg"
            />
          </div>
        </div>

        {/* Popular Articles */}
        <div className="bg-white border-2 border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Articles</h2>
          <div className="space-y-3">
            {popularArticles.map((article, index) => (
              <button
                key={index}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 hover:bg-green-100 transition-colors text-left"
              >
                <span className="font-medium text-gray-900">{article}</span>
                <ChevronRight className="w-5 h-5 text-green-600" />
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div key={index} className="bg-white border-2 border-gray-200 p-6 hover:border-green-500 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
                </div>
                <ul className="space-y-2">
                  {category.articles.map((article, idx) => (
                    <li key={idx}>
                      <button className="text-left text-gray-700 hover:text-green-600 transition-colors text-sm">
                        {article}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Contact Support */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-100 p-8">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-900">Still need help?</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Can't find what you're looking for? Our support team is here to help you.
          </p>
          <Link 
            href="/support"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all"
          >
            Contact Support
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

