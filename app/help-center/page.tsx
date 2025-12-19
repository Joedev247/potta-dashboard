'use client';

import { useState, useMemo } from 'react';
import { 
  Question, 
  MagnifyingGlass, 
  BookOpen, 
  ChatCircle, 
  FileText, 
  Play, 
  CaretRight,
  CaretDown,
  ArrowSquareOut,
  X
} from '@phosphor-icons/react';
import Link from 'next/link';

interface Article {
  question: string;
  answer: string;
  category?: string;
}

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

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
      icon: ChatCircle,
      articles: [
        'Updating your profile',
        'Managing team members',
        'Organization settings',
        'Security best practices'
      ]
    },
    {
      title: 'Video Tutorials',
      icon: Play,
      articles: [
        'Platform overview',
        'Payment setup walkthrough',
        'API integration guide',
        'Advanced features'
      ]
    }
  ];

  const popularArticlesData: Article[] = [
    {
      question: 'How do I get started?',
      answer: `Getting started with instanvi is easy! Follow these simple steps:

1. **Create an Account**: Sign up for a free account at instanvi.com using your email address and creating a secure password.

2. **Complete Onboarding**: Complete the onboarding process by providing:
   - Stakeholder information
   - Business activity details
   - Payment method preferences
   - ID document verification

3. **Verify Your Account**: Verify your email address and complete the identity verification process.

4. **Set Up Payment Methods**: Choose and configure your preferred payment methods (MTN Mobile Money, Orange Money).

5. **Create Your First Payment Link**: Go to the Payments page and click "Create payment" to generate your first payment link.

6. **Start Accepting Payments**: Share your payment link with customers and start receiving payments!

Need more help? Contact our support team for assistance.`,
      category: 'Getting Started'
    },
    {
      question: 'What payment methods are supported?',
      answer: `instanvi currently supports the following payment methods in Cameroon:

**MTN Mobile Money**
- Accept payments via MTN Mobile Money network
- Real-time transaction processing
- Secure and reliable payment gateway
- Available 24/7

**Orange Money**
- Accept payments via Orange Money network
- Instant payment notifications
- Secure transactions
- Full transaction history

Both payment methods are:
- Fully integrated with our platform
- Supported in XAF (Central African CFA Franc) and USD
- Protected by industry-standard security measures
- Subject to transaction fees (see pricing page for details)

To enable payment methods, go to Settings > Organization and configure your preferred methods during onboarding or in the Payment Methods section.`,
      category: 'Payments'
    },
    {
      question: 'How to handle refunds',
      answer: `Processing refunds through instanvi is straightforward:

**How to Issue a Refund:**

1. **Navigate to Payments**: Go to the Payments page in your dashboard
2. **Find the Transaction**: Locate the payment you want to refund using the search or filters
3. **View Payment Details**: Click on the "View" icon to see payment details
4. **Initiate Refund**: Click the "Refund" button in the payment details modal
5. **Enter Refund Amount**: Specify the full or partial refund amount
6. **Confirm Refund**: Review and confirm the refund request

**Refund Processing:**
- Full refunds return the entire payment amount to the customer
- Partial refunds allow you to refund a specific amount
- Refunds are processed through the original payment method
- Processing time: 3-5 business days for mobile money refunds

**Refund Policies:**
- Refunds must comply with your refund policy
- Refunded amounts are deducted from your available balance
- All refunds are logged in your transaction history
- You can track refund status in the Refunds tab

**Important Notes:**
- Ensure you have sufficient balance for refunds
- Refunds may take several business days to appear in customer accounts
- Contact support if you need assistance with refunds`,
      category: 'Payments'
    },
    {
      question: 'Setting up webhooks',
      answer: `Webhooks allow you to receive real-time notifications about payment events. Here's how to set them up:

**What are Webhooks?**
Webhooks are HTTP callbacks that send event notifications to your server URL when specific events occur, such as:
- Payment completed
- Payment failed
- Refund processed
- Chargeback received

**Setting Up Webhooks:**

1. **Navigate to Browse Page**: Go to Browse > Webhooks
2. **Add Webhook**: Click "Add webhook" button
3. **Configure Settings**:
   - Enter your webhook URL (must be HTTPS)
   - Select events you want to receive (e.g., payment.*, refund.*)
   - Choose webhook status (Active/Inactive)

4. **Test Your Webhook**: Use the test feature to verify your endpoint
5. **Save Configuration**: Click "Save" to activate your webhook

**Webhook Configuration Details:**

- **URL**: Your server endpoint that will receive webhook notifications
- **Events**: Select which events to subscribe to:
  - payment.paid - Payment completed
  - payment.failed - Payment failed
  - refund.processed - Refund completed
  - chargeback.received - Chargeback received

**Webhook Security:**
- All webhooks are sent over HTTPS
- Include signature verification in your webhook handler
- Validate webhook payloads before processing
- Keep your webhook URLs secure

**Best Practices:**
- Use HTTPS endpoints only
- Implement idempotency in your webhook handlers
- Log all webhook events for debugging
- Test webhooks in test mode first

For API integration details, visit Browse > API Logs to see webhook delivery status.`,
      category: 'API'
    },
    {
      question: 'API authentication guide',
      answer: `Learn how to authenticate with the instanvi API:

**API Authentication Methods:**

**1. API Keys**
- Located in Browse > API Keys
- Separate keys for Live and Test modes
- Keep your API keys secure and never share them publicly

**2. Access Tokens**
- Create access tokens for OAuth-based authentication
- More secure than API keys for long-term use
- Can be revoked at any time

**Getting Started with API:**

1. **Get Your API Keys**:
   - Navigate to Browse > API Keys
   - Copy your Live or Test API key
   - Store it securely (use environment variables)

2. **Make Your First API Request**:
   \`\`\`bash
   curl -X GET https://api.instanvi.com/v1/payments \\
     -H "Authorization: Bearer YOUR_API_KEY"
   \`\`\`

3. **Authentication Headers**:
   \`\`\`
   Authorization: Bearer YOUR_API_KEY
   Content-Type: application/json
   \`\`\`

**API Endpoints:**
- Base URL: https://api.instanvi.com/v1
- All endpoints require authentication
- Use HTTPS for all requests

**Security Best Practices:**
- Never commit API keys to version control
- Rotate API keys regularly
- Use environment variables for keys
- Implement rate limiting in your application
- Monitor API usage in Browse > API Logs

**Test Mode:**
- Use test API keys for development
- Test payments don't process real money
- Switch to live keys when ready for production

**Rate Limits:**
- 100 requests per minute per API key
- Monitor your usage to avoid rate limits
- Contact support for higher limits if needed

For detailed API documentation, check out the API reference in Browse > API Keys.`,
      category: 'API'
    }
  ];

  const allArticles = useMemo(() => {
    const articles: Article[] = [
      ...popularArticlesData,
      {
        question: 'How to create your first payment',
        answer: 'To create your first payment, go to the Payments page and click "Create payment". Fill in the payment details and generate your payment link.',
        category: 'Getting Started'
      },
      {
        question: 'Setting up your account',
        answer: 'Complete the onboarding process by providing your business information, stakeholder details, and verifying your identity.',
        category: 'Getting Started'
      },
      {
        question: 'Understanding test mode',
        answer: 'Test mode allows you to test payments without processing real money. Enable it in your account settings.',
        category: 'Getting Started'
      },
      {
        question: 'API integration basics',
        answer: 'Use our REST API to integrate payments into your application. Get started with API keys from the Browse page.',
        category: 'Getting Started'
      },
      {
        question: 'Payment methods overview',
        answer: 'We support MTN Mobile Money and Orange Money in Cameroon. Configure your preferred methods during onboarding.',
        category: 'Payments'
      },
      {
        question: 'Payment statuses explained',
        answer: 'Payments can have different statuses: pending, paid, failed, or cancelled. Check your payment dashboard for details.',
        category: 'Payments'
      },
      {
        question: 'Webhook configuration',
        answer: 'Configure webhooks in Browse > Webhooks to receive real-time notifications about payment events.',
        category: 'Payments'
      },
      {
        question: 'Updating your profile',
        answer: 'Go to Settings > Profile to update your personal information, email, and phone number.',
        category: 'Account Management'
      },
      {
        question: 'Managing team members',
        answer: 'Team member management features are coming soon. Contact support for enterprise team features.',
        category: 'Account Management'
      },
      {
        question: 'Organization settings',
        answer: 'Update your organization details in Settings > Organization, including name, address, and registration information.',
        category: 'Account Management'
      },
      {
        question: 'Security best practices',
        answer: 'Enable two-factor authentication, use strong passwords, and keep your API keys secure. Review security settings regularly.',
        category: 'Account Management'
      }
    ];
    return articles;
  }, []);

  // Filter articles based on search query
  const filteredPopularArticles = useMemo(() => {
    if (!searchQuery.trim()) {
      return popularArticlesData;
    }
    const query = searchQuery.toLowerCase();
    return popularArticlesData.filter(article => 
      article.question.toLowerCase().includes(query) ||
      article.answer.toLowerCase().includes(query) ||
      (article.category && article.category.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }
    const query = searchQuery.toLowerCase();
    return categories.map(category => ({
      ...category,
      articles: category.articles.filter(article => 
        article.toLowerCase().includes(query)
      )
    })).filter(category => category.articles.length > 0);
  }, [searchQuery]);

  const toggleArticle = (question: string) => {
    setExpandedArticle(expandedArticle === question ? null : question);
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Question className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Help Center</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 focus:outline-none focus:border-green-500 text-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              Found {filteredPopularArticles.length} article(s) matching "{searchQuery}"
            </p>
          )}
        </div>

        {/* Popular Articles */}
        <div className="bg-white border-2 border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Articles</h2>
          <div className="space-y-3">
            {filteredPopularArticles.length > 0 ? (
              filteredPopularArticles.map((article, index) => {
                const isExpanded = expandedArticle === article.question;
                return (
                  <div
                    key={index}
                    className="border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleArticle(article.question)}
                      className="w-full flex items-center justify-between p-4 hover:bg-green-100 transition-colors text-left"
                    >
                      <span className="font-medium text-gray-900 pr-4">{article.question}</span>
                      {isExpanded ? (
                        <CaretDown className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <CaretRight className="w-5 h-5 text-green-600 flex-shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-green-100 bg-white">
                        <div className="pt-4 text-gray-700 whitespace-pre-line leading-relaxed">
                          {article.answer}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No articles found matching your search.
              </div>
            )}
          </div>
        </div>

        {/* Categories */}
        {filteredCategories.length > 0 && (
          <div className="grid grid-cols-2 gap-6">
            {filteredCategories.map((category, index) => {
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
        )}

        {searchQuery && filteredCategories.length === 0 && filteredPopularArticles.length === 0 && (
          <div className="bg-white border-2 border-gray-200 p-8 text-center">
            <p className="text-gray-600 mb-4">No results found for "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-2 bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors rounded"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-100 p-8">
          <div className="flex items-center gap-3 mb-4">
            <ChatCircle className="w-6 h-6 text-green-600" />
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
            <ArrowSquareOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

