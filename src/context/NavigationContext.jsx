"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  const [activeTab, setActiveTab] = useState('Summary & Analytics');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop collapse

  useEffect(() => {
    const savedCollapsed = localStorage.getItem('apexhub-sidebar-collapsed');
    if (savedCollapsed === 'true') {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const toggleSidebarCollapse = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem('apexhub-sidebar-collapsed', nextState);
  };

  const openMobileSidebar = () => setIsSidebarOpen(true);
  const closeMobileSidebar = () => setIsSidebarOpen(false);

  return (
    <NavigationContext.Provider value={{
      activeTab,
      setActiveTab,
      isSidebarOpen,
      openMobileSidebar,
      closeMobileSidebar,
      isSidebarCollapsed,
      toggleSidebarCollapse
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
