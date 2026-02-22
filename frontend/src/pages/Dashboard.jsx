import React, { useState, useEffect, useContext } from 'react';
import { 
  getEvents, getMyTeam, getMyRequests, bookTicket, 
  createTeam, joinTeam, deleteTeam, leaveTeam, 
  removeMember, handleRequest, getMyConversations
} from '../api'; 
import { toast } from 'react-hot-toast';
import { 
  Calendar, Users, Bell, QrCode, LogOut, Trash2, 
  ArrowRight, Check, X, MapPin, User, Search, UserPlus, Copy, MessageCircle, ImageIcon, Tags, IndianRupee, Info 
} from 'lucide-react'; 
import AuthContext from '../context/AuthContext';
import TicketModal from '../components/TicketModal'; 
import { useNavigate } from 'react-router-dom';
import ChatBox from '../components/ChatBox'; 

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('events'); 
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  const [events, setEvents] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [requests, setRequests] = useState([]);
  const [conversations, setConversations] = useState([]); 

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketData, setTicketData] = useState(null);

  const [createTeamData, setCreateTeamData] = useState({ name: '', desc: '', eventId: '' });
  const [joinCode, setJoinCode] = useState({});

  // 🔥 SEARCH & FILTER STATES
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [chatOpen, setChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState(null);
  const [isGroupChat, setIsGroupChat] = useState(false); 

  const userId = user?._id || user?.id;

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const [eRes, tRes, rRes, cRes] = await Promise.all([
            getEvents().catch(() => ({ data: [] })),
            getMyTeam().catch(() => ({ data: [] })),
            getMyRequests().catch(() => ({ data: [] })),
            getMyConversations().catch(() => ({ data: [] }))
        ]);

        setEvents(eRes.data || []);
        
        const teamsData = tRes.data;
        setMyTeams(Array.isArray(teamsData) ? teamsData : teamsData ? [teamsData] : []);
        setRequests(rRes.data || []);
        setConversations(cRes.data || []); 
        
        setLoading(false);
      } catch (error) {
        console.error("Fetch Error", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, refreshTrigger]); 

  const refresh = () => setRefreshTrigger(p => p + 1);

  const isRegistered = (event) => {
    return event.participants?.some(p => String(p._id || p) === String(userId));
  };

  const handleBookTicket = async (eventId) => {
    const tid = toast.loading("Finalizing Booking...");
    try {
        const myTeam = myTeams.find(t => t.event?._id === eventId);
        await bookTicket({ eventId, teamId: myTeam ? myTeam._id : null });
        toast.dismiss(tid); toast.success("Ticket Confirmed & Emailed! 🎉");
        refresh(); setActiveTab('my_hub');
    } catch (err) { toast.dismiss(tid); toast.error(err.response?.data?.message || "Booking Failed"); }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await createTeam({ name: createTeamData.name, eventId: createTeamData.eventId });
      toast.success("Team Created! Now Finalize Entry.");
      setCreateTeamData({ name: '', desc: '', eventId: '' });
      refresh(); 
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleJoinByCode = async (eventId) => {
    const code = joinCode[eventId];
    if (!code) return toast.error("Enter Code");
    try {
        await joinTeam({ teamCode: code, eventId });
        toast.success("Joined Successfully!");
        refresh(); setActiveTab('my_hub');
    } catch (err) { toast.error(err.response?.data?.message || "Invalid Code"); }
  };

  const handleDeleteTeam = async (teamId) => {
    if(!window.confirm("Delete Team?")) return;
    try { await deleteTeam({ teamId }); toast.success("Deleted"); refresh(); } catch (error) { toast.error("Failed"); }
  };

  const handleLeaveTeam = async (teamId) => {
    if(!window.confirm("Leave this team?")) return;
    try { await leaveTeam({ teamId }); toast.success("Left Team"); refresh(); } catch (error) { toast.error("Failed"); }
  };

  const handleRemoveMember = async (teamId, memberId) => {
    if(!window.confirm("Remove member?")) return;
    try { await removeMember({ teamId, memberId }); toast.success("Removed"); refresh(); } catch (error) { toast.error("Failed"); }
  };

  const respondToRequest = async (requestId, action) => {
    try { await handleRequest({ requestId, action }); toast.success(`${action}ed!`); refresh(); } catch (error) { toast.error("Error processing request"); }
  };

  const handleShowTicket = (event, team = null) => {
      setTicketData({ event, user, team });
      setShowTicketModal(true);
  };
  
  const openChat = (recipientId, recipientName) => {
      setChatRecipient({ _id: recipientId, name: recipientName });
      setIsGroupChat(false); 
      setChatOpen(true);
  };
  
  const openGroupChat = (team) => {
      setChatRecipient({ _id: team._id, name: `${team.name} Squad` });
      setIsGroupChat(true); 
      setChatOpen(true);
  };

  if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-transparent backdrop-blur-md">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin shadow-[0_0_20px_rgba(245,158,11,0.3)]"></div>
                <p className="font-black text-orange-400 text-[10px] uppercase tracking-[0.2em] animate-pulse">Syncing Hub Data...</p>
            </div>
        </div>
      );
  }

  const formatDate = (dateStr) => {
      if(!dateStr) return 'TBA';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
  };

  const getMaxTeamSize = (event) => {
      if (typeof event.teamSizeMax === 'number') return event.teamSizeMax;
      if (typeof event.teamSize === 'number') return event.teamSize;
      return 4; 
  };

  const getImageUrl = (path) => {
      if (!path) return null;
      if (path.startsWith('http')) return path; 
      const serverUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
      const cleanPath = path.replace(/\\/g, '/'); 
      return `${serverUrl}/${cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath}`;
  };

  const fallbackImage = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000&auto=format&fit=crop";

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-transparent min-h-screen relative text-gray-100 selection:bg-orange-500/30 overflow-hidden z-10">
      
      <div className="absolute top-[10%] left-[-5%] w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Hello, {user?.name?.split(' ')[0]}! </h1>
          <p className="text-gray-300 font-medium">Ready for your next challenge?</p>
        </div>
        <div className="flex bg-white/5 backdrop-blur-2xl p-1.5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/10 overflow-x-auto max-w-full custom-scrollbar">
           <style>
            {` .custom-scrollbar::-webkit-scrollbar { height: 0px; } `}
           </style>
           <button onClick={() => navigate('/finder')} className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-widest text-orange-400 hover:bg-white/10 transition-all flex items-center gap-2 whitespace-nowrap"><Search size={14} /> Find Talent</button>
           
           {['events', 'my_hub', 'inbox'].map((tab) => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-xl font-bold text-xs tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-gray-300 hover:bg-white/10 border border-transparent'}`}>{tab.replace('_', ' ')}</button>
           ))}
        </div>
      </div>

      {/* EVENTS TAB */}
      {activeTab === 'events' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                      type="text" 
                      placeholder="Search for an event..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white font-bold placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 shadow-inner transition-all"
                  />
              </div>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
                  {['All', 'Tech', 'Cultural', 'Sports', 'Workshop'].map(cat => (
                      <button 
                          key={cat} 
                          onClick={() => setSelectedCategory(cat)} 
                          className={`px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all shadow-sm active:scale-95 ${selectedCategory === cat ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'}`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
          </div>

          {filteredEvents.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-2xl border border-dashed border-white/10 p-16 rounded-[3rem] text-center text-gray-500 font-bold uppercase tracking-widest text-sm shadow-inner">
                  No events found matching your criteria.
              </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map(event => { 
                const hasTicket = isRegistered(event);
                const myTeam = myTeams.find(t => t.event?._id === event._id);
                const hasTeam = !!myTeam;
                const isLeader = hasTeam && String(myTeam.leader?._id || myTeam.leader) === String(userId);
                const teamSizeDisplay = getMaxTeamSize(event);
                const finalBannerUrl = getImageUrl(event.banner);

                return (
                  <div key={event._id} className="relative h-[420px] rounded-[2.5rem] bg-white/[0.02] backdrop-blur-3xl overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 border-t-white/20 flex flex-col justify-end hover:-translate-y-1 transition-all duration-300">
                    
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        {finalBannerUrl ? (
                            <img 
                                src={finalBannerUrl} 
                                alt={event.title} 
                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-80"
                                onError={(e) => { e.target.src = fallbackImage; e.target.onerror = null; }} 
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                                <ImageIcon size={60} className="mb-2 opacity-20" strokeWidth={1} />
                            </div>
                        )}
                    </div>
                    
                    <div className={`absolute inset-0 bg-gradient-to-t ${finalBannerUrl ? 'from-[#09090b] via-[#09090b]/70 to-transparent' : 'from-transparent to-transparent'} z-10 pointer-events-none`}></div>

                    <div className="absolute top-5 left-5 z-20 flex gap-2">
                        <span className="bg-white/10 backdrop-blur-md text-gray-200 border border-white/20 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                            <Tags size={10} className="text-orange-400" /> {event.category || 'Tech'}
                        </span>
                    </div>
                    <div className="absolute top-5 right-5 z-20">
                        <span className="bg-orange-500/10 backdrop-blur-md text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                            {event.price > 0 ? <><IndianRupee size={12}/>{event.price}</> : 'FREE'}
                        </span>
                    </div>

                    <div className="relative z-20 p-6 w-full flex flex-col gap-4">
                        <div>
                            <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md mb-0.5">{event.title}</h3>
                            <p className="text-gray-300/80 text-[11px] font-medium line-clamp-1">
                                {event.description || "Join this amazing event and showcase your skills to the world."}
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-xl flex-1 min-w-[100px]">
                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-0.5"><Calendar size={8} className="inline mr-1 text-orange-400"/> Date</p>
                                <p className="text-[9px] font-bold text-white">{formatDate(event.date).split('•')[0]}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-xl flex-1 min-w-[100px]">
                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-0.5"><MapPin size={8} className="inline mr-1 text-orange-400"/> Venue</p>
                                <p className="text-[9px] font-bold text-white truncate">{event.venue}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-xl flex-[2]">
                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-0.5"><Users size={8} className="inline mr-1 text-orange-400"/> Squad Size</p>
                                <p className="text-[9px] font-bold text-white">
                                    {event.isTeamEvent ? `Max ${teamSizeDisplay}` : 'Solo'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-1">
                            {hasTicket ? (
                            <button onClick={() => handleShowTicket(event, myTeam)} className="w-full bg-emerald-500/10 backdrop-blur-md text-emerald-400 border border-emerald-500/30 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition shadow-sm active:scale-95"><QrCode size={14}/> Ticket Confirmed</button> 
                            ) : hasTeam ? ( 
                            isLeader ? (
                                <div className="flex gap-2 items-center">
                                    <span className="flex-1 text-[9px] text-gray-300 font-black uppercase tracking-widest bg-white/5 backdrop-blur-md px-3 py-3.5 rounded-xl border border-white/10 text-center truncate">{myTeam.name}</span>
                                    <button onClick={() => handleBookTicket(event._id)} className="flex-[2] bg-orange-500/10 border border-orange-500/30 text-orange-400 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500/20 transition active:scale-95 text-center">Finalize Entry</button>
                                </div>
                            ) : (
                                <div className="bg-orange-500/10 backdrop-blur-md p-3.5 rounded-xl text-center border border-orange-500/20"><p className="text-orange-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Info size={14}/> Waiting for Leader</p></div> 
                            )
                            ) : ( 
                            event.isTeamEvent ? (
                                <div className="space-y-2">
                                {createTeamData.eventId === event._id ? (
                                    <form onSubmit={handleCreateTeam} className="bg-black/40 backdrop-blur-2xl p-3 rounded-2xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-2">
                                        <input type="text" placeholder="Enter Squad Name..." className="w-full text-xs p-2.5 bg-white/5 border border-white/10 text-white rounded-xl mb-2 focus:ring-1 focus:ring-orange-500/50 outline-none placeholder-gray-500 font-bold" value={createTeamData.name} onChange={e => setCreateTeamData({...createTeamData, name: e.target.value})} required/>
                                        <div className="flex gap-2">
                                            <button className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] uppercase tracking-widest py-2.5 rounded-xl font-black flex-1 active:scale-95 transition-all hover:bg-orange-500/20">Create</button>
                                            <button type="button" onClick={() => setCreateTeamData({ name: '', eventId: '' })} className="bg-white/5 text-gray-400 text-[9px] uppercase tracking-widest py-2.5 rounded-xl font-black border border-white/10 hover:bg-white/10 hover:text-white transition px-4 active:scale-95">Cancel</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={() => setCreateTeamData({...createTeamData, eventId: event._id})} className="flex-[1.5] bg-orange-500/10 hover:bg-orange-500/20 backdrop-blur-md text-orange-400 border border-orange-500/30 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition active:scale-95">Create Squad</button>
                                        
                                        <div className="flex-[2] flex items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-0.5 shadow-inner focus-within:border-orange-500/50 transition-colors">
                                            <input type="text" placeholder="Join Code" className="bg-transparent text-white px-3 w-full outline-none text-[10px] font-bold uppercase tracking-widest placeholder-gray-500" value={joinCode[event._id] || ''} onChange={(e) => setJoinCode({...joinCode, [event._id]: e.target.value})}/>
                                            <button onClick={() => handleJoinByCode(event._id)} className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 p-2 rounded-lg text-orange-400 transition-all active:scale-90"><ArrowRight size={14}/></button>
                                        </div>
                                    </div>
                                )}
                                </div>
                            ) : (
                                <button onClick={() => handleBookTicket(event._id)} className="w-full bg-orange-500/10 hover:bg-orange-500/20 backdrop-blur-md text-orange-400 border border-orange-500/30 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition active:scale-95">Register Solo</button> 
                            )
                            )}
                        </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* --- 🔥 MY HUB TAB --- */}
      {activeTab === 'my_hub' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3"><div className="p-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl shadow-inner"><User size={20}/></div><h2 className="text-xl font-black text-white drop-shadow-md uppercase tracking-widest">My Solo Events</h2></div>
                </div>
                {events.filter(e => !e.isTeamEvent && isRegistered(e)).length === 0 ? (
                    <div className="p-12 bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-dashed border-white/10 text-center text-gray-500 font-bold uppercase tracking-widest text-xs shadow-inner">No solo events joined yet.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.filter(e => !e.isTeamEvent && isRegistered(e)).map(event => {
                            const finalBannerUrl = getImageUrl(event.banner);
                            return (
                            <div key={event._id} className="relative h-[380px] rounded-[2.5rem] bg-white/[0.02] backdrop-blur-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 border-t-white/20 group hover:-translate-y-1 transition-all duration-300 flex flex-col justify-end">
                                <div className="absolute inset-0 z-0 overflow-hidden">
                                    {finalBannerUrl && (
                                        <img src={finalBannerUrl} alt={event.title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-60" onError={(e) => { e.target.src = fallbackImage; e.target.onerror = null; }} />
                                    )}
                                </div>
                                <div className={`absolute inset-0 bg-gradient-to-t ${finalBannerUrl ? 'from-[#09090b] via-[#09090b]/60 to-transparent' : 'from-transparent to-transparent'} z-10 pointer-events-none`}></div>
                                <button onClick={() => handleShowTicket(event, null)} className={`absolute top-5 right-5 bg-white/10 backdrop-blur-md border border-white/20 text-white p-2.5 rounded-2xl hover:bg-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition duration-300 z-20 active:scale-95`}><QrCode size={16}/></button>
                                <div className="relative z-20 p-6">
                                    <span className="inline-block mb-2 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 backdrop-blur-md">Solo Participant</span>
                                    <h3 className="text-xl font-black text-white leading-tight drop-shadow-md mb-3 pr-12">{event.title}</h3>
                                    <div className="flex gap-2 mb-3">
                                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl flex-1">
                                            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest"><Calendar size={8} className="inline mr-1 text-orange-400"/> Date</p>
                                            <p className="text-[9px] font-bold text-white truncate">{formatDate(event.date).split('•')[0]}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleShowTicket(event, null)} className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition flex justify-center items-center gap-2 active:scale-95"><QrCode size={14}/> View Ticket</button>
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </section>

            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3"><div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl shadow-inner"><Users size={20}/></div><h2 className="text-xl font-black text-white drop-shadow-md uppercase tracking-widest">My Squads</h2></div>
                </div>
                {myTeams.length === 0 ? <div className="p-12 bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-dashed border-white/10 text-center text-gray-500 font-bold uppercase tracking-widest text-xs shadow-inner">No teams joined.</div> : 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {myTeams.map(team => {
                        const isLeader = String(team.leader?._id || team.leader) === String(userId);
                        const fullEvent = events.find(e => e._id === (team.event?._id || team.event));
                        const hasTicket = fullEvent && isRegistered(fullEvent);
                        const finalBannerUrl = getImageUrl(fullEvent?.banner);
                        return (
                        <div key={team._id} className="relative rounded-[2.5rem] bg-white/[0.02] backdrop-blur-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 border-t-white/20 group hover:-translate-y-1 transition-all duration-300">
                            <div className="absolute inset-0 z-0 overflow-hidden">
                                {finalBannerUrl && <img src={finalBannerUrl} className="w-full h-full object-cover object-center opacity-30 group-hover:opacity-40 transition-opacity duration-700" onError={(e) => { e.target.src = fallbackImage; e.target.onerror = null; }} />}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent z-10 pointer-events-none"></div>
                            <div className="relative z-20 p-6 md:p-8">
                                <div className="flex justify-between items-start mb-5">
                                    <div>
                                        <span className="text-[9px] uppercase tracking-widest text-orange-400 font-black bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-lg backdrop-blur-md">Target: {fullEvent?.title || "Loading..."}</span>
                                        <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md mt-3">{team.name}</h3>
                                    </div>
                                    {hasTicket && <button onClick={() => handleShowTicket(fullEvent, team)} className="bg-white/5 backdrop-blur-md border border-white/10 text-white p-3 rounded-2xl hover:bg-white/10 transition duration-300 shadow-xl active:scale-95"><QrCode size={18}/></button>}
                                </div>
                                {!hasTicket && isLeader && (
                                    <div className="bg-red-500/10 backdrop-blur-md p-4 rounded-2xl mb-5 border border-red-500/20 flex justify-between items-center shadow-inner">
                                        <p className="text-red-400 font-black flex items-center gap-2 uppercase tracking-widest text-[10px]"><span className="text-base">⚠️</span> Action Needed</p>
                                        <button onClick={() => handleBookTicket(fullEvent?._id)} className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">BOOK ENTRY</button>
                                    </div>
                                )}
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-3xl mb-5 flex justify-between items-center shadow-inner">
                                    <div><p className="text-[9px] text-gray-400 uppercase font-black mb-1.5 tracking-widest">Squad Code</p><div className="flex items-center gap-3"><p className="font-mono text-xl font-black tracking-widest text-white select-all">{team.code}</p><button onClick={() => { navigator.clipboard.writeText(team.code); toast.success("Code Copied!"); }} className="text-orange-400 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg border border-white/10"><Copy size={14}/></button></div></div>
                                    {isLeader ? <button onClick={() => handleDeleteTeam(team._id)} className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/30 p-2.5 rounded-2xl transition active:scale-95"><Trash2 size={18}/></button> : <button onClick={() => handleLeaveTeam(team._id)} className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/30 p-2.5 rounded-2xl transition active:scale-95"><LogOut size={18}/></button>}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1 mb-2">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Squad Roster</p>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openGroupChat(team)} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 px-2.5 py-1.5 rounded-xl transition active:scale-95 shadow-sm"><MessageCircle size={12}/> Chat</button>
                                            {isLeader && <button onClick={() => navigate(`/finder?eventId=${fullEvent?._id}`)} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 px-2.5 py-1.5 rounded-xl transition active:scale-95 shadow-sm"><UserPlus size={12}/> Add</button>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {team.members?.map(m => {
                                            const isMe = String(m._id) === String(userId);
                                            return (
                                            <div key={m._id} className="flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-sm">
                                                <span className="text-xs font-bold text-white flex items-center truncate">
                                                    {m.name} {String(team.leader?._id || team.leader) === String(m._id) && <span className="ml-2 text-[8px] uppercase tracking-widest font-black bg-orange-500/10 border border-orange-500/30 text-orange-400 px-2 py-0.5 rounded shadow-sm">LDR</span>}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    {!isMe && <button onClick={() => openChat(m._id, m.name)} className="text-gray-400 hover:text-orange-400 transition active:scale-90 bg-white/5 p-1.5 rounded-xl border border-white/5" title="Direct Message"><MessageCircle size={14}/></button>}
                                                    {/* 🔥 FIX: Added the Remove Button for Leaders right here! */}
                                                    {isLeader && !isMe && (
                                                        <button onClick={() => handleRemoveMember(team._id, m._id)} className="text-red-400 hover:bg-red-500/20 transition active:scale-90 bg-red-500/10 p-1.5 rounded-xl border border-red-500/20" title="Remove Member">
                                                            <X size={14}/>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})}
                 </div>
                }
            </section>
        </div>
      )}

      {/* --- INBOX TAB --- */}
      {activeTab === 'inbox' && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="mb-10">
                 <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 drop-shadow-md uppercase tracking-widest"><div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl"><MessageCircle size={18}/></div> Direct Messages</h2>
                 {conversations.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-2xl border border-dashed border-white/10 p-8 rounded-[2rem] text-center text-gray-500 font-bold uppercase tracking-widest text-xs shadow-inner">No recent messages.</div>
                 ) : (
                    <div className="grid gap-3">
                        {conversations.map(chat => (
                            <div key={chat._id} onClick={() => openChat(chat._id, chat.name)} className="bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 flex justify-between items-center cursor-pointer hover:bg-white/10 transition shadow-sm active:scale-[0.99]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center font-black text-lg">{chat.name[0]}</div>
                                    <div><h3 className="font-bold text-white text-sm">{chat.name} {chat.teamName && <span className="text-[10px] font-bold text-orange-400 ml-2 uppercase tracking-widest border border-orange-500/30 px-1.5 py-0.5 rounded bg-orange-500/10">Team {chat.teamName}</span>}</h3><p className="text-xs text-gray-400 truncate w-48 sm:w-64 mt-0.5">{chat.lastMessage}</p></div>
                                </div>
                                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest bg-black/20 border border-white/5 px-2 py-1 rounded-lg">{new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        ))}
                    </div>
                 )}
             </div>
             <div>
                 <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 drop-shadow-md uppercase tracking-widest"><div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl"><Bell size={18}/></div> Official Invites</h2>
                 {requests.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-2xl border border-dashed border-white/10 p-8 rounded-[2rem] text-center text-gray-500 font-bold uppercase tracking-widest text-xs shadow-inner">No pending invites.</div>
                 ) : (
                    <div className="space-y-4">
                        {requests.map(req => {
                            const isInvite = req.type === 'INVITE';
                            const title = isInvite ? `Team Invite: ${req.team?.name}` : `Join Request: ${req.user?.name}`;
                            const linkedEvent = events.find(e => e._id === (req.team?.event?._id || req.team?.event));
                            return (
                                <div key={req._id} className="bg-white/5 backdrop-blur-2xl p-6 rounded-[2rem] shadow-md border border-white/10 border-l-4 border-l-purple-500 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center transition">
                                    <div><p className="font-black text-lg text-white drop-shadow-sm mb-1">{title}</p>{isInvite && linkedEvent && <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest bg-orange-500/10 border border-orange-500/20 inline-block px-2 py-1 rounded mb-2">Target Event: {linkedEvent.title}</p>}<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">From: {req.sender?.name || req.team?.leader?.name || "Captain"}</p>{req.message && <p className="text-xs text-gray-500 mt-2 bg-black/20 p-2 rounded-lg border border-white/5">"{req.message}"</p>}</div>
                                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                        <button onClick={() => respondToRequest(req._id, 'ACCEPT')} className="flex-1 sm:flex-none bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 flex items-center justify-center gap-1.5 transition active:scale-95"><Check size={14}/> Accept</button>
                                        <button onClick={() => respondToRequest(req._id, 'REJECT')} className="flex-1 sm:flex-none bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 flex items-center justify-center gap-1.5 transition active:scale-95"><X size={14}/> Reject</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                 )}
             </div>
          </div>
      )}

      <TicketModal isOpen={showTicketModal} onClose={() => setShowTicketModal(false)} ticketData={ticketData} />

      {chatOpen && chatRecipient && (
          <ChatBox recipientId={chatRecipient._id} recipientName={chatRecipient.name} isGroup={isGroupChat} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
};

export default Dashboard;