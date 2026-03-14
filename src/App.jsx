import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import { pageview } from './utils/analytics';
import './App.css';

function AppContent() {
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    pageview(location.pathname + location.search);
  }, [location]);

  if (loading) return null;

  // Not logged in — show login page only
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Logged in — show the full site
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
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
