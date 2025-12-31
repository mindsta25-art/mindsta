import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cookie, Shield, Settings, Eye, CheckCircle, Mail } from 'lucide-react';
import { useState } from 'react';
import { siteConfig } from '@/config/siteConfig';

export default function Cookies() {
  const [preferences, setPreferences] = useState({
    necessary: true, // Always required
    functional: true,
    analytics: true,
    marketing: false,
  });

  const handleSavePreferences = () => {
    // Save cookie preferences to localStorage
    localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
    alert('Cookie preferences saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950">
      <StudentHeader />
      
      <main className="container mx-auto px-4 py-12 max-w-5xl mt-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <Cookie className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl sm:text-5xl font-extrabold">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Cookie Policy
              </span>
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Learn how we use cookies and similar technologies to enhance your learning experience.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last Updated: November 14, 2025
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* What Are Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="w-5 h-5 text-purple-600" />
                What Are Cookies?
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when 
                you visit our website. They help us provide you with a better experience by remembering your 
                preferences, understanding how you use our platform, and improving our services.
              </p>
              <p className="text-muted-foreground mt-3">
                We use both "session cookies" (temporary cookies that expire when you close your browser) and 
                "persistent cookies" (cookies that remain on your device until they expire or you delete them).
              </p>
            </CardContent>
          </Card>

          {/* Types of Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Types of Cookies We Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Necessary Cookies */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-foreground">1. Necessary Cookies (Required)</h3>
                </div>
                <p className="text-muted-foreground mb-2">
                  These cookies are essential for the platform to function properly. They cannot be disabled.
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li><strong>Authentication:</strong> Keep you logged in as you navigate between pages</li>
                  <li><strong>Security:</strong> Prevent fraudulent activity and ensure secure connections</li>
                  <li><strong>Session Management:</strong> Remember your progress through lessons and quizzes</li>
                  <li><strong>Load Balancing:</strong> Distribute server load for optimal performance</li>
                </ul>
              </div>

              {/* Functional Cookies */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-foreground">2. Functional Cookies</h3>
                </div>
                <p className="text-muted-foreground mb-2">
                  These cookies enable enhanced functionality and personalization.
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li><strong>Preferences:</strong> Remember your language, theme, and display settings</li>
                  <li><strong>Customization:</strong> Store your grade level and subject preferences</li>
                  <li><strong>Accessibility:</strong> Remember accessibility options you've selected</li>
                  <li><strong>Video Settings:</strong> Remember your video quality and subtitle preferences</li>
                </ul>
              </div>

              {/* Analytics Cookies */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-foreground">3. Analytics Cookies</h3>
                </div>
                <p className="text-muted-foreground mb-2">
                  These cookies help us understand how you use our platform so we can improve it.
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li><strong>Usage Analytics:</strong> Track which pages and features you visit</li>
                  <li><strong>Performance:</strong> Measure page load times and identify errors</li>
                  <li><strong>User Behavior:</strong> Understand how students navigate lessons</li>
                  <li><strong>A/B Testing:</strong> Test different features to improve user experience</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2 italic">
                  We use Google Analytics and similar services. Data is anonymized and aggregated.
                </p>
              </div>

              {/* Marketing Cookies */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-foreground">4. Marketing Cookies</h3>
                </div>
                <p className="text-muted-foreground mb-2">
                  These cookies track your activity to show you relevant advertisements and measure campaign effectiveness.
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li><strong>Advertising:</strong> Display ads for courses you might be interested in</li>
                  <li><strong>Retargeting:</strong> Show you Mindsta ads on other websites</li>
                  <li><strong>Campaign Tracking:</strong> Measure the effectiveness of our marketing</li>
                  <li><strong>Social Media:</strong> Enable sharing features and social media integration</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2 italic">
                  These cookies are optional. You can opt-out using the preferences below.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Cookies and Services</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>
                We use trusted third-party services that may set their own cookies:
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Google Analytics</h4>
                  <p className="text-sm">Helps us understand user behavior and improve our platform.</p>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline text-sm">
                    Learn more →
                  </a>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Paystack</h4>
                  <p className="text-sm">Processes payments securely for course subscriptions.</p>
                  <a href="https://paystack.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline text-sm">
                    Learn more →
                  </a>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">YouTube</h4>
                  <p className="text-sm">Embeds educational videos in our lessons.</p>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline text-sm">
                    Learn more →
                  </a>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Social Media</h4>
                  <p className="text-sm">Facebook, Twitter sharing and integration features.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookie Preferences */}
          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Manage Your Cookie Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Control which cookies we can use. Note that disabling some cookies may affect your experience.
              </p>
              
              <div className="space-y-3">
                {/* Necessary */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-semibold text-foreground">Necessary Cookies</h4>
                    <p className="text-sm text-muted-foreground">Required for the platform to work</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Always Active</span>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>

                {/* Functional */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-semibold text-foreground">Functional Cookies</h4>
                    <p className="text-sm text-muted-foreground">Remember your preferences and settings</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-semibold text-foreground">Analytics Cookies</h4>
                    <p className="text-sm text-muted-foreground">Help us improve our platform</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Marketing */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h4 className="font-semibold text-foreground">Marketing Cookies</h4>
                    <p className="text-sm text-muted-foreground">Show you relevant advertisements</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              <Button 
                onClick={handleSavePreferences} 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Save Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Managing Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>How to Manage Cookies in Your Browser</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3">
              <p>
                You can also control cookies through your browser settings. Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>View what cookies are stored and delete them individually</li>
                <li>Block all cookies from specific websites</li>
                <li>Block all third-party cookies</li>
                <li>Block all cookies from all websites</li>
                <li>Delete all cookies when you close your browser</li>
              </ul>
              
              <p className="font-semibold text-foreground mt-4 mb-2">Browser-Specific Instructions:</p>
              <div className="grid sm:grid-cols-2 gap-2">
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                  → Google Chrome
                </a>
                <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                  → Mozilla Firefox
                </a>
                <a href="https://support.apple.com/en-us/HT201265" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                  → Safari
                </a>
                <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                  → Microsoft Edge
                </a>
              </div>
              
              <p className="text-sm italic mt-3">
                <strong>Note:</strong> Blocking all cookies may prevent you from using some features of our platform, 
                such as staying logged in or saving your progress.
              </p>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Cookie Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices or for 
                legal, operational, or regulatory reasons. We will notify you of any material changes by updating 
                the "Last Updated" date at the top of this policy.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                Questions About Cookies?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-3">
                If you have questions about our use of cookies or other tracking technologies, please contact us:
              </p>
              <div className="space-y-2">
                <p><strong>Email:</strong> <a href={`mailto:${siteConfig.contact.privacyEmail}`} className="text-purple-600 hover:underline">{siteConfig.contact.privacyEmail}</a></p>
                <p><strong>Support:</strong> <a href={`mailto:${siteConfig.contact.supportEmail}`} className="text-purple-600 hover:underline">{siteConfig.contact.supportEmail}</a></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <StudentFooter />
    </div>
  );
}
