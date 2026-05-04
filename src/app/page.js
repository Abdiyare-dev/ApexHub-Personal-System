"use client";

import { useNavigation } from "@/context/NavigationContext";
import Sidebar from "@/components/Sidebar";
import TopNav from "@/components/TopNav";
import LandingPage from "@/components/Landing/LandingPage";

// Core components
import SummaryAnalytics from "@/components/Dashboard/SummaryAnalytics";
import Settings from "@/components/Dashboard/Settings";

// Finance components
import FinanceDashboard from "@/components/Finance/FinanceDashboard";
import CashIn from "@/components/Finance/CashIn";
import Expenses from "@/components/Finance/Expenses";
import Budget from "@/components/Finance/Budget";
import Reports from "@/components/Finance/Reports";

// Productivity components
import Tasks from "@/components/Productivity/Tasks";
import Goals from "@/components/Productivity/Goals";
import Projects from "@/components/Productivity/Projects";
import ProductivityDashboard from "@/components/Productivity/ProductivityDashboard";
import ProductivityReports from "@/components/Productivity/ProductivityReports";

import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { activeTab } = useNavigation();
  const { user, loading } = useAuth();

  // Dynamic Routing Engine based on Sidebar Selection
  const renderContent = () => {
    switch (activeTab) {
      // Finance Switch Cases
      case 'Finance Dashboard':
        return <FinanceDashboard />;
      case 'Finance Cash In':
        return <CashIn />;
      case 'Finance Expenses':
        return <Expenses />;
      case 'Finance Budget':
        return <Budget />;
      case 'Finance Reports':
        return <Reports />;
      
      // Productivity Switch Cases
      case 'Productivity Tasks':
        return <Tasks />;
      case 'Productivity Goals':
        return <Goals />;
      case 'Productivity Projects':
        return <Projects />;
      case 'Productivity Reports':
        return <ProductivityReports />;
      
      case 'Productivity Dashboard':
        return <ProductivityDashboard />;
        
      case 'Settings':
        return <Settings />;

      // Default to main Summary
      case 'Summary & Analytics':
      default:
        return <SummaryAnalytics />;
    }
  };

  // Show landing page for unauthenticated visitors
  if (!user && !loading) {
    return <LandingPage />;
  }

  // Show spinner while authenticating
  if (loading || !user) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
        <p className="hero-subtitle">Authenticating Secure Connection...</p>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="main-wrapper" id="mainWrapper">
        <TopNav />
        <main className="main-content" id="mainContent">
          {renderContent()}
        </main>
      </div>
    </>
  );
}
