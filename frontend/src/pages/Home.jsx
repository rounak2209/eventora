import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Shield, Zap, ArrowRight, CheckCircle, Layout, Github, Twitter, Linkedin } from 'lucide-react';

const Home = () => {
  return (

    <div className="relative w-full max-w-[100vw] min-h-screen bg-transparent text-gray-100 font-sans selection:bg-orange-500/30 overflow-x-hidden">
      
      {/* 🚀 HERO SECTION (Glassy & Immersive) */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 md:pt-40 md:pb-32 px-4 sm:px-6 bg-gradient-to-b from-black/60 via-black/40 to-transparent">
        
        {/* 🔮 RESPONSIVE BACKGROUND GLOWS */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-orange-600/15 rounded-full blur-[80px] md:blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-indigo-600/10 rounded-full blur-[80px] md:blur-[120px]"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          
          <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 mb-6 md:mb-8 text-[10px] md:text-xs font-black tracking-widest text-orange-400 uppercase bg-orange-500/10 border border-orange-500/30 rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] backdrop-blur-md">
            <Zap size={14} className="text-orange-400" /> Ultimate Event Management
          </div>
          
          {/* 🔥 RESPONSIVE TYPOGRAPHY: Scales down perfectly on mobile */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-white mb-6 md:mb-8 leading-tight drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] px-2">
            Manage Events Like a <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 drop-shadow-none">Pro</span> with Eventora.
          </h1>
          

          <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-10 md:mb-12 leading-relaxed max-w-3xl mx-auto font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-4">
            Team formation, real-time QR scanning, and automated certificates—all in one place. 
            Elevate your campus events digitally without the hassle.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-5 px-4">
            <Link to="/register" className="w-full sm:w-auto px-6 py-3.5 md:px-8 md:py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] md:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 md:gap-3 group active:scale-95 border border-orange-400/50">
              Get Started Free <ArrowRight size={18} className="md:w-5 md:h-5 group-hover:translate-x-1.5 transition-transform" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-6 py-3.5 md:px-8 md:py-4 bg-white/5 text-white font-bold rounded-2xl border border-white/20 hover:bg-white/10 transition-all flex items-center justify-center gap-2 md:gap-3 backdrop-blur-xl shadow-lg active:scale-95">
              <Layout size={18} className="md:w-5 md:h-5" /> Login to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION (Responsive Grid & Padding) */}
      <section className="py-12 md:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            
            <div className="bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 border-t-white/20 hover:bg-white/10 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] group">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-white/5 border border-white/10 text-gray-300 rounded-xl md:rounded-2xl flex items-center justify-center mb-5 md:mb-6 shadow-inner group-hover:scale-110 group-hover:text-orange-400 group-hover:border-orange-500/30 group-hover:bg-orange-500/10 transition-all duration-300">
                <Users size={24} className="md:w-7 md:h-7" />
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-3 text-white drop-shadow-md">Squad Finder</h3>
              <p className="text-gray-300 leading-relaxed text-xs md:text-sm font-medium">
                Flying solo? No stress. Build your ultimate dream team in seconds using our skill-based matchmaking.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 border-t-white/20 hover:bg-white/10 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] group">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-white/5 border border-white/10 text-gray-300 rounded-xl md:rounded-2xl flex items-center justify-center mb-5 md:mb-6 shadow-inner group-hover:scale-110 group-hover:text-orange-400 group-hover:border-orange-500/30 group-hover:bg-orange-500/10 transition-all duration-300">
                <Zap size={24} className="md:w-7 md:h-7" />
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-3 text-white drop-shadow-md">Fastest Check-in</h3>
              <p className="text-gray-300 leading-relaxed text-xs md:text-sm font-medium">
                Kill the queues. Our lightning-fast smart QR scanning system ensures seamless gate entries.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 border-t-white/20 hover:bg-white/10 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] group sm:col-span-2 md:col-span-1">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-white/5 border border-white/10 text-gray-300 rounded-xl md:rounded-2xl flex items-center justify-center mb-5 md:mb-6 shadow-inner group-hover:scale-110 group-hover:text-orange-400 group-hover:border-orange-500/30 group-hover:bg-orange-500/10 transition-all duration-300">
                <Shield size={24} className="md:w-7 md:h-7" />
              </div>
              <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-3 text-white drop-shadow-md">Verified Certificates</h3>
              <p className="text-gray-300 leading-relaxed text-xs md:text-sm font-medium">
                Instant digital certificates emailed post-event. Fully verifiable and blockchain-ready IDs included.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* TRUST STATS (Responsive Flex & Grid) */}
      <section className="py-10 md:py-12 mb-20 md:mb-32 relative z-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-black/60 backdrop-blur-3xl saturate-150 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-14 flex flex-col md:flex-row justify-between items-center gap-10 md:gap-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="text-center md:text-left w-full md:w-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 md:mb-3 text-white drop-shadow-md">Trusted by Leaders.</h2>
              <p className="text-sm md:text-base text-gray-300 font-medium">Join thousands of students and organizers.</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-16 w-full md:w-auto">
              <div className="text-center">
                <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">50+</p>
                <p className="text-[9px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-black text-orange-400 mt-1 md:mt-2">Events Hosted</p>
              </div>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">2K+</p>
                <p className="text-[9px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-black text-orange-400 mt-1 md:mt-2">Participants</p>
              </div>
              <div className="col-span-2 sm:col-span-1 text-center mt-2 sm:mt-0">
                <p className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">100%</p>
                <p className="text-[9px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-black text-orange-400 mt-1 md:mt-2">Secure Scan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER (Mobile Optimized Stack) */}
      <footer className="border-t border-white/10 bg-black/60 backdrop-blur-2xl pt-12 md:pt-16 pb-6 md:pb-8 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-10 md:mb-12">
            
            <div className="md:col-span-2 text-center sm:text-left flex flex-col items-center sm:items-start">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="bg-orange-500/10 border border-orange-500/30 p-2 rounded-xl">
                  <Layout size={18} className="text-orange-400 md:w-5 md:h-5" />
                </div>
                <span className="text-xl md:text-2xl font-black text-white tracking-tighter drop-shadow-md">
                  EVENTORA<span className="text-orange-400">.</span>
                </span>
              </Link>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-sm font-medium">
                The ultimate platform for modern campuses. Streamline registrations, team building, and event execution effortlessly.
              </p>
            </div>

            <div className="text-center sm:text-left">
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs md:text-sm">Platform</h4>
              <ul className="space-y-2 md:space-y-3">
                <li><Link to="/register" className="text-gray-400 hover:text-orange-400 text-xs md:text-sm font-medium transition-colors">Get Started</Link></li>
                <li><Link to="/login" className="text-gray-400 hover:text-orange-400 text-xs md:text-sm font-medium transition-colors">Sign In</Link></li>
                <li><span className="text-gray-600 text-xs md:text-sm font-medium cursor-not-allowed">Organizer Dashboard</span></li>
              </ul>
            </div>

            <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
              <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs md:text-sm">Connect</h4>
              <div className="flex gap-3 md:gap-4">
                <a href="#" className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/10 shadow-sm">
                  <Twitter size={16} className="md:w-[18px] md:h-[18px]" />
                </a>
                <a href="#" className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/10 shadow-sm">
                  <Github size={16} className="md:w-[18px] md:h-[18px]" />
                </a>
                <a href="#" className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/10 shadow-sm">
                  <Linkedin size={16} className="md:w-[18px] md:h-[18px]" />
                </a>
              </div>
            </div>

          </div>

          <div className="border-t border-white/10 pt-6 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest text-center md:text-left">
              © 2026 Eventora Inc. All rights reserved.
            </p>
            <div className="flex gap-4 md:gap-6 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">
              <span className="hover:text-orange-400 cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-orange-400 cursor-pointer transition-colors">Terms</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;