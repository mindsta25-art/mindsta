import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { HomeHeader } from '@/components/HomeHeader';
import { HomeFooter } from '@/components/HomeFooter';
import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, MessageSquare, Phone, Send, CheckCircle } from 'lucide-react';
import { submitSupportMessage } from '@/api/tickets';

export default function Support() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const Header = user ? StudentHeader : HomeHeader;
  const Footer = user ? StudentFooter : HomeFooter;
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.category || !formData.message) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const result = await submitSupportMessage({
        name: formData.name,
        email: formData.email,
        category: formData.category,
        subject: formData.subject || 'Support Request',
        message: formData.message
      });

      setTicketNumber(result.ticketNumber);
      setSubmitted(true);
      
      toast({
        title: 'Message Sent!',
        description: `We've received your message. Ticket #${result.ticketNumber}`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Send',
        description: error.message || 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <HomeHeader />
        <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Message Received!</h2>
              <p className="text-muted-foreground mb-4">
                Thank you for contacting us. Your ticket number is:
              </p>
              <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 font-mono text-xl font-bold py-3 px-4 rounded-lg mb-6">
                {ticketNumber}
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                We'll respond to your message within 24 hours at {formData.email}
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      email: '',
                      category: '',
                      subject: '',
                      message: ''
                    });
                  }}
                  className="flex-1"
                >
                  Send Another
                </Button>
                <Button 
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 pt-24 pb-12 px-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Contact Support
            </h1>
            <p className="text-lg text-muted-foreground">
              Need help? We're here for you! Send us a message and we'll respond within 24 hours.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Contact Information Cards */}
            <div className="md:col-span-1 space-y-4">
              <Card className="border-purple-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Email Us</CardTitle>
                      <CardDescription className="text-xs">support@mindsta.com</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-blue-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">WhatsApp</CardTitle>
                      <CardDescription className="text-xs">Chat with us</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="border-green-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Response Time</CardTitle>
                      <CardDescription className="text-xs">Within 24 hours</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and our team will get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing & Payment</SelectItem>
                        <SelectItem value="account">Account Help</SelectItem>
                        <SelectItem value="content">Lesson Content</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject (Optional)</Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your issue"
                      value={formData.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Please describe your question or issue in detail..."
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      rows={6}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
