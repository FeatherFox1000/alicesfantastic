import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import UnicornsUnite from './pages/UnicornsUnite';
import Creator from './pages/Creator';
import TomatoHunter from './pages/TomatoHunter';
import SpacePups from './pages/SpacePups';
import Podcasts from './pages/Podcasts';
import './App.css';

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
