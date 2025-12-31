import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, UserCheck, Database, Bell, Mail, FileText, Cookie, AlertTriangle } from 'lucide-react';
import { siteConfig } from '@/config/siteConfig';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950">
      <StudentHeader />
      
      <main className="container mx-auto px-4 py-12 max-w-5xl mt-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl sm:text-5xl font-extrabold">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Privacy Policy
              </span>
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Welcome to Mindsta's Privacy Notice. We are committed to safeguarding the privacy of your information at all times.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last Updated: November 17, 2025
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none text-muted-foreground">
              <p className="mb-3">
                Mindsta ("We" or "Our") operates <a href="https://www.mindsta.com.ng" className="text-purple-600 hover:underline">www.mindsta.com.ng</a> (the "Website") and Mindsta Mobile Application (the "Application"). The Website and Application are platforms built to host, manage, and deploy curriculum-relevant content to learners via smartphones and tablets, with marginal concern for internet limitations and costs.
              </p>
              <p className="mb-3">
                This page informs you of Our policies regarding the collection, use and disclosure of your personal data when you visit, access, browse through and/or use Our Website or Mobile Application ("Platform") and when you use any storage or transmitting device provided by us.
              </p>
              <p>
                Please read carefully, as it's important for you to understand how We intend to retain and protect the private information you provide us. To protect your privacy, Mindsta follows different principles in accordance with worldwide practices for user privacy and data protection.
              </p>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <div className="space-y-2">
                <p><strong>Full name of legal entity:</strong> Mindsta Education</p>
                <p><strong>Email address:</strong> <a href="mailto:mindsta25@gmail.com" className="text-purple-600 hover:underline">mindsta25@gmail.com</a></p>
                <p><strong>Telephone number:</strong> <a href="tel:+2347000222333" className="text-purple-600 hover:underline">+234 700 022 2333</a></p>
              </div>
            </CardContent>
          </Card>

          {/* Consent */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-600" />
                Consent
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                By accessing or using Our services or Products, you agree to the collection and use of information in accordance with this Notice. Once you provide consent, you may change your mind and withdraw the consent at any time by contacting us at <a href="mailto:mindsta25@gmail.com" className="text-purple-600 hover:underline">mindsta25@gmail.com</a>, but please note that consent withdrawal will not affect the lawfulness of any processing carried out before you withdraw your consent.
              </p>
            </CardContent>
          </Card>

          {/* Data We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                The Data We Collect About You
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-3">When signing up on Our Platform, We collect information about you. This information may include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Profile data:</strong> such as your name, username or alias, e-mail address, mailing address, location, class, school, age, and phone number</li>
                <li><strong>Financial data:</strong> such as your card information, billing address, and payment options may also be required by our payment service providers</li>
                <li><strong>Technical information:</strong> such as the type of mobile device and internet browser you use, your computer IP address, data about the pages you access, mobile device ID or unique identifier, statistics on page views, standard Web log data, still and moving images, etc</li>
                <li><strong>Marketing data:</strong> such as users' feedback</li>
                <li><strong>Usage data:</strong> such as time spent on Our application, when application was opened, device data and learning statistics (time spent learning, lessons viewed, test scores, etc.)</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-600" />
                How We Use Your Personal Data
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-3">We will only use your personal data for the purpose for which We collected it which may include the following:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>to register you as a new user</li>
                <li>to process and deliver your order</li>
                <li>to manage your relationship with us</li>
                <li>to recommend products or services which may be of interest to you</li>
                <li>to help us identify and provide the type of service offerings in which you are most interested in</li>
                <li>to enable us create the content most relevant to you and to generally improve Our services</li>
                <li>to make the Platform easier for you to use by not having to enter information more than once</li>
                <li>to manage risk, or to detect, prevent, and/or remediate fraud or other potentially prohibited or illegal activities</li>
                <li>to send periodic emails and marketing materials regarding your interest in Our products and services</li>
              </ul>
            </CardContent>
          </Card>

          {/* Third Party Links */}
          <Card>
            <CardHeader>
              <CardTitle>Third Party Links</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-3">
                Occasionally, We may include or offer third party products or services on Our Platform. As such, Our Platform may contain links to websites owned and operated by third parties. These third-party websites may have their own separate and independent privacy policies, which may govern the collection and processing of your personal data.
              </p>
              <p>
                We urge you to review these privacy policies – because this Notice will not apply. We therefore have no responsibility or liability for the content, activities and privacy practices of such third-party websites.
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="w-5 h-5 text-purple-600" />
                Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-3">
                Our Website uses cookies (small files containing a string of characters), which We place on your computer, if you agree. These cookies allow us to uniquely identify your browser and to distinguish you from other users of Our Website. This enables us to track your preferences and provide you with a personalized and smooth experience when you browse Our Website.
              </p>
              <p className="mb-3">
                The cookies We use are "analytical" cookies. They allow us to recognize and count the number of visitors and to see how visitors move around the Website when they are using it. This helps us to improve the way Our Website works, for example by ensuring that users are finding what they are looking for easily.
              </p>
              <p>
                We do not share the information the cookies collect with any third parties.
              </p>
            </CardContent>
          </Card>

          {/* User Profiles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-600" />
                User Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-3">
                Every registered user has a unique personal profile. Each profile is assigned a unique personal identification number, which helps us ensure that only you can access your profile.
              </p>
              <p className="mb-3">
                When you register, We create your profile, assign a personal identification number (your User ID), then send this personal identification number back to your email address with an activation link for the activation of your profile. This code is uniquely yours.
              </p>
              <p>
                It is your passport to seamless travel across Our Platform, allowing you to use Our Platform without having to fill out registration forms with information you've already provided. Even if you switch computers, you won't have to re-register – just use your User ID to identify yourself.
              </p>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-3">
                We store and process your personal information on Our computers in {siteConfig.location.country}. Where We need to transfer your data to another country, such country must have an adequate data protection law.
              </p>
              <p className="mb-3">
                Please be assured that We have put in place appropriate security measures including but not limited to access controls, firewalls, data encryption, and physical security to prevent your personal data from being lost, altered, disclosed, or otherwise used in an unauthorized way.
              </p>
              <p className="mb-3">
                In addition, We limit access to your personal data to those employees, agents and contractors who have a business need to know. These employees, agents, and contractors have a duty to maintain confidentiality at all times and will only process your personal data according to Our instructions.
              </p>
              <p>
                Also note that We have put in place procedures to deal with any suspected personal data breach and will notify you and any applicable regulator of a breach where We are legally required to do so.
              </p>
            </CardContent>
          </Card>

          {/* Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                Retention of Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-3">
                We will keep your personal information for as long as it is required and in accordance with the purpose it is being processed for, or for tax, accounting, regulatory, or legal purposes. We will keep the personal data for a period which enables us to handle or respond to any complaints, queries or concerns relating to Our relationship with you.
              </p>
              <p className="mb-3">
                Related to this, We may retain your personal data for a longer period in the event of a complaint or if We reasonably believe there is a prospect of litigation in respect to Our relationship with you.
              </p>
              <p>
                You may notify us whenever you no longer wish to hear from us and We will keep minimum information upon receipt of such notice to ensure that no future contact is made by us. We will actively review the personal information We hold and delete it securely, or in some cases anonymize it, when there is no longer a legal, business or user need for it to be retained.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Your Legal Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Request access</strong> to your personal data (commonly known as a "data subject access request"). This enables you to receive a copy of the personal information We hold about you and check that We are lawfully processing it. Please note that a data subject access request may attract an administrative fee</li>
                <li><strong>Request correction</strong> of the personal data that We hold about you. This enables you to have any incomplete or inaccurate data We hold about you corrected, though We may need to verify the accuracy of the new data you provide to us</li>
                <li><strong>Request erasure</strong> of your personal data. This enables you to ask us to delete or remove personal data where there is no good reason for us continuing to process it. You also have the right to ask us to delete or remove your personal data where you have successfully exercised your right to object to processing (see below), where We may have processed your information unlawfully or where We are required to erase your personal data to comply with local law</li>
                <li><strong>Object to processing</strong> of your personal data where We are relying on a legitimate interest (or those of a third party) and there is something about your particular situation which makes you want to object to processing on this ground as you feel it impacts on your fundamental rights and freedoms. You also have the right to object where We are processing your personal data for direct marketing purposes</li>
                <li><strong>Request the transfer</strong> of your personal data to you or to a third party. We will provide you, or a third party you have chosen, your personal data in a structured, commonly used, machine-readable format. Note that this right only applies to automated information which you initially provided consent for us to use or where We used the information to perform a contract with you. Please note that this request may also attract an administrative fee</li>
                <li><strong>Withdraw consent</strong> at any time where We are relying on consent to process your personal data. However, this will not affect the lawfulness of any processing carried out before you withdraw your consent. If you withdraw your consent, We may not be able to provide certain products or services to you. We will advise you if this is the case at the time you withdraw your consent</li>
              </ul>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-3">
                At Mindsta, We implement a variety of reasonable security measures to protect the security and integrity of your personal information.
              </p>
              <p className="mb-3">
                To prevent unauthorized access to your information, We have implemented strong controls and security safeguards at the technical and operational levels. Our Platform uses Transport Layer Security (SSL/TLS) to ensure secure transmission of your personal data. You should see the padlock symbol in your URL address bar once you are successfully logged into the platform. The URL address will also start with https:// depicting a secure Webpage.
              </p>
              <p>
                Please note that you also have a significant role in protecting your information. No one can see or edit your personal information without knowing your username and password, so do not share these with others. However, as the internet is not a secure medium, We cannot guarantee that security breaches will never occur. Accordingly, We are not responsible for the matters, which include actions of hackers and other unauthorized third parties that breach Our reasonable security procedure.
              </p>
            </CardContent>
          </Card>

          {/* Online Privacy Notice Only */}
          <Card>
            <CardHeader>
              <CardTitle>Online Privacy Notice Only</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                This online Notice applies only to information collected on Our Platform and not to information collected offline.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-600" />
                Changes to Our Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                We reserve the right to amend or modify this Privacy Policy and if We do so, We will post the changes on this page. It is your responsibility to check the Privacy Policy every time you submit information to us or use Our services. Your use will signify that you agree to any such changes. In the event the purpose for processing changes, or if a revision is material, Mindsta will notify you via electronic mail or via a pop-up or redirection when you log in to our Platform.
              </p>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                DISCLAIMER
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                By this Policy We do not represent or warrant the condition or functionality of Our platform(s), its suitability for use, nor guarantee that Our service will be free from interruption or any error. No liability or responsibility shall lie for risks associated with the use of Our Platform, including but not limited to any risk to your computer, software or data being damaged by any virus, software, or any other file that might be transmitted or activated via Our Platform or your access to it. Neither do We guarantee the reliability of information contained on Our Platform—particularly those shared by third party users.
              </p>
            </CardContent>
          </Card>

          {/* Contact Us */}
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-3">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="space-y-2">
                <p><strong>Data Protection Officer (DPO)</strong></p>
                <p><strong>Mindsta</strong></p>
                <p><strong>Email:</strong> <a href="mailto:mindsta25@gmail.com" className="text-purple-600 hover:underline">mindsta25@gmail.com</a></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <StudentFooter />
    </div>
  );
}
