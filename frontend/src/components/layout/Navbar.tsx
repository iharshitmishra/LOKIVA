import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LogOut, Menu, X, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

const PERSONAS = {
  traveler: { label: 'Traveler' },
  provider: { label: 'Provider' },
  admin: { label: 'Admin' },
} as const;

export function Navbar() {
  const { user, logout, demoLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 45);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/explore', label: 'Explore' },
    { to: '/destinations', label: 'Destinations' },
    { to: '/discovery-map', label: 'Discovery Map' },
    { to: '/ai-guide', label: 'AI Concierge' },
    { to: '/itinerary', label: 'Itinerary' },
    { to: '/saved', label: 'Saved' },
  ];

  const currentPersona = PERSONAS[(user?.role as keyof typeof PERSONAS) || 'traveler'];

  return (
    <header className="fixed top-2 sm:top-3 inset-x-0 z-50 pointer-events-none px-3 sm:px-6">
      {/* Floating capsule nav with silky smooth spring animation & ample space */}
      <motion.nav
        animate={{
          maxWidth: isScrolled ? 940 : 1060,
          paddingTop: isScrolled ? 6 : 9,
          paddingBottom: isScrolled ? 6 : 9,
          backgroundColor: isScrolled
            ? 'rgba(255, 255, 255, 0.97)'
            : 'rgba(255, 255, 255, 0.92)',
          borderColor: isScrolled ? '#D0D7CF' : '#CCD4CB',
          boxShadow: isScrolled
            ? '0 10px 25px -5px rgba(18, 33, 59, 0.08), 0 8px 10px -6px rgba(18, 33, 59, 0.04)'
            : '0 4px 12px -2px rgba(18, 33, 59, 0.07), 0 2px 6px -2px rgba(18, 33, 59, 0.04)',
        }}
        transition={{
          type: 'spring',
          stiffness: 85,
          damping: 20,
          mass: 0.8,
        }}
        className={`w-full mx-auto pointer-events-auto border backdrop-blur-md px-3 sm:px-5 lg:px-6 transition-[border-radius] duration-200 ${
          mobileMenuOpen ? 'rounded-2xl sm:rounded-3xl shadow-xl' : 'rounded-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Brand Logo & Wordmark */}
          <div className="flex items-center justify-start flex-shrink-0">
            <Link to="/" className="flex items-center gap-1.5 group">
              <motion.img
                src="/logo.png"
                alt="LOKIVA"
                animate={{ height: isScrolled ? 26 : 31 }}
                transition={{ type: 'spring', stiffness: 85, damping: 20 }}
                className="w-auto object-contain shrink-0 group-hover:scale-105 transition-transform -mr-0.5"
              />
              <motion.span
                animate={{ fontSize: isScrolled ? '19px' : '23px' }}
                transition={{ type: 'spring', stiffness: 85, damping: 20 }}
                className="font-bold font-display text-ink tracking-tight leading-none translate-y-[0.5px]"
              >
                LOKIVA
              </motion.span>
            </Link>
          </div>

          {/* Center: Routes placed with balanced, even distance */}
          <div className="hidden md:flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2.5 flex-shrink-0 mx-auto">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`relative px-2.5 py-1 text-xs lg:text-[13px] font-medium whitespace-nowrap transition-colors rounded-full ${
                  isActive(to)
                    ? 'text-ink font-bold'
                    : 'text-dusk hover:text-ink hover:bg-paper-200/40'
                }`}
              >
                {label}
                {isActive(to) && (
                  <motion.span
                    layoutId="activeNavIndicator"
                    className="absolute -bottom-0.5 left-2 right-2 h-0.5 bg-[#FFC067] rounded-full"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right: Actions (Authenticated State or Sign In) */}
          <div className="flex items-center justify-end gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2">
              {/* Host Portal Quick Link */}
              <Link
                to="/provider"
                className="px-2.5 py-1 text-xs font-heading font-semibold text-[#12213B] hover:text-[#C85A32] bg-[#FAF4ED] hover:bg-[#F5EADB] border border-[#E8DEC8] rounded-full transition flex items-center gap-1.5 shadow-2xs"
                title="Switch to Host / Provider Workspace"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C85A32] animate-pulse" />
                <span>Host Portal</span>
              </Link>

              {/* User profile or login */}
              {user ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <Link
                    to="/profile"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-paper-100 hover:bg-paper-200 border border-paper-300 hover:border-[#FFC067]/50 text-ink font-semibold text-xs transition group"
                    title="View Profile & Settings"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#C85A32] text-white flex items-center justify-center text-[10px] font-bold shadow-2xs overflow-hidden">
                      {user.avatar || user.avatar_url ? (
                        <img src={user.avatar || user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <span className="max-w-[95px] truncate text-[11px] group-hover:text-[#C85A32] transition-colors font-heading">
                      {user.full_name?.split(' ')[0]}
                    </span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="p-1 text-dusk hover:text-[#C85A32] hover:bg-paper-100 rounded-full transition"
                    title="Sign out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-3.5 py-1 bg-[#B84A27] hover:bg-[#9E3C1D] text-[#FFFDF9] rounded-full text-xs font-heading font-bold transition shadow-sm shadow-[#B84A27]/20 whitespace-nowrap"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-ink hover:bg-paper-200 rounded-full transition"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pt-3 pb-3 border-t border-paper-300 mt-2 space-y-1.5 text-xs max-h-[78vh] overflow-y-auto"
            >
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive(to)
                      ? 'bg-paper-200 text-ink font-bold border border-paper-300'
                      : 'text-dusk hover:text-ink hover:bg-paper-100'
                  }`}
                >
                  {label}
                </Link>
              ))}

              {/* Host Portal Link in Mobile */}
              <Link
                to="/provider"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#FAF4ED] text-[#12213B] border border-[#E8DEC8]"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse" />
                  <span className="font-heading font-bold">Host / Provider Portal</span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase bg-white text-[#C85A32] px-2 py-0.5 rounded border border-[#E8DEC8]">
                  Open Workspace
                </span>
              </Link>

              {/* User Account / Sign In */}
              <div className="pt-2 border-t border-paper-300 flex items-center justify-between px-1">
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs font-semibold text-ink flex items-center gap-1.5 hover:text-[#C85A32] transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#C85A32] text-white flex items-center justify-center text-[10px] font-bold">
                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="truncate max-w-[140px] font-heading">{user.full_name || 'Profile'}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="px-3 py-1 bg-paper-100 rounded-full text-xs text-[#C85A32] font-medium border border-paper-300"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 bg-[#B84A27] hover:bg-[#9E3C1D] text-[#FFFDF9] rounded-xl text-center text-xs font-heading font-bold block shadow-sm shadow-[#B84A27]/20"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  );
}