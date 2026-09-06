"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNavigation } from "@/context/NavigationContext";
import SummaryAnalytics from "@/components/Dashboard/SummaryAnalytics";

export default function Dashboard() {
  const router = useRouter();
  const { setActiveTab } = useNavigation() || {};

  useEffect(() => {
    if (setActiveTab) setActiveTab('Summary & Analytics');
    router.replace('/');
  }, [router, setActiveTab]);

  return (
    <main className="main-content" id="mainContent">
      <SummaryAnalytics onNavigate={setActiveTab} />
    </main>
  );
}
