/**
 * Dashboard Redirect
 * Redirects to the new modern StudentHome dashboard
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from '@/components/ui/loading';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the modern student home dashboard
    navigate('/home', { replace: true });
  }, [navigate]);

  return <LoadingScreen message="Loading dashboard..." />;
};

export default Dashboard;
