import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from './lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Leaf, Map as MapIcon, PlusCircle, BarChart3, LogIn, LogOut, Menu, X, Ghost } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import Report from './pages/Report';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// Components
import ChatAssistant from './components/ChatAssistant';

// Types
import { UserProfile } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserOfProfile(userDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'Anonymous',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || undefined,
            role: 'user',
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', currentUser.uid), {
            ...newProfile,
            createdAt: serverTimestamp(),
          });
          setUserOfProfile(newProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setUserOfProfile = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
      const authCode = (error as { code?: string })?.code || '';

      // Fallback for browsers/environments that block popup windows.
      if (authCode === 'auth/popup-blocked' || authCode === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          console.error('Redirect login error:', redirectError);
        }
      }

      if (authCode === 'auth/unauthorized-domain') {
        alert('This domain is not authorized in Firebase Auth. Add localhost in Firebase Console -> Authentication -> Settings -> Authorized domains.');
        return;
      }

      alert('Sign in failed. Please allow popups and try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Leaf className="w-12 h-12 text-emerald-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-700">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-700 transition-colors">
                  <Leaf className="text-white w-6 h-6" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">ReviveEarth <span className="text-emerald-600">AI</span></span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-8">
                <NavLink to="/explore" icon={<MapIcon className="w-4 h-4" />} label="Explore Graveyard" />
                <NavLink to="/report" icon={<PlusCircle className="w-4 h-4" />} label="Report Failed Project" />
                <NavLink to="/dashboard" icon={<BarChart3 className="w-4 h-4" />} label="Impact Dashboard" />
                
                {user ? (
                  <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                    <Link to="/profile" className="flex flex-col items-end group">
                      <span className="text-sm font-medium text-slate-900 group-hover:text-emerald-600 transition-colors">{user.displayName}</span>
                      <button onClick={(e) => { e.preventDefault(); handleLogout(); }} className="text-xs text-slate-500 hover:text-emerald-600 transition-colors">Sign Out</button>
                    </Link>
                    <Link to="/profile">
                      <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-slate-200 hover:border-emerald-600 transition-all" referrerPolicy="no-referrer" />
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-medium text-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
              >
                <div className="px-4 py-4 space-y-4">
                  <MobileNavLink to="/explore" label="Explore Graveyard" onClick={() => setIsMenuOpen(false)} />
                  <MobileNavLink to="/report" label="Report Project" onClick={() => setIsMenuOpen(false)} />
                  <MobileNavLink to="/dashboard" label="Impact Dashboard" onClick={() => setIsMenuOpen(false)} />
                  {user && <MobileNavLink to="/profile" label="My Profile" onClick={() => setIsMenuOpen(false)} />}
                  {user ? (
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-slate-600 font-medium">Sign Out</button>
                  ) : (
                    <button onClick={handleLogin} className="w-full text-left px-4 py-2 text-emerald-600 font-bold">Sign In</button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/report" element={<Report user={user} />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile user={user} profile={userProfile} />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="bg-slate-50 border-t border-slate-100 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Leaf className="text-emerald-600 w-5 h-5" />
              <span className="text-lg font-bold text-slate-900">ReviveEarth AI</span>
            </div>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Recovering the lost ROI of environmental activism through AI-driven failure analysis and community resuscitation.
            </p>
            <div className="mt-8 pt-8 border-t border-slate-200 text-xs text-slate-400">
              © 2026 ReviveEarth AI. Built for Track 3: Design & Visualization.
            </div>
          </div>
        </footer>

        <ChatAssistant />
      </div>
  );
}

function NavLink({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 text-sm font-medium transition-colors",
        isActive ? "text-emerald-600" : "text-slate-600 hover:text-emerald-600"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileNavLink({ to, label, onClick }: { to: string, label: string, onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
    >
      {label}
    </Link>
  );
}
