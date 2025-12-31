/**
 * Loading skeleton for dashboard
 */

import { Card, CardContent } from '@/components/ui/card';

export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="pt-24 container mx-auto px-4">
        <div className="animate-pulse space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded mb-3"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Content Sections */}
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-4/6"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
