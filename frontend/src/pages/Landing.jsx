import { useNavigate } from 'react-router-dom';
import { Search, Brain, FileCheck, Briefcase, ArrowRight, Shield, Sparkles } from 'lucide-react';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: 'Smart Search',
      desc: 'Intelligent document search powered by advanced AI retrieval. Find relevant clauses, terms, and precedents instantly.',
      color: 'var(--primary)',
    },
    {
      icon: FileCheck,
      title: 'Contract Analyzer',
      desc: 'Automated AI contract analysis that identifies risks, key terms, and compliance issues in seconds.',
      color: 'var(--teal)',
    },
    {
      icon: Briefcase,
      title: 'Case Finder',
      desc: 'Discover relevant legal cases and precedents that strengthen your arguments and legal positions.',
      color: 'var(--amber)',
    },
  ];

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <Shield size={24} className="landing-brand-icon" />
            <span>LegalMind<span className="brand-ai">AI</span></span>
          </div>
          <div className="landing-nav-actions">
            <button className="outline-btn" onClick={() => navigate('/login')}>Login</button>
            <button className="gradient-btn" onClick={() => navigate('/register')}>Sign Up</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-orb hero-orb-1" />
        <div className="hero-bg-orb hero-orb-2" />
        <div className="hero-content animate-fade-in">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>Powered by Advanced AI</span>
          </div>
          <h1 className="hero-title">
            AI-Powered<br /><span className="gradient-text">Legal Research</span>
          </h1>
          <p className="hero-subtitle">
            Analyze contracts, assess risks, and get instant legal insights powered by cutting-edge artificial intelligence.
          </p>
          <div className="hero-search glass">
            <Search size={20} className="search-icon" />
            <input type="text" placeholder="Search legal documents..." className="search-input" readOnly />
            <button className="gradient-btn search-btn">Search</button>
          </div>
          <div className="hero-actions">
            <button className="gradient-btn hero-cta" onClick={() => navigate('/register')}>
              Get Started <ArrowRight size={18} />
            </button>
            <button className="outline-btn" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <h2 className="section-title">Everything You Need for Legal Intelligence</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card glass-card" key={i} style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="feature-icon-wrap" style={{ background: `${f.color}15`, color: f.color }}>
                <f.icon size={28} />
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <button className="feature-link" style={{ color: f.color }}>
                Learn more <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          {[
            { num: '10K+', label: 'Documents Analyzed' },
            { num: '99.2%', label: 'Accuracy Rate' },
            { num: '50+', label: 'Law Firms Trust Us' },
            { num: '<3s', label: 'Average Response Time' },
          ].map((s, i) => (
            <div className="stat-item" key={i}>
              <span className="stat-num">{s.num}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Shield size={20} />
            <span>LegalMind AI</span>
          </div>
          <p className="footer-text">© 2026 LegalMind AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
