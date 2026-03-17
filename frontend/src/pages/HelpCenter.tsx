import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  Search, 
  BookOpen, 
  MessageCircle, 
  FileText, 
  HelpCircle, 
  Mail, 
  Phone,
  ExternalLink,
  Shield,
  CreditCard,
  Settings,
  Video,
  Award
} from 'lucide-react';
import { HomeHeader } from '@/components/HomeHeader';
import { HomeFooter } from '@/components/HomeFooter';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { useAuth } from '@/contexts/AuthContext';

const HelpCenter = () => {
  const { user } = useAuth();
  const Header = user ? StudentHeader : HomeHeader;
  const Footer = user ? StudentFooter : HomeFooter;
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      title: 'Getting Started',
      icon: BookOpen,
      description: 'Learn the basics of using Mindsta',
      articles: [
        'How to create an account',
        'Enrolling in your first course',
        'Navigating the dashboard',
        'Setting up your profile',
      ],
      link: '/faq#getting-started',
    },
    {
      title: 'Courses & Learning',
      icon: Video,
      description: 'Everything about lessons and courses',
      articles: [
        'How to access lessons',
        'Understanding course structure',
        'Tracking your progress',
        'Taking quizzes and tests',
      ],
      link: '/faq#learning',
    },
    {
      title: 'Payments & Billing',
      icon: CreditCard,
      description: 'Payment methods, refunds, and billing',
      articles: [
        'Accepted payment methods',
        'How to purchase a course',
        'Refund policy',
        'Bundle discounts',
      ],
      link: '/faq#payments',
    },
    {
      title: 'Account Settings',
      icon: Settings,
      description: 'Manage your account and preferences',
      articles: [
        'Update your profile',
        'Change password',
        'Email preferences',
        'Privacy settings',
      ],
      link: '/faq#account',
    },
    {
      title: 'Achievements & Rewards',
      icon: Award,
      description: 'Badges, streaks, and milestones',
      articles: [
        'How streaks work',
        'Earning achievements',
        'Unlocking badges',
        'Progress tracking',
      ],
      link: '/faq#achievements',
    },
    {
      title: 'Technical Support',
      icon: HelpCircle,
      description: 'Troubleshooting and technical help',
      articles: [
        'Video playback issues',
        'Login problems',
        'Browser compatibility',
        'Mobile app support',
      ],
      link: '/faq#technical',
    },
  ];

  const quickLinks = [
    {
      title: 'Frequently Asked Questions',
      description: 'Find answers to common questions',
      icon: HelpCircle,
      link: '/faq',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: MessageCircle,
      link: '/support',
      color: 'from-green-500 to-emerald-600',
    },
    {
      title: 'Terms of Service',
      description: 'Review our terms and conditions',
      icon: FileText,
      link: '/terms',
      color: 'from-purple-500 to-violet-600',
    },
    {
      title: 'Privacy Policy',
      description: 'Learn how we protect your data',
      icon: Shield,
      link: '/privacy',
      color: 'from-orange-500 to-amber-600',
    },
  ];

  const filteredCategories = categories.filter(
    (cat) =>
      cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.articles.some((article) =>
        article.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="pt-2 pb-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                How can we help you?
              </h1>
              <p className="text-lg text-indigo-100 mb-8">
                Search our knowledge base or browse categories below
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search for help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg bg-white text-gray-900 placeholder:text-gray-500 border-0 focus:ring-2 focus:ring-white/20"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="container mx-auto px-4 -mt-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={link.link}>
                  <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-indigo-200 bg-white dark:bg-gray-800">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${link.color} text-white flex-shrink-0`}>
                          <link.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {link.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {link.description}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Categories Section */}
        <section className="container mx-auto px-4 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Browse by Category
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={category.link}>
                  <Card className="h-full hover:shadow-lg transition-all cursor-pointer group bg-white dark:bg-gray-800">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                          <category.icon className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-gray-900 dark:text-white">
                          {category.title}
                        </CardTitle>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {category.articles.map((article, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                          >
                            <span className="text-indigo-400 mt-1">•</span>
                            <span>{article}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No results found for "{searchQuery}"
              </p>
            </div>
          )}
        </section>

        {/* Contact Section */}
        <section className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
                <p className="text-lg text-indigo-100 mb-8">
                  Our support team is here to assist you with any questions or issues
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link to="/support">
                    <Button 
                      size="lg" 
                      className="bg-white text-indigo-600 hover:bg-gray-100 shadow-lg"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Contact Support
                    </Button>
                  </Link>
                  
                  <div className="flex gap-6 text-white">
                    <a 
                      href="mailto:support@mindsta.com.ng" 
                      className="flex items-center gap-2 hover:text-indigo-200 transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      <span className="hidden sm:inline">support@mindsta.com.ng</span>
                    </a>
                    <a 
                      href="tel:+2341234567890" 
                      className="flex items-center gap-2 hover:text-indigo-200 transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      <span className="hidden sm:inline">+234 123 456 7890</span>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HelpCenter;
