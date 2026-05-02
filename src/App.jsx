import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import UnicornsUnite from './pages/UnicornsUnite';
import Creator from './pages/Creator';
import TomatoHunter from './pages/TomatoHunter';
import SpacePups from './pages/SpacePups';
import Podcasts from './pages/Podcasts';
import AIRPStudio from './pages/AIRPStudio';
import JumpingPenguin from './pages/JumpingPenguin';
import PenguinRunner from './pages/PenguinRunner';
import PresentMaker from './pages/PresentMaker';
import Homey from './pages/Homey';
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import Buddies from './pages/Buddies';
import Feedback from './pages/Feedback';
import ParentalConsent from './pages/ParentalConsent';
import PrivacyPolicy from './pages/PrivacyPolicy';
import './App.css';

function AppContent() {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/unicorns-unite" element={<UnicornsUnite />} />
          <Route path="/creator" element={<Creator />} />
          <Route path="/space-pups" element={<SpacePups />} />
          <Route path="/tomato-hunter" element={<TomatoHunter />} />
          <Route path="/podcasts" element={<Podcasts />} />
          <Route path="/ai-rp-studio" element={<AIRPStudio />} />
          <Route path="/jumping-penguin" element={<JumpingPenguin />} />
          <Route path="/penguin-runner" element={<PenguinRunner />} />
          <Route path="/present-maker" element={<PresentMaker />} />
          <Route path="/homey" element={<Homey />} />
          <Route path="/buddies" element={<Buddies />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/consent/:token" element={<ParentalConsent />} />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('splashSeen'));
  const handleSplashDone = useCallback(() => {
    sessionStorage.setItem('splashSeen', '1');
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
