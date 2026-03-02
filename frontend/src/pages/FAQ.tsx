import { HomeHeader } from '@/components/HomeHeader';
import { HomeFooter } from '@/components/HomeFooter';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FAQPage = () => {
  const { user } = useAuth();
  const Header = user ? StudentHeader : HomeHeader;
  const Footer = user ? StudentFooter : HomeFooter;
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I enroll in a course?',
          a: 'To enroll in a course, browse our course catalog, select your grade and subject, then click the "Enroll Now" button. Payment options will be presented for your chosen course.',
        },
        {
          q: 'How do I access my enrolled courses?',
          a: 'Once enrolled, go to the "My Learning" page from the main menu. All your enrolled courses will be listed there with your progress tracked.',
        },
        {
          q: 'Can I download lessons for offline viewing?',
          a: 'Currently, our platform requires an internet connection. We recommend stable internet access for the best learning experience.',
        },
      ],
    },
    {
      category: 'Payments & Billing',
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept various payment methods including card payments, bank transfers, and mobile money. All payments are securely processed through our payment gateway.',
        },
        {
          q: 'Can I get a refund?',
          a: 'Refund requests are evaluated on a case-by-case basis within 7 days of purchase. Please contact our support team with your order details.',
        },
        {
          q: 'Do you offer discounts for multiple courses?',
          a: 'Yes! We offer bundle discounts when you enroll in multiple courses. Check our Bundles page for current offers.',
        },
      ],
    },
    {
      category: 'Learning & Progress',
      questions: [
        {
          q: 'How do I track my progress?',
          a: 'Your progress is automatically tracked as you complete lessons. Visit the Progress page to see detailed analytics, achievements, and subject mastery levels.',
        },
        {
          q: 'What are streaks and how do they work?',
          a: 'Streaks track consecutive days of learning. Complete at least one lesson per day to maintain your streak. You earn streak protection once you reach certain milestones.',
        },
        {
          q: 'How do quizzes work?',
          a: 'Each lesson includes a quiz to test your understanding. You need to score at least 80% to pass. You can retake quizzes to improve your score.',
        },
      ],
    },
    {
      category: 'Technical Support',
      questions: [
        {
          q: 'I forgot my password. How do I reset it?',
          a: 'Click on "Forgot Password" on the login page, enter your email, and follow the instructions sent to your inbox.',
        },
        {
          q: 'The videos are not playing. What should I do?',
          a: 'Try refreshing the page, clearing your browser cache, or using a different browser. Ensure you have a stable internet connection.',
        },
        {
          q: 'How do I contact support?',
          a: 'You can reach us through the Contact Support page, via WhatsApp using the floating button, or by emailing support@mindsta.com.',
        },
      ],
    },
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      faq =>
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground">
              Find quick answers to common questions
            </p>
          </motion.div>

          {/* Search */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* FAQ Sections */}
          <div className="space-y-6">
            {filteredFaqs.map((category, catIndex) => (
              <Card key={catIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.questions.map((faq, qIndex) => {
                    const globalIndex = catIndex * 100 + qIndex;
                    const isOpen = openIndex === globalIndex;

                    return (
                      <div
                        key={qIndex}
                        className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0"
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-0 h-auto hover:bg-transparent"
                          onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                        >
                          <span className="text-left font-semibold">{faq.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 flex-shrink-0 ml-2" />
                          ) : (
                            <ChevronDown className="w-5 h-5 flex-shrink-0 ml-2" />
                          )}
                        </Button>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 text-muted-foreground text-sm leading-relaxed"
                          >
                            {faq.a}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}

            {filteredFaqs.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No FAQs match your search. Try different keywords or{' '}
                    <a href="/support" className="text-indigo-600 hover:underline">
                      contact support
                    </a>
                    .
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
