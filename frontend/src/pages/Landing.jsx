import { useNavigate } from 'react-router-dom';
import { Search, Brain, FileCheck, Briefcase, ArrowRight, Shield, Sparkles, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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

  const quickSearches = [
    'Force majeure clause',
    'Termination rights',
    'Data privacy obligations',
    'Indemnification limits',
  ];

  const faqs = [
    {
      q: 'How quickly can LegalMind AI analyze a contract?',
      a: 'Most standard contracts are processed in seconds. Larger agreements may take a bit longer depending on document length and complexity.',
    },
    {
      q: 'Can I use this for case-law research too?',
      a: 'Yes. The platform helps surface relevant precedents and legal signals so you can move from document review to legal strategy faster.',
    },
    {
      q: 'Is my document data secure?',
      a: 'LegalMind AI is built with security-first architecture and controlled access patterns to protect sensitive legal content.',
    },
  ];

  const filteredSearches = quickSearches.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  const selectedFeature = features[activeFeature];

  const handleSearch = () => {
    if (!query.trim()) return;
    navigate('/register');
  };

  const toggleMenu = (menu) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const handleMenuNavigate = (path) => {
    setOpenMenu(null);
    navigate(path);
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <Shield size={24} className="landing-brand-icon" />
            <span>LegalMind<span className="brand-ai">AI</span></span>
          </div>
          <div className="landing-nav-actions" ref={menuRef}>
            <div className="menu-group">
              <button className="outline-btn menu-trigger" onClick={() => toggleMenu('login')}>
                Login <ChevronDown size={15} />
              </button>
              {openMenu === 'login' && (
                <div className="menu-dropdown glass">
                  <button className="menu-item" onClick={() => handleMenuNavigate('/login')}>Login as User</button>
                  <button className="menu-item" onClick={() => handleMenuNavigate('/lawyer/login')}>Login as Lawyer</button>
                </div>
              )}
            </div>

            <div className="menu-group">
              <button className="gradient-btn menu-trigger" onClick={() => toggleMenu('signup')}>
                Sign Up <ChevronDown size={15} />
              </button>
              {openMenu === 'signup' && (
                <div className="menu-dropdown glass">
                  <button className="menu-item" onClick={() => handleMenuNavigate('/register')}>Sign Up as User</button>
                  <button className="menu-item" onClick={() => handleMenuNavigate('/lawyer/register')}>Sign Up as Lawyer</button>
                </div>
              )}
            </div>
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
            <input
              type="text"
              placeholder="Search legal documents..."
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
            <button className="gradient-btn search-btn" onClick={handleSearch}>Search</button>
          </div>
          <div className="search-suggestions">
            {filteredSearches.slice(0, 4).map((item) => (
              <button
                key={item}
                className="suggestion-chip"
                onClick={() => setQuery(item)}
              >
                {item}
              </button>
            ))}
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
            <button
              type="button"
              className={`feature-card glass-card ${activeFeature === i ? 'feature-card-active' : ''}`}
              key={i}
              style={{ animationDelay: `${i * 0.15}s` }}
              onClick={() => setActiveFeature(i)}
            >
              <div className="feature-icon-wrap" style={{ background: `${f.color}15`, color: f.color }}>
                <f.icon size={28} />
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <span className="feature-link" style={{ color: f.color }}>
                Learn more <ArrowRight size={16} />
              </span>
            </button>
          ))}
        </div>
        <div className="feature-focus glass-card">
          <div className="feature-focus-head">
            <span className="feature-focus-tag" style={{ color: selectedFeature.color }}>
              Active Module
            </span>
            <h3>{selectedFeature.title}</h3>
          </div>
          <p>{selectedFeature.desc}</p>
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

      <section className="faq-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map((item, i) => (
            <div className={`faq-item ${openFaq === i ? 'faq-open' : ''}`} key={item.q}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
              >
                <span>{item.q}</span>
                <span className="faq-indicator">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && <p className="faq-answer">{item.a}</p>}
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
