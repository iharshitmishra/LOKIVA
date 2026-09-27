import React, { useState, useEffect } from 'react';
import { ProviderSidebar } from './ProviderSidebar';
import { ProviderTopBar } from './ProviderTopBar';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';

// Views
import { DashboardOverviewView } from '../dashboard/DashboardOverviewView';
import { ExperiencesView } from '../experiences/ExperiencesView';
import { AddExperienceWizard } from '../experiences/AddExperienceWizard';
import { BookingsView } from '../bookings/BookingsView';
import { AvailabilityView } from '../availability/AvailabilityView';
import { ConciergeView } from '../concierge/ConciergeView';
import { ReviewsView } from '../reviews/ReviewsView';
import { EarningsView } from '../earnings/EarningsView';
import { CustomersView } from '../customers/CustomersView';
import { OffersView } from '../offers/OffersView';
import { AnalyticsView } from '../analytics/AnalyticsView';
import { BusinessProfileView } from '../profile/BusinessProfileView';
import { VerificationView } from '../profile/VerificationView';
import { NotificationsView } from '../notifications/NotificationsView';
import { SettingsView } from '../profile/SettingsView';
import { DigitalTwinPage } from '../../../pages/DigitalTwinPage';

export function ProviderWorkspaceLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { activeTab, initializeWorkspace, isLoading } = useProviderWorkspaceStore();

  useEffect(() => {
    initializeWorkspace();
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverviewView />;
      case 'concierge':
        return <ConciergeView />;
      case 'experiences':
        return <ExperiencesView />;
      case 'bookings':
        return <BookingsView />;
      case 'availability':
        return <AvailabilityView />;
      case 'customers':
        return <CustomersView />;
      case 'earnings':
        return <EarningsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'reviews':
        return <ReviewsView />;
      case 'offers':
        return <OffersView />;
      case 'profile':
        return <BusinessProfileView />;
      case 'verification':
        return <VerificationView />;
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return <SettingsView />;
      case 'digital-twin':
        return (
          <div className="-mt-4 sm:-mt-6">
            <DigitalTwinPage />
          </div>
        );
      default:
        return <DashboardOverviewView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#12213B] font-sans antialiased selection:bg-[#C85A32] selection:text-white">
      {/* Responsive Sidebar */}
      <ProviderSidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Workspace Frame */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Sticky Top Bar */}
        <ProviderTopBar onMobileMenuOpen={() => setIsMobileOpen(true)} />

        {/* Dynamic Viewport Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Add/Edit Experience Wizard Modal */}
      <AddExperienceWizard />
    </div>
  );
}

export default ProviderWorkspaceLayout;
