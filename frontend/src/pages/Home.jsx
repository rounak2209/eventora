import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Shield, Zap, ArrowRight, CheckCircle } from 'lucide-react';

const Home = () => {
  return (
    <div className="bg-white text-gray-900 font-sans">
      
      {/* 🚀 HERO SECTION (Pehla Impression) */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest text-blue-600 uppercase bg-blue-100 rounded-full">
              Ultimate Event Management ⚡
            </span>
            <h1 className="text-6xl md:text-7xl font-black tracking-tight text-gray-900 mb-8 leading-tight">
              Manage Events Like a <span className="text-blue-600">Pro</span> with Eventora.
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Team formation, real-time QR scanning, aur automated certificates—sab kuch ek hi jagah. 
              Apne campus events ko digitally manage karein bina kisi jhanjhat ke.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group">
                Get Started Free <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all">
                Login to Dashboard
              </Link>
            </div>
          </div>
        </div>
        
        {/* Background Decorative Circles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-200 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* 🛠️ FEATURES SECTION (Hum kya dete hain?) */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* Feature 1 */}
            <div className="group p-8 rounded-3xl border border-gray-100 hover:border-blue-500 hover:shadow-2xl transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Squad Finder</h3>
              <p className="text-gray-500 leading-relaxed">
                Akele hain? Tension nahi. Skill-based teammate search se apni dream team banayein seconds mein.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-3xl border border-gray-100 hover:border-green-500 hover:shadow-2xl transition-all duration-300">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Zap size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Fastest Check-in</h3>
              <p className="text-gray-500 leading-relaxed">
                No more long queues. Hamare smart QR scanning system se gate entry hoti hai ekdum lightning fast.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-3xl border border-gray-100 hover:border-purple-500 hover:shadow-2xl transition-all duration-300">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Shield size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Verified Certificates</h3>
              <p className="text-gray-500 leading-relaxed">
                Event khatam hote hi digital certificates seedha email par. Fully verified aur blockchain-ready IDs ke saath.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 📊 TRUST STATS (Social Proof) */}
      <section className="py-16 bg-gray-900 text-white rounded-[3rem] mx-6 mb-24 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-10 relative z-10 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div>
            <h2 className="text-4xl font-bold mb-2">Trusted by Campus Leaders.</h2>
            <p className="text-gray-400">Join thousands of students and organizers today.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-16">
            <div>
              <p className="text-4xl font-black text-blue-400">50+</p>
              <p className="text-sm uppercase tracking-widest font-bold text-gray-500">Events Hosted</p>
            </div>
            <div>
              <p className="text-4xl font-black text-green-400">2K+</p>
              <p className="text-sm uppercase tracking-widest font-bold text-gray-500">Participants</p>
            </div>
            <div className="hidden sm:block">
              <p className="text-4xl font-black text-purple-400">100%</p>
              <p className="text-sm uppercase tracking-widest font-bold text-gray-500">Secure Scan</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🏁 FOOTER LITE */}
      <footer className="py-12 border-t border-gray-100 text-center">
        <p className="text-gray-400 text-sm font-medium">
          © 2026 Eventora Inc. Built with ❤️ for Students.
        </p>
      </footer>
    </div>
  );
};

export default Home;