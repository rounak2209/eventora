import { Link } from "react-router-dom";
import { Rocket, Users, Zap, CheckCircle } from "lucide-react";

const Home = () => {
  return (
    <div className="bg-white text-gray-900 overflow-hidden">
      {/* --- Hero Section --- */}
      <section className="relative pt-20 pb-32 px-6">
        {/* Background Gradient Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-bounce">
            <Zap size={16} /> Now Live: Final Year Project Finder
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight">
            Stop Searching, <br /> 
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Start Collaborating.</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            The ultimate platform for students to find the perfect project partners. 
            Connect with skilled peers across all departments in seconds.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/finder" className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all hover:scale-105 shadow-xl shadow-blue-200 flex items-center justify-center gap-2">
              <Rocket size={20} /> Find Your Team
            </Link>
            <Link to="/register" className="bg-white text-gray-800 border-2 border-gray-200 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
              Join the Community
            </Link>
          </div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section className="bg-gray-50 py-24 px-6 border-y border-gray-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <FeatureCard 
            icon={<Users className="text-blue-600" size={32} />}
            title="Smart Matching"
            desc="Our algorithm finds students with skills that complement yours perfectly."
          />
          <FeatureCard 
            icon={<CheckCircle className="text-indigo-600" size={32} />}
            title="Verified Students"
            desc="Only students with valid college emails can join the project hunt."
          />
          <FeatureCard 
            icon={<Zap className="text-amber-500" size={32} />}
            title="Instant Connect"
            desc="Send requests and get notified instantly when someone wants to join."
          />
        </div>
      </section>
    </div>
  );
};

// Helper Component for Features
const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all group">
    <div className="mb-6 group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-600">{desc}</p>
  </div>
);

export default Home;