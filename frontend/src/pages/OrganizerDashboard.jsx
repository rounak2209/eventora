import React, { useEffect, useState } from 'react';
import { 
    getOrganizerEvents, 
    getGatekeepers, 
    getStats, 
    downloadAnalyticsReport, 
    sendAnalyticsEmail, 
    issueAllCertificates, 
    addGatekeeper,
    deleteEvent,
    updateEvent,
    updateGatekeeper,
    deleteGatekeeper
} from '../api'; 
import AIInsights from '../components/AIInsights';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { saveAs } from 'file-saver';
import { useNavigate, Link } from 'react-router-dom'; 
import { toast } from 'react-hot-toast';
import { 
    User, Mail, Shield, Plus, X, Download, Send, Award, CheckSquare, Square, 
    LayoutDashboard, Activity, BarChart3, PieChart as PieChartIcon, ChevronDown, 
    ChevronRight, Home, Loader2, Calendar, MapPin, Users, Edit, Trash2, Upload, Check 
} from 'lucide-react';

const OrganizerDashboard = () => {
  const [events, setEvents] = useState([]); 
  const [selectedEventId, setSelectedEventId] = useState(''); 
  const [stats, setStats] = useState(null);
  const [gatekeepers, setGatekeepers] = useState([]); 
  

  const [activeTab, setActiveTab] = useState('analytics'); 

  // Loaders
  const [loading, setLoading] = useState(true); 
  const [statsLoading, setStatsLoading] = useState(false); 
  
  const [sendingCerts, setSendingCerts] = useState(false);
  
  // Gatekeeper Modal States
  const [showGatekeeperForm, setShowGatekeeperForm] = useState(false);
  const [isEditingGk, setIsEditingGk] = useState(false);
  const [editingGkId, setEditingGkId] = useState(null);
  const [gkData, setGkData] = useState({ name: '', email: '', password: '', assignedEventIds: [] });
  
  const [activeManageEvent, setActiveManageEvent] = useState(null);
  
  // States for Edit Event Modal
  const [editingEvent, setEditingEvent] = useState(null);
  const [newBannerFile, setNewBannerFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const navigate = useNavigate();

  // 1. Fetch Basic Data 
  const fetchBasicData = async () => { 
      try {
        const [eventRes, gkRes] = await Promise.all([
            getOrganizerEvents().catch(() => ({ data: [] })), 
            getGatekeepers().catch(() => ({ data: [] }))
        ]);

        const fetchedEvents = eventRes.data || [];
        setEvents(fetchedEvents);
        setGatekeepers(gkRes.data || []);
        
        if (fetchedEvents.length > 0) {
           const sortedEvents = fetchedEvents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
           if (!selectedEventId) setSelectedEventId(sortedEvents[0]._id);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false); 
      }
  };

  useEffect(() => {
    fetchBasicData();
  }, []);

  // 2. Fetch Stats Independently 
  useEffect(() => {
    if (!selectedEventId) return;
    const fetchStats = async () => {
      setStatsLoading(true); 
      try {
        const res = await getStats(selectedEventId);
        setStats(res.data.stats);
      } catch (err) { 
        console.error(err); 
      } finally {
        setStatsLoading(false); 
      }
    };
    fetchStats();
  }, [selectedEventId]);

  const handleDownload = async () => {
    try {
      const res = await downloadAnalyticsReport(selectedEventId);
      saveAs(new Blob([res.data], { type: 'application/pdf' }), 'Event_Report.pdf');
    } catch (err) {
      toast.error("Download Failed");
    }
  };

  const handleEmail = async () => {
    if(!window.confirm("Email report to yourself?")) return;
    try {
      await sendAnalyticsEmail({ eventId: selectedEventId });
      toast.success("Email sent!");
    } catch (err) {
      toast.error("Email failed.");
    }
  };

  const handleSendCertificates = async () => {
    if (!selectedEventId) return toast.error("Select an event first");
    if(!window.confirm(`Are you sure you want to send certificates to ALL present attendees?`)) return;

    setSendingCerts(true);
    const toastId = toast.loading("Generating & Sending Certificates... 📨");

    try {
        const res = await issueAllCertificates({ eventId: selectedEventId });
        toast.success(res.data.message, { id: toastId });
    } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to send certificates", { id: toastId });
    } finally {
        setSendingCerts(false);
    }
  };

  // GATEKEEPER LOGIC

  const toggleEventSelection = (eventId) => {
    const currentIds = gkData.assignedEventIds;
    if (currentIds.includes(eventId)) {
        setGkData({ ...gkData, assignedEventIds: currentIds.filter(id => id !== eventId) });
    } else {
        setGkData({ ...gkData, assignedEventIds: [...currentIds, eventId] });
    }
  };

  const closeGkForm = () => {
      setShowGatekeeperForm(false);
      setIsEditingGk(false);
      setEditingGkId(null);
      setGkData({ name: '', email: '', password: '', assignedEventIds: [] });
  };

  const handleGatekeeperSubmit = async (e) => {
    e.preventDefault();
    if(gkData.assignedEventIds.length === 0) {
        return toast.error("Please assign at least one event!");
    }
    
    const toastId = toast.loading(isEditingGk ? "Updating Assignments..." : "Saving Gatekeeper...");
    try {
      if (isEditingGk) {
          // Update existing gatekeeper
          await updateGatekeeper(editingGkId, { assignedEventIds: gkData.assignedEventIds });
          toast.success("Assignments updated successfully! ✅", { id: toastId });
      } else {
          // Add new gatekeeper
          await addGatekeeper(gkData);
          toast.success(`Gatekeeper saved! ✅`, { id: toastId });
      }
      
      const gkRes = await getGatekeepers();
      setGatekeepers(gkRes.data);
      closeGkForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process request", { id: toastId });
    }
  };

  const handleEditGatekeeperClick = (gk) => {
      setGkData({
          name: gk.name,
          email: gk.email,
          password: '', 
          assignedEventIds: gk.assignedEvents ? gk.assignedEvents.map(ev => ev._id) : []
      });
      setEditingGkId(gk._id);
      setIsEditingGk(true);
      setShowGatekeeperForm(true);
  };

  const handleDeleteGatekeeper = async (id) => {
      if(!window.confirm("Are you sure you want to remove this gatekeeper permanently?")) return;
      const tid = toast.loading("Removing Gatekeeper...");
      try {
          await deleteGatekeeper(id);
          toast.dismiss(tid);
          toast.success("Gatekeeper removed successfully!");
          const gkRes = await getGatekeepers();
          setGatekeepers(gkRes.data);
      } catch (err) {
          toast.dismiss(tid);
          toast.error(err.response?.data?.message || "Failed to remove gatekeeper.");
      }
  };


  // EVENT LOGIC

  const handleDeleteEvent = async (eventId) => {
      if(!window.confirm("Are you sure you want to permanently delete this event? This action cannot be undone.")) return;
      const tid = toast.loading("Deleting Event...");
      try {
          await deleteEvent(eventId);
          toast.dismiss(tid);
          toast.success("Event Deleted Successfully!");
          fetchBasicData(); 
      } catch (err) {
          toast.dismiss(tid);
          toast.error(err.response?.data?.message || "Failed to delete event.");
      }
  };

  const handleUpdateEventSubmit = async (e) => {
      e.preventDefault();
      setIsUpdating(true);
      const tid = toast.loading("Updating Event Details...");
      
      try {
          const formData = new FormData();
          formData.append('title', editingEvent.title);
          formData.append('description', editingEvent.description);
          formData.append('date', editingEvent.date);
          formData.append('venue', editingEvent.venue);
          formData.append('registrationDeadline', editingEvent.registrationDeadline);
          formData.append('category', editingEvent.category);
          formData.append('price', editingEvent.price);
          formData.append('maxSeats', editingEvent.maxSeats);
          formData.append('isLive', editingEvent.isLive);
          
          if (newBannerFile) {
              formData.append('banner', newBannerFile);
          }

          await updateEvent(editingEvent._id, formData);
          toast.dismiss(tid);
          toast.success("Event Updated Successfully! 🎉");
          setEditingEvent(null);
          setNewBannerFile(null);
          fetchBasicData(); 
      } catch (error) {
          toast.dismiss(tid);
          toast.error(error.response?.data?.message || "Failed to update event");
      } finally {
          setIsUpdating(false);
      }
  };

  const formatForInput = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toISOString().slice(0, 16);
  };

  if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-transparent backdrop-blur-md">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin shadow-[0_0_20px_rgba(245, 158, 11, 0.3)]"></div>
                <p className="font-black text-orange-400 text-[10px] uppercase tracking-[0.2em] animate-pulse">Loading Hub...</p>
            </div>
        </div>
      );
  }

  const deptData = stats?.departments ? Object.entries(stats.departments).map(([key, val]) => ({ name: key, count: val })) : [];
  const hasDeptData = deptData.some(d => d.count > 0);
  const hasGenderData = stats && stats.gender && ((stats.gender.Male || 0) > 0 || (stats.gender.Female || 0) > 0);

  return (
    <div className="p-6 md:p-10 bg-transparent min-h-screen relative text-gray-100 font-sans selection:bg-orange-500/30 overflow-x-hidden z-10">
      
      <style>
        {`
          .dark-scroll::-webkit-scrollbar { width: 4px; }
          .dark-scroll::-webkit-scrollbar-track { background: transparent; }
          .dark-scroll::-webkit-scrollbar-thumb { background: rgba(245, 158, 11, 0.4); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar { height: 0px; }
        `}
      </style>

      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <div className="flex items-center gap-4">
                <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-2xl shadow-[0_0_15px_rgba(245, 158, 11, 0.15)]">
                    <LayoutDashboard size={28} className="text-orange-400" />
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">Organizer Hub</h1>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Analytics & Security Management</p>
                </div>
            </div>

            {/* NAVIGATION PILL */}
            <div className="flex bg-white/5 backdrop-blur-2xl p-1.5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/10 overflow-x-auto max-w-full custom-scrollbar">
                {['analytics', 'events', 'gatekeepers'].map((tab) => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        className={`px-5 py-2 rounded-xl font-bold text-xs tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-gray-300 hover:bg-white/10 border border-transparent'}`}
                    >
                        {tab}
                    </button>
                ))}
                <div className="w-px bg-white/10 mx-1 my-1"></div>
                <button 
                    onClick={() => navigate('/create-event')} 
                    className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    <Plus size={14} /> Create
                </button>
            </div>
        </div>


        {/* TAB 1: ANALYTICS                                       */}

        {activeTab === 'analytics' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 border-t-white/20 p-5 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-10 flex flex-col lg:flex-row justify-between items-center gap-5 hover:bg-white/10 transition-all duration-300">
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto relative">
                        <span className="font-black text-[10px] uppercase tracking-widest text-gray-400 whitespace-nowrap">Target Event:</span>
                        <div className="relative w-full sm:w-64">
                            <select 
                                value={selectedEventId} 
                                onChange={(e) => setSelectedEventId(e.target.value)} 
                                className="w-full bg-white/5 border border-white/20 text-white pl-4 pr-10 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500/50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] appearance-none cursor-pointer z-10 relative font-bold"
                                style={{ colorScheme: 'dark' }}
                            >
                                {events.map(ev => <option key={ev._id} value={ev._id} className="bg-[#111113] text-white">{ev.title}</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none z-20">
                                <ChevronDown size={16} className="text-orange-400" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-3 w-full lg:w-auto">
                        <button onClick={handleDownload} className="flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 px-5 py-3 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-sm">
                            <Download size={14} className="text-orange-400" /> PDF Report
                        </button>
                        <button onClick={handleEmail} className="flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 px-5 py-3 rounded-xl hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-sm">
                            <Send size={14} className="text-orange-400" /> Email Me
                        </button>
                        <button 
                            onClick={handleSendCertificates} 
                            disabled={sendingCerts}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all border ${sendingCerts ? 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed' : 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20 hover:shadow-[0_0_20px_rgba(245, 158, 11, 0.2)] active:scale-95'}`}
                        >
                            <Award size={14} /> 
                            {sendingCerts ? "Processing..." : "Issue Certificates"}
                        </button>
                    </div>
                </div>

                {statsLoading ? (
                    <div className="py-32 flex flex-col items-center justify-center text-orange-500">
                        <Loader2 size={40} className="animate-spin mb-4" />
                        <p className="font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Calculating Analytics...</p>
                    </div>
                ) : stats ? (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                            <div className="p-6 bg-white/5 backdrop-blur-2xl border border-white/10 border-t-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-[2rem] hover:bg-white/10 hover:border-white/30 transition-all duration-300 flex flex-col justify-center">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">Total Registrations</p>
                                <p className="text-4xl font-black text-white drop-shadow-md">{stats.total}</p>
                            </div>
                            <div className="p-6 bg-white/5 backdrop-blur-2xl border border-white/10 border-t-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-[2rem] hover:bg-white/10 hover:border-white/30 transition-all duration-300 flex flex-col justify-center">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">Checked In (Present)</p>
                                <p className="text-4xl font-black text-emerald-400 drop-shadow-md">{stats.present}</p>
                            </div>
                            <div className="p-6 bg-white/5 backdrop-blur-2xl border border-white/10 border-t-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-[2rem] hover:bg-white/10 hover:border-white/30 transition-all duration-300 flex flex-col justify-center">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">Pending (Absent)</p>
                                <p className="text-4xl font-black text-red-500 drop-shadow-md">{stats.absent}</p>
                            </div>
                            <div className="p-6 bg-white/5 backdrop-blur-2xl border border-white/10 border-t-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-[2rem] hover:bg-white/10 hover:border-white/30 transition-all duration-300 flex flex-col justify-center">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">Total Revenue</p>
                                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 drop-shadow-sm">₹{stats.total * 500}</p>
                            </div>
                        </div>

                        {/* GRAPHS SECTION */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                            <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 border-t-white/20 hover:bg-white/10 transition-all duration-300 flex flex-col min-h-[350px]">
                                <div className="flex items-center gap-2 mb-6">
                                    <BarChart3 size={18} className="text-orange-400" />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Department Breakdown</h3>
                                </div>
                                <div className="flex-1 w-full h-full relative">
                                    {hasDeptData ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="name" stroke="#9ca3af" tick={{fill: '#d1d5db', fontSize: 11, fontWeight: 'bold'}} tickLine={false} axisLine={false} />
                                            <YAxis allowDecimals={false} stroke="#9ca3af" tick={{fill: '#d1d5db', fontSize: 11, fontWeight: 'bold'}} tickLine={false} axisLine={false} />
                                            <Tooltip 
                                            cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff', fontWeight: 'bold' }}
                                            itemStyle={{ color: '#fbbf24' }}
                                            />
                                            <Bar dataKey="count" fill="#f97316" radius={[6, 6, 0, 0]} barSize={40} />
                                        </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                            <Activity size={32} className="mb-2 opacity-30"/>
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Not enough data to generate graph</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 border-t-white/20 hover:bg-white/10 transition-all duration-300 flex flex-col min-h-[350px]">
                                <div className="flex items-center gap-2 mb-6">
                                    <PieChartIcon size={18} className="text-orange-400" />
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Gender Ratio</h3>
                                </div>
                                <div className="flex-1 w-full h-full relative">
                                    {hasGenderData ? (
                                        <ResponsiveContainer width="100%" height="100%">
    <PieChart>
        <Pie 
            data={[
                { name: 'Male', value: stats.gender.Male || 0 },
                { name: 'Female', value: stats.gender.Female || 0 }
            ]} 
            cx="50%" cy="50%" 
            innerRadius={70}
            outerRadius={100} 
            paddingAngle={8}
            dataKey="value"
            stroke="rgba(0,0,0,0)"
        >
            <Cell fill="#f97316" /> 
            <Cell fill="#fbbf24" /> 
        </Pie>
        

        <Tooltip 
            contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                backdropFilter: 'blur(10px)', 
                borderColor: 'rgba(255,255,255,0.1)', 
                borderRadius: '12px',
                padding: '10px 15px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}
            itemStyle={{ color: '#ffffff', fontWeight: '900', fontSize: '14px' }}
            labelStyle={{ display: 'none' }} 
        />
        
        <Legend verticalAlign="bottom" wrapperStyle={{ color: '#d1d5db', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', paddingTop: '20px' }} />
    </PieChart>
</ResponsiveContainer>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                            <PieChartIcon size={32} className="mb-2 opacity-30"/>
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting attendee data</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* AI INSIGHTS SECTION */}
                        <div className="mb-16">
                            <AIInsights eventId={selectedEventId} />
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-dashed border-white/20 mb-10">
                        <Activity size={40} className="mx-auto text-gray-500 mb-4 opacity-50"/>
                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Select an event to view analytics</p>
                    </div>
                )}
            </div>
        )}

    
        {/* TAB 2: MY EVENTS                                       */}
        {activeTab === 'events' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Active Events</h2>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Manage your created events</p>
                    </div>
                </div>

                {events.length === 0 ? (
                    <div className="p-16 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-dashed border-white/10 text-center flex flex-col items-center justify-center">
                        <Calendar size={48} className="text-gray-500 mb-4 opacity-30"/>
                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs mb-4">No events created yet.</p>
                        <button onClick={() => navigate('/create-event')} className="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500/20 transition-all">Create First Event</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {events.map(event => (
                            <div key={event._id} className="bg-white/5 backdrop-blur-2xl p-6 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 border-t-white/20 hover:-translate-y-1 hover:border-orange-500/30 transition-all duration-300 flex flex-col group relative">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                        {event.category || 'Event'}
                                    </span>
                                    <span className="text-[10px] font-black uppercase text-gray-500">
                                        ₹{event.price || 0}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-white leading-tight mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">{event.title}</h3>
                                <p className="text-gray-400 text-xs font-medium line-clamp-2 mb-4 flex-1">{event.description || 'No description provided.'}</p>
                                
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                                        <Calendar size={12} className="text-orange-500"/>
                                        {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                                        <MapPin size={12} className="text-orange-500"/>
                                        <span className="truncate">{event.venue}</span>
                                    </div>
                                </div>

                                <div className="mt-auto grid grid-cols-2 gap-2 relative">
                                    <button 
                                        onClick={() => { setSelectedEventId(event._id); setActiveTab('analytics'); }}
                                        className="bg-white/5 border border-white/10 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 text-center"
                                    >
                                        Stats
                                    </button>
                                    <button 
                                        onClick={() => setActiveManageEvent(activeManageEvent === event._id ? null : event._id)}
                                        className="bg-orange-500/10 border border-orange-500/30 text-orange-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500/20 transition-all active:scale-95 text-center flex justify-center items-center gap-1"
                                    >
                                        Manage <ChevronDown size={14} className={`transition-transform ${activeManageEvent === event._id ? 'rotate-180' : ''}`} />
                                    </button>

                                    {activeManageEvent === event._id && (
                                        <div className="absolute bottom-12 right-0 w-40 bg-[#111] backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                            <button 
                                                onClick={() => {
                                                    setEditingEvent({
                                                        ...event,
                                                        date: formatForInput(event.date),
                                                        registrationDeadline: formatForInput(event.registrationDeadline)
                                                    });
                                                    setActiveManageEvent(null);
                                                }} 
                                                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                                            >
                                                <Edit size={14} /> Edit Event
                                            </button>
                                            <div className="h-px bg-white/10 w-full"></div>
                                            <button 
                                                onClick={() => { handleDeleteEvent(event._id); setActiveManageEvent(null); }} 
                                                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* TAB 3: GATEKEEPER MANAGEMENT ( NOW WITH EDIT/DELETE) */}
        {activeTab === 'gatekeepers' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-l-4 border-orange-500 pl-4">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Security Team</h2>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Manage Scanner Personnels</p>
                    </div>
                    <button 
                        onClick={() => setShowGatekeeperForm(true)} 
                        className="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500/20 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={14} /> Add New
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gatekeepers.length > 0 ? (
                        gatekeepers.map((gk) => (
                            <div key={gk._id} className="relative bg-white/5 backdrop-blur-2xl p-6 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 border-t-white/20 hover:bg-white/10 hover:border-white/30 transition-all flex flex-col gap-4 group">
                                

                                <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                    <button 
                                        onClick={() => handleEditGatekeeperClick(gk)} 
                                        className="p-2 bg-black/40 hover:bg-orange-500/20 hover:text-orange-400 rounded-xl text-gray-400 border border-white/5 transition-all shadow-sm"
                                        title="Update Assignments"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteGatekeeper(gk._id)} 
                                        className="p-2 bg-black/40 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-gray-400 border border-white/5 transition-all shadow-sm"
                                        title="Remove Gatekeeper"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 pr-16">
                                    <div className="bg-orange-500/10 border border-orange-500/20 p-3.5 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                        <Shield size={20} className="text-orange-400" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-black text-white text-lg leading-tight truncate">{gk.name}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold tracking-widest flex items-center gap-1.5 mt-0.5 truncate">
                                            <Mail size={10} className="text-orange-400/70 shrink-0" /> <span className="truncate">{gk.email}</span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="mt-2 bg-black/20 p-4 rounded-2xl border border-white/5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]">
                                    <span className="block text-[8px] text-gray-400 font-black uppercase tracking-widest mb-2">Assigned Duties</span>
                                    <div className="flex flex-wrap gap-2">
                                        {gk.assignedEvents && gk.assignedEvents.length > 0 ? (
                                            gk.assignedEvents.map(ev => (
                                                <span key={ev._id} className="bg-white/5 text-gray-200 px-2.5 py-1 rounded-md border border-white/10 text-[10px] font-bold shadow-sm">
                                                    {ev.title}
                                                </span>
                                            ))
                                        ) : <span className="text-red-400/80 text-[10px] font-bold">No active assignments</span>}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16 bg-white/5 rounded-[3rem] border border-dashed border-white/10 text-gray-500">
                            <Shield size={32} className="mx-auto text-gray-500 mb-3 opacity-30"/>
                            <p className="font-bold uppercase tracking-widest text-[10px]">No security personnel added yet.</p>
                        </div>
                    )}
                </div>
            </div>
        )}


        {/* EDIT EVENT MODAL                                    */}

        {editingEvent && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 border-t-white/20 p-6 md:p-8 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] w-full max-w-3xl relative animate-in zoom-in-95 duration-300 my-8">
                    
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                                <Edit size={24} className="text-orange-400"/> Edit Event
                            </h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Update details for your live event</p>
                        </div>
                        <button 
                            onClick={() => { setEditingEvent(null); setNewBannerFile(null); }} 
                            className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-sm"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleUpdateEventSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 dark-scroll">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Event Title</label>
                                <input type="text" required value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 outline-none font-medium" />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                                <select required value={editingEvent.category} onChange={e => setEditingEvent({...editingEvent, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 outline-none font-medium appearance-none" style={{ colorScheme: 'dark' }}>
                                    <option value="Tech">Tech</option>
                                    <option value="Cultural">Cultural</option>
                                    <option value="Sports">Sports</option>
                                    <option value="Workshop">Workshop</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Event Date & Time</label>
                                <input type="datetime-local" required value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 outline-none font-medium" style={{ colorScheme: 'dark' }} />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1.5 ml-1">Registration Deadline</label>
                                <input type="datetime-local" required value={editingEvent.registrationDeadline} onChange={e => setEditingEvent({...editingEvent, registrationDeadline: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 outline-none font-medium" style={{ colorScheme: 'dark' }} />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Venue / Location</label>
                                <input type="text" required value={editingEvent.venue} onChange={e => setEditingEvent({...editingEvent, venue: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 outline-none font-medium" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Price (₹)</label>
                                    <input type="number" required min="0" value={editingEvent.price} onChange={e => setEditingEvent({...editingEvent, price: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 outline-none font-medium" />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Max Seats</label>
                                    <input type="number" required min="1" value={editingEvent.maxSeats} onChange={e => setEditingEvent({...editingEvent, maxSeats: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 outline-none font-medium" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Event Description</label>
                            <textarea rows="3" required value={editingEvent.description} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 outline-none font-medium resize-none"></textarea>
                        </div>

                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="flex-1 w-full">
                                <label className="block text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1.5 ml-1">Update Banner Image (Optional)</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-xl cursor-pointer transition-all active:scale-95 text-xs font-bold text-gray-300 w-full sm:w-auto justify-center">
                                        <Upload size={14} className="text-orange-400" />
                                        {newBannerFile ? newBannerFile.name.substring(0, 20) + "..." : "Upload New Photo"}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setNewBannerFile(e.target.files[0])} />
                                    </label>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-xl border border-white/10 w-full sm:w-auto justify-center">
                                <label className="text-[10px] text-white font-black uppercase tracking-widest cursor-pointer flex items-center gap-2">
                                    <input type="checkbox" checked={editingEvent.isLive} onChange={e => setEditingEvent({...editingEvent, isLive: e.target.checked})} className="w-4 h-4 accent-orange-500 cursor-pointer" />
                                    Is Live (Visible)
                                </label>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex gap-3 mt-4">
                            <button type="submit" disabled={isUpdating} className="flex-[2] bg-orange-500/10 border border-orange-500/30 text-orange-400 font-black text-[11px] uppercase tracking-[0.2em] py-3.5 rounded-xl shadow-lg hover:bg-orange-500/20 flex justify-center items-center gap-2 transition-all active:scale-[0.98]">
                                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* ADD/EDIT GATEKEEPER MODAL                              */}
        {showGatekeeperForm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 animate-in fade-in duration-200 p-4">
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 border-t-white/20 p-6 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] w-full max-w-[380px] relative animate-in zoom-in-95 duration-300">
                    
                    <button 
                        onClick={closeGkForm} 
                        className="absolute top-5 right-5 bg-white/5 border border-white/10 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-sm"
                    >
                        <X size={18} />
                    </button>

                    <h2 className="text-xl font-black mb-1 text-white uppercase tracking-tight">
                        {isEditingGk ? "Update Assignments" : "New Gatekeeper"}
                    </h2>
                    <p className="text-[9px] font-black tracking-widest uppercase text-gray-400 mb-4">
                        {isEditingGk ? "Modify active duties" : "Grant Access & Assign Duties"}
                    </p>

                    <form onSubmit={handleGatekeeperSubmit} className="space-y-3">
                        <div>
                            <label className="block text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                            <input 
                                type="text" required 
                                disabled={isEditingGk}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-orange-500/50 outline-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] placeholder-gray-500 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="e.g. John Security"
                                value={gkData.name}
                                onChange={e => setGkData({...gkData, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5 ml-1">Email (Login ID)</label>
                            <input 
                                type="email" required 
                                disabled={isEditingGk}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-orange-500/50 outline-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] placeholder-gray-500 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="gatekeeper@eventora.com"
                                value={gkData.email}
                                onChange={e => setGkData({...gkData, email: e.target.value})}
                            />
                        </div>
                        
                        {!isEditingGk && (
                            <div>
                                <label className="block text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5 ml-1">Scanner Password</label>
                                <input 
                                    type="password" required 
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-1 focus:ring-orange-500/50 outline-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] placeholder-gray-500 transition-all text-sm"
                                    placeholder="••••••••"
                                    value={gkData.password}
                                    onChange={e => setGkData({...gkData, password: e.target.value})}
                                />
                            </div>
                        )}

                        {/* Events List */}
                        <div className="border border-white/10 rounded-2xl p-3 bg-black/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] mt-3">
                            <label className="block text-[9px] font-black text-orange-400 uppercase tracking-widest mb-2">Assign Events</label>
                            <div className="space-y-2 max-h-28 overflow-y-auto pr-2 dark-scroll">
                                {events.map((ev) => {
                                    const isSelected = gkData.assignedEventIds.includes(ev._id);
                                    return (
                                        <div 
                                            key={ev._id} 
                                            onClick={() => toggleEventSelection(ev._id)}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all duration-200 ${isSelected ? 'bg-orange-500/10 border-orange-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                        >
                                            {isSelected ? <CheckSquare size={16} className="text-orange-400" /> : <Square size={16} className="text-gray-500" />}
                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-white' : 'text-gray-400'}`}>{ev.title}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-[8px] text-gray-500 font-bold mt-3 text-right uppercase tracking-widest">
                                {gkData.assignedEventIds.length} Selected
                            </p>
                        </div>
                        
                        <button type="submit" className="w-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-black text-[10px] uppercase tracking-[0.2em] py-3 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:bg-orange-500/20 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] flex justify-center items-center gap-2 mt-4 transition-all active:scale-[0.98]">
                             {isEditingGk ? "Update Duties" : "Save Credentials"} <Send size={14} />
                        </button>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;