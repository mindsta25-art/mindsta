import { HomeHeader } from '@/components/HomeHeader';
import { HomeFooter } from '@/components/HomeFooter';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useState } from 'react';
import { Search, HelpCircle } from 'lucide-react';

const FAQPage = () => {
  const { user } = useAuth();
  const Header = user ? StudentHeader : HomeHeader;
  const Footer = user ? StudentFooter : HomeFooter;
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I enroll in a lessons?',
          a: 'To enroll in a lesson, browse our lesson catalog, select your grade and subject, then click the "Enroll Now" button. Payment options will be presented for your chosen lesson.',
        },
        {
          q: 'How do I access my enrolled lessons?',
          a: 'Once enrolled, go to the "My Learning" page from the main menu. All your enrolled lessons will be listed there with your progress tracked.',
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
          a: 'Normally, we do not offer refunds for digital products. However, if you encounter any issues with your purchase, please contact our support team to discuss your situation.',
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
          a: 'You can reach us through the Contact Support page, via WhatsApp using the floating button, or by emailing support@mindsta.com.ng.',
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
      
      <main className="pt-2 sm:pt-6 pb-12 sm:pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground">
              Find quick answers to common questions
            </p>
          </div>

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
                    <HelpCircle className="w-5 h-5 text-indigo-500" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq, qIndex) => (
                      <AccordionItem
                        key={qIndex}
                        value={`cat-${catIndex}-q-${qIndex}`}
                        className="border-gray-200 dark:border-gray-700"
                      >
                        <AccordionTrigger className="text-left font-semibold text-sm sm:text-base hover:no-underline hover:text-indigo-600 transition-colors py-4">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
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
