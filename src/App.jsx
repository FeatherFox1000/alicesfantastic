import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import UnicornsUnite from './pages/UnicornsUnite';
import Creator from './pages/Creator';
import TomatoHunter from './pages/TomatoHunter';
import SpacePups from './pages/SpacePups';
import Podcasts from './pages/Podcasts';
import { pageview } from './utils/analytics';
import './App.css';

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    pageview(location.pathname + location.search);
  }, [location]);

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
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
