"use client";

import { useNavigation } from "@/context/NavigationContext";
import { useAuth } from "@/context/AuthContext";

// Core components
import SummaryAnalytics from "@/components/Dashboard/SummaryAnalytics";
import Settings from "@/components/Dashboard/Settings";

// Finance components
import CashIn from "@/components/Finance/CashIn";
import Expenses from "@/components/Finance/Expenses";
import Budget from "@/components/Finance/Budget";
import Savings from "@/components/Finance/Savings";
import Reports from "@/components/Finance/Reports";

// Productivity components
import Tasks from "@/components/Productivity/Tasks";
import Habits from "@/components/Productivity/Habits";
import Timetable from "@/components/Productivity/Timetable";
import Goals from "@/components/Productivity/Goals";
import Projects from "@/components/Productivity/Projects";
import ProductivityReports from "@/components/Productivity/ProductivityReports";

export default function Home() {
  const { activeTab, setActiveTab } = useNavigation();
  const { user, loading } = useAuth();

  // Dynamic Routing Engine based on Sidebar Selection
  const renderContent = () => {
    switch (activeTab) {
      // Finance/Productivity overviews were merged into the unified dashboard.
      case 'Finance Dashboard':
      case 'Finance':
      case 'Productivity Dashboard':  return <SummaryAnalytics onNavigate={setActiveTab} />;
      case 'Finance Cash In':
      case 'Cash In':              return <CashIn />;
      case 'Finance Expenses':
      case 'Expenses':             return <Expenses />;
      case 'Finance Budget':
      case 'Budget':               return <Budget />;
      case 'Finance Savings':
      case 'Savings':              return <Savings />;
      case 'Finance Reports':      return <Reports />;
      case 'Productivity Tasks':
      case 'Tasks':                return <Tasks />;
      case 'Productivity Habits':
      case 'Habits':               return <Habits />;
      case 'Productivity Timetable':
      case 'Timetable':            return <Timetable />;
      case 'Productivity Goals':
      case 'Goals':                return <Goals />;
      case 'Productivity Projects':
      case 'Projects':             return <Projects />;
      case 'Productivity Reports': return <ProductivityReports />;
      case 'Settings':             return <Settings />;
      case 'Summary & Analytics':
      default:                     return <SummaryAnalytics onNavigate={setActiveTab} />;
    }
  };

  // Show spinner while authenticating
  if (loading || !user) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <p className="hero-subtitle">Authenticating Secure Connection...</p>
      </div>
    );
  }

  // Just return the content — layout shell handles Sidebar + TopNav
  return (
    <main className="main-content" id="mainContent">
      {renderContent()}
    </main>
  );
}
