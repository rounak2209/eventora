import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGatekeeperEvents } from '../api'; // 👈 Centralized API Import
import { LogOut, MapPin, Calendar, QrCode, Users, CheckCircle } from 'lucide-react';

const GatekeeperDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Events + Stats Fetch Karo
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // 🔥 Endpoint Call kar rahe hain (via api.js)
        const res = await getGatekeeperEvents();
        setEvents(res.data); // Backend already sorted bhej raha hai
        setLoading(false);
      } catch (err) {
        console.error("Error loading duties:", err);
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Logout
  const handleLogout = () => {
    if(window.confirm("Logout from duty?")) {
        localStorage.clear();
        navigate('/login');
    }
  };

  // Start Scanning Handler
  const startScanning = (event) => {
    navigate('/scan', { state: { eventName: event.title, eventId: event._id } });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-bold text-xl">Loading Duties... ⏳</div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      
      {/* Header */}
      <div className="bg-gray-900 text-white p-6 shadow-lg flex justify-between items-center sticky top-0 z-20">
        <div>
            <h1 className="text-2xl font-bold tracking-wide flex items-center gap-2">
                👮 Security Panel
            </h1>
            <p className="text-gray-400 text-sm">Real-time Entry Tracking</p>
        </div>
        <button onClick={handleLogout} className="bg-red-600 p-2 rounded-full hover:bg-red-700 transition shadow-lg">
            <LogOut size={20} />
        </button>
      </div>

      {/* Events List */}
      <div className="p-4 max-w-3xl mx-auto grid gap-6 mt-4">
        {events.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">No upcoming events assigned.</div>
        ) : (
            events.map((event) => {
                const eventDate = new Date(event.date);
                const isToday = eventDate.toDateString() === new Date().toDateString();
                
                // Stats Variables
                const total = event.stats?.total || 0;
                const present = event.stats?.present || 0;
                const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                return (
                    <div key={event._id} className={`bg-white rounded-xl shadow-md overflow-hidden border-l-8 transition-transform hover:scale-[1.02] ${isToday ? 'border-green-500' : 'border-indigo-500'}`}>
                        <div className="p-6">
                            
                            {/* Top Row: Status & Title */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    {isToday && <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded uppercase mb-2 inline-block animate-pulse">Live Now</span>}
                                    <h2 className="text-2xl font-bold text-gray-800 leading-tight">{event.title}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 font-semibold">Entry Status</p>
                                    <p className="text-2xl font-bold text-indigo-600">{percentage}%</p>
                                </div>
                            </div>
                            
                            {/* 🔥 PROGRESS BAR */}
                            <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden border border-gray-300">
                                <div 
                                    className={`h-4 rounded-full transition-all duration-1000 ${percentage >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`} 
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="text-center border-r border-gray-300">
                                    <p className="text-gray-500 text-sm flex items-center justify-center gap-1"><Users size={14}/> Total Expected</p>
                                    <p className="text-xl font-bold text-gray-800">{total}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-500 text-sm flex items-center justify-center gap-1"><CheckCircle size={14}/> Scanned In</p>
                                    <p className="text-xl font-bold text-green-600">{present}</p>
                                </div>
                            </div>
                            
                            {/* Details */}
                            <div className="space-y-2 text-gray-600 mb-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-indigo-600" />
                                    <span>{eventDate.toLocaleDateString()} | {eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-red-500" />
                                    <span>{event.venue}</span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button 
                                onClick={() => startScanning(event)}
                                className="w-full bg-gray-900 text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 hover:bg-black transition active:scale-95 shadow-lg"
                            >
                                <QrCode size={24} />
                                START SCANNING
                            </button>
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};

export default GatekeeperDashboard;