"use client";

import { useNavigation } from "@/context/NavigationContext";
import { useAuth } from "@/context/AuthContext";

import dynamic from 'next/dynamic';

const Loader = () => (
  <div className="module-container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <div style={{ color: 'var(--text-muted)' }}>Loading Module...</div>
  </div>
);

// Core components
const SummaryAnalytics = dynamic(() => import("@/components/Dashboard/SummaryAnalytics"), { loading: () => <Loader /> });
const Settings = dynamic(() => import("@/components/Dashboard/Settings"), { loading: () => <Loader /> });

// Finance components
const CashIn = dynamic(() => import("@/components/Finance/CashIn"), { loading: () => <Loader /> });
const Expenses = dynamic(() => import("@/components/Finance/Expenses"), { loading: () => <Loader /> });
const Budget = dynamic(() => import("@/components/Finance/Budget"), { loading: () => <Loader /> });
const Savings = dynamic(() => import("@/components/Finance/Savings"), { loading: () => <Loader /> });
const Reports = dynamic(() => import("@/components/Finance/Reports"), { loading: () => <Loader /> });

// Productivity components
const Planner = dynamic(() => import("@/components/Planner/Planner"), { loading: () => <Loader /> });
const Journal = dynamic(() => import("@/components/Journal/Journal"), { loading: () => <Loader /> });
const Tasks = dynamic(() => import("@/components/Productivity/Tasks"), { loading: () => <Loader /> });
const Habits = dynamic(() => import("@/components/Productivity/Habits"), { loading: () => <Loader /> });
const Timetable = dynamic(() => import("@/components/Productivity/Timetable"), { loading: () => <Loader /> });
const Goals = dynamic(() => import("@/components/Productivity/Goals"), { loading: () => <Loader /> });
const Projects = dynamic(() => import("@/components/Productivity/Projects"), { loading: () => <Loader /> });
const ProductivityReports = dynamic(() => import("@/components/Productivity/ProductivityReports"), { loading: () => <Loader /> });

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
      case 'Productivity Planner':
      case 'Planner':              return <Planner />;
      case 'Productivity Journal':
      case 'Journal':              return <Journal />;
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
