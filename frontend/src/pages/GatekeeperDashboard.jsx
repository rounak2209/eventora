import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGatekeeperEvents } from '../api'; 
import { MapPin, Calendar, QrCode, Users, CheckCircle, LayoutGrid } from 'lucide-react';

const GatekeeperDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await getGatekeeperEvents();
        setEvents(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error loading duties:", err);
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const startScanning = (event) => {
    navigate('/scan', { state: { eventName: event.title, eventId: event._id } });
  };

  if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-transparent backdrop-blur-md">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin shadow-[0_0_20px_rgba(245,158,11,0.3)]"></div>
                <p className="font-black text-orange-400 text-[10px] uppercase tracking-[0.2em] animate-pulse">Initializing Duty Hub...</p>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-transparent pb-20 text-gray-100 font-sans selection:bg-orange-500/30 overflow-x-hidden">
      
      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-6 md:p-10 pt-8">
        
        {events.length === 0 ? (
            <div className="text-center py-32 bg-white/5 backdrop-blur-2xl border border-dashed border-white/20 rounded-[3rem]">
                <LayoutGrid size={40} className="mx-auto text-gray-500 mb-4 opacity-50"/>
                <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No Events Assigned To You</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                {events.map((event) => {
                    const eventDate = new Date(event.date);
                    const isToday = eventDate.toDateString() === new Date().toDateString();
                    const total = event.stats?.total || 0;
                    const present = event.stats?.present || 0;
                    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                    return (
                        <div key={event._id} className="relative group h-full">
                            
                            {/* 🔥 Crystal Clear Glass Cards */}
                            <div className="relative h-full flex flex-col bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 border-t-white/20 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-white/10 hover:border-white/30 transition-all duration-300">
                                
                                <div className="p-7 flex-1">
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="max-w-[70%]">
                                            <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tight drop-shadow-md">{event.title}</h2>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,1)]' : 'bg-gray-400'}`}></div>
                                                <span className={`text-[9px] uppercase font-black tracking-[0.2em] ${isToday ? 'text-orange-400' : 'text-gray-400'}`}>
                                                    {isToday ? 'Duty Live' : 'Scheduled'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] text-gray-400 uppercase font-black tracking-widest block mb-1">Scanned</span>
                                            <p className="text-2xl font-black text-white drop-shadow-sm">{percentage}%</p>
                                        </div>
                                    </div>

                                    {/* Glass Progress Rail */}
                                    <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mb-8 shadow-inner border border-white/5">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${percentage >= 100 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]'}`} 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>

                                    {/* CRISP Stats Inset */}
                                    <div className="grid grid-cols-2 gap-3 mb-8">
                                        <div className="bg-black/30 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]">
                                            <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1 flex items-center justify-center gap-1.5"><Users size={12}/> Expected</p>
                                            <p className="text-xl font-black text-white drop-shadow-sm">{total}</p>
                                        </div>
                                        <div className="bg-black/30 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]">
                                            <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1 flex items-center justify-center gap-1.5"><CheckCircle size={12}/> Present</p>
                                            <p className="text-xl font-black text-emerald-400 drop-shadow-sm">{present}</p>
                                        </div>
                                    </div>

                                    {/* Metadata Capsules */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-xs font-bold text-gray-300">
                                            <div className="p-1.5 bg-white/5 rounded-lg border border-white/10"><Calendar size={14} className="text-orange-400" /></div>
                                            <span>{eventDate.toLocaleDateString()} | {eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold text-gray-300">
                                            <div className="p-1.5 bg-white/5 rounded-lg border border-white/10"><MapPin size={14} className="text-orange-400" /></div>
                                            <span className="truncate">{event.venue}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Premium Glowing Amber Button */}
                                <div className="p-6 pt-0 mt-auto">
                                    <button 
                                        onClick={() => startScanning(event)}
                                        className="w-full bg-orange-500/10 text-orange-400 border border-orange-500/30 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all duration-300 active:scale-[0.98]"
                                    >
                                        <QrCode size={18} />
                                        Launch Scanner
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </main>
    </div>
  );
};

export default GatekeeperDashboard;