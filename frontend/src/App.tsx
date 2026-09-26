import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import { initializeTTS } from './lib/tts';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { DestinationsPage } from './pages/DestinationsPage';
import { StateOverviewPage } from './pages/StateOverviewPage';
import { DestinationDetailPage } from './pages/DestinationDetailPage';
import { ExperienceDetailPage } from './pages/ExperienceDetailPage';
import { AiGuidePage } from './pages/AiGuidePage';
import { ItineraryPage } from './pages/ItineraryPage';
import { SavedPage } from './pages/SavedPage';
import { ProfilePage } from './pages/ProfilePage';
import { DiscoveryMapPage } from './pages/DiscoveryMapPage';
import { LocationDecisionModal, useOnboardingGate } from './components/onboarding/LocationDecisionModal';
import { LoginPage } from './pages/LoginPage';
import { TravelerLoginPage } from './pages/TravelerLoginPage';
import { ProviderLoginPage } from './pages/ProviderLoginPage';
import { TravelerRegisterPage } from './pages/TravelerRegisterPage';
import { ProviderRegisterPage } from './pages/ProviderRegisterPage';
import { ProviderAuthPage } from './pages/ProviderAuthPage';
import { GroupTripHubPage } from './pages/GroupTripHubPage';
import { RequireAuth } from './components/auth/RequireAuth';
import { NotFoundPage } from './pages/NotFoundPage';
import { VerifyPassPage } from './pages/VerifyPassPage';
import { CulturalPassportReceiptModal } from './components/pass/CulturalPassportReceiptModal';

function AppShell() {
  const location = useLocation();
  const { showModal, closeModal } = useOnboardingGate();
  const isFullBleedPage =
    location.pathname === '/' ||
    location.pathname === '/destinations' ||
    location.pathname.startsWith('/destinations/');

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-paper text-ink font-sans selection:bg-marigold selection:text-ink">
      <Navbar />
      <main className={`flex-1 ${isFullBleedPage ? 'pt-0' : 'pt-16 sm:pt-20'}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/destinations/:stateSlug" element={<StateOverviewPage />} />
          <Route path="/destination/:state" element={<DestinationDetailPage />} />
          <Route path="/destination/:state/:city" element={<DestinationDetailPage />} />
          <Route path="/experience/:id" element={<ExperienceDetailPage />} />
          <Route path="/ai-guide" element={<AiGuidePage />} />
          <Route path="/itinerary" element={<ItineraryPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/discovery-map" element={<DiscoveryMapPage />} />
          <Route path="/verify-pass/:passId" element={<VerifyPassPage />} />

          {/* Lokiva Group Hub Routes - Protected by RequireAuth */}
          <Route
            path="/group/new"
            element={
              <RequireAuth>
                <GroupTripHubPage mode="create" />
              </RequireAuth>
            }
          />
          <Route
            path="/group/:groupId"
            element={
              <RequireAuth>
                <GroupTripHubPage mode="room" />
              </RequireAuth>
            }
          />

          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/traveler" element={<TravelerLoginPage />} />
          <Route path="/login/provider" element={<ProviderLoginPage />} />
          <Route path="/register/traveler" element={<TravelerRegisterPage />} />
          <Route path="/register/provider" element={<ProviderRegisterPage />} />
          <Route path="/provider/auth" element={<ProviderAuthPage />} />
          <Route path="/provider/login" element={<ProviderLoginPage />} />
          <Route path="/provider/register" element={<ProviderRegisterPage />} />

          {/* Provider routes redirect to explore */}
          <Route path="/provider" element={<Navigate to="/explore" replace />} />
          <Route path="/provider/dashboard" element={<Navigate to="/explore" replace />} />
          <Route path="/provider/*" element={<Navigate to="/explore" replace />} />

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />

      {/* First-visit onboarding modal */}
      <LocationDecisionModal isOpen={showModal} onClose={closeModal} />

      {/* Global Cultural Passport Receipt & QR Modal */}
      <CulturalPassportReceiptModal />
    </div>
  );
}

export function App() {
  useEffect(() => {
    initializeTTS();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
