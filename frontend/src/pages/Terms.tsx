import { StudentHeader } from '@/components/StudentHeader';
import { StudentFooter } from '@/components/StudentFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950">
      <StudentHeader />
      
      <main className="container mx-auto px-4 py-12 max-w-5xl mt-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <FileText className="w-12 h-12 text-purple-600" />
            <h1 className="text-4xl sm:text-5xl font-extrabold">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                Terms & Conditions
              </span>
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using our platform.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our Terms & Conditions are currently being updated. Please check back soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <StudentFooter />
    </div>
  );
}
