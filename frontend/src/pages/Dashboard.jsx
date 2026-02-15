import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Calendar, Users, Bell, QrCode, LogOut, Trash2, 
  Plus, ArrowRight, Check, X, MapPin, User, History, Settings,
  Search, UserPlus, Copy
} from 'lucide-react';
import AuthContext from '../context/AuthContext';
import TicketModal from '../components/TicketModal'; 
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState('events'); 
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  // --- DATA STATE ---
  const [events, setEvents] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [requests, setRequests] = useState([]);

  // --- MODAL STATE ---
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketData, setTicketData] = useState(null);

  // --- FORMS STATE ---
  const [createTeamData, setCreateTeamData] = useState({ name: '', desc: '', eventId: '' });
  const [joinCode, setJoinCode] = useState({});
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');

  // 🔄 FETCH ALL DATA
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [eRes, tRes, rRes] = await Promise.all([
            axios.get('http://localhost:5000/api/events', config).catch(() => ({ data: [] })),
            axios.get('http://localhost:5000/api/teams/my-team', config).catch(() => ({ data: [] })),
            axios.get('http://localhost:5000/api/finder/my-requests', config).catch(() => ({ data: [] }))
        ]);

        setEvents(eRes.data || []);
        const teamsData = tRes.data;
        setMyTeams(Array.isArray(teamsData) ? teamsData : teamsData ? [teamsData] : []);
        setRequests(rRes.data || []);
        
        if (user) {
            setSkills(user.skills?.join(', ') || '');
            setBio(user.bio || '');
        }
        setLoading(false);
      } catch (error) {
        console.error("Fetch Error", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [user, refreshTrigger]);

  const refresh = () => setRefreshTrigger(p => p + 1);

  // 🛡️ SYNC HELPER: Check if ticket exists in DB (via Event Participants)
  const isRegistered = (event) => {
    const myId = user?._id || user?.id;
    return event.participants?.some(p => String(p._id || p) === String(myId));
  };

  // --- ACTIONS ---

  // 🔥 NEW: Generic Book Ticket Function (Solo OR Team)
  const handleBookTicket = async (eventId) => {
    const tid = toast.loading("Finalizing Booking...");
    try {
        const token = localStorage.getItem('token');
        
        // Agar Team Event hai aur Team bani hui hai, to Team ID bhejo
        // Taaki backend us team ko link kar sake
        const myTeam = myTeams.find(t => t.event?._id === eventId);
        
        await axios.post('http://localhost:5000/api/ticket/book', { 
            eventId,
            teamId: myTeam ? myTeam._id : null 
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        toast.dismiss(tid); 
        toast.success("Ticket Confirmed & Emailed! 🎉");
        refresh(); 
        setActiveTab('my_hub');
    } catch (err) {
        toast.dismiss(tid);
        toast.error(err.response?.data?.message || "Booking Failed");
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/teams/create', { 
          name: createTeamData.name, eventId: createTeamData.eventId 
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Team Created! Now Finalize Entry.");
      setCreateTeamData({ name: '', desc: '', eventId: '' });
      refresh(); 
      // Stay on 'events' tab so they can see "Finalize" button
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const handleJoinByCode = async (eventId) => {
    const code = joinCode[eventId];
    if (!code) return toast.error("Enter Code");
    try {
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:5000/api/teams/join', { teamCode: code, eventId }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Joined Successfully!");
        refresh(); setActiveTab('my_hub');
    } catch (err) { toast.error(err.response?.data?.message || "Invalid Code"); }
  };

  const handleDeleteTeam = async (teamId) => {
    if(!window.confirm("Delete Team?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5000/api/teams/delete', { headers: { Authorization: `Bearer ${token}` }, data: { teamId } });
      toast.success("Deleted"); refresh();
    } catch (error) { toast.error("Failed"); }
  };

  const handleLeaveTeam = async (teamId) => {
    if(!window.confirm("Leave this team?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/teams/leave', { teamId }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Left Team"); refresh();
    } catch (error) { toast.error("Failed"); }
  };

  const handleRemoveMember = async (teamId, memberId) => {
    if(!window.confirm("Remove member?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/teams/remove-member', { teamId, memberId }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Removed"); refresh();
    } catch (error) { toast.error("Failed"); }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/finder/handle', { requestId, action }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${action}ed!`); refresh();
    } catch (error) { toast.error("Error processing request"); }
  };

  const handleShowTicket = (event, team = null) => {
      setTicketData({ event, user, team });
      setShowTicketModal(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-indigo-600">Syncing Hub...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      
      {/* --- TOPBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Hello, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 font-medium">Ready for your next challenge?</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border overflow-x-auto max-w-full">
           <button 
             onClick={() => navigate('/finder')} 
             className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-2"
           >
             <Search size={14} /> Find Talent
           </button>

           {['events', 'my_hub', 'inbox', 'profile'].map((tab) => (
             <button 
                key={tab}
                onClick={() => setActiveTab(tab)} 
                className={`px-5 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}
             >
               {tab.replace('_', ' ').toUpperCase()}
             </button>
           ))}
        </div>
      </div>

      {/* --- TAB CONTENT --- */}
      
      {/* 1. EVENTS MARKETPLACE (🔥 UPDATED LOGIC) */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => {
            const hasTicket = isRegistered(event);
            const myTeam = myTeams.find(t => t.event?._id === event._id);
            const hasTeam = !!myTeam;
            const isLeader = hasTeam && String(myTeam.leader) === String(user?._id);

            return (
              <div key={event._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative group hover:shadow-xl transition-all duration-300">
                <div className={`absolute top-6 right-6 text-[10px] font-black uppercase px-3 py-1 rounded-full ${event.isTeamEvent ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                    {event.isTeamEvent ? 'Team' : 'Solo'}
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-4 pr-12 leading-tight">{event.title}</h3>
                
                <div className="space-y-2 mb-6">
                    <div className="flex items-center text-gray-500 text-xs font-bold uppercase tracking-wider"><Calendar size={14} className="mr-2 text-indigo-500"/> {new Date(event.date).toDateString()}</div>
                    <div className="flex items-center text-gray-500 text-xs font-bold uppercase tracking-wider"><MapPin size={14} className="mr-2 text-indigo-500"/> {event.venue}</div>
                </div>

                {/* 🔥 LOGIC SWITCH: Ticket > Team > Create */}
                {hasTicket ? (
                    <button onClick={() => handleShowTicket(event, myTeam)} className="w-full bg-green-50 text-green-700 border border-green-200 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2">
                        ✓ TICKET CONFIRMED (View QR)
                    </button>
                ) : hasTeam ? (
                    // Team hai, Ticket nahi -> Show Book Button
                    isLeader ? (
                        <div className="space-y-3">
                            <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 text-center">
                                <p className="text-xs text-purple-700 font-bold mb-2">Team Ready: {myTeam.name}</p>
                                <button onClick={() => handleBookTicket(event._id)} className="w-full bg-purple-600 text-white py-3 rounded-xl font-black shadow-lg hover:bg-purple-700 transition">
                                    Finalize Team Entry (Get QRs) 🎟️
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 p-4 rounded-xl text-center border border-yellow-100">
                            <p className="text-yellow-700 font-bold text-sm">Waiting for Leader to Book</p>
                            <p className="text-[10px] text-yellow-600 mt-1">Leader: {myTeam.leader?.name || 'Unknown'}</p>
                        </div>
                    )
                ) : (
                    // No Team, No Ticket -> Show Create/Join/Solo
                    event.isTeamEvent ? (
                        <div className="space-y-3">
                             {createTeamData.eventId === event._id ? (
                                 <form onSubmit={handleCreateTeam} className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                                     <input type="text" placeholder="Squad Name..." className="w-full text-sm p-3 border rounded-xl mb-3 focus:ring-2 focus:ring-indigo-500 outline-none" value={createTeamData.name} onChange={e => setCreateTeamData({...createTeamData, name: e.target.value})} required/>
                                     <div className="flex gap-2">
                                        <button className="bg-indigo-600 text-white text-xs py-2.5 rounded-xl font-bold flex-1">Create</button>
                                        <button type="button" onClick={() => setCreateTeamData({ name: '', eventId: '' })} className="bg-white text-gray-500 text-xs py-2.5 rounded-xl font-bold border">Cancel</button>
                                     </div>
                                 </form>
                             ) : (
                                <button onClick={() => setCreateTeamData({...createTeamData, eventId: event._id})} className="w-full bg-black text-white py-3 rounded-2xl font-black text-sm hover:scale-[1.02] transition">Create Team</button>
                             )}
                             <div className="flex gap-2">
                                <input type="text" placeholder="Join Code" className="bg-gray-100 border rounded-2xl px-4 text-sm flex-1 uppercase font-bold outline-none" value={joinCode[event._id] || ''} onChange={(e) => setJoinCode({...joinCode, [event._id]: e.target.value})}/>
                                <button onClick={() => handleJoinByCode(event._id)} className="bg-indigo-100 hover:bg-indigo-200 p-3 rounded-2xl text-indigo-700 transition-all"><ArrowRight size={18}/></button>
                             </div>
                        </div>
                    ) : (
                        <button onClick={() => handleBookTicket(event._id)} className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] transition">Register Solo</button>
                    )
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 2. MY HUB */}
      {activeTab === 'my_hub' && (
        <div className="space-y-12">
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Users size={20}/></div>
                        <h2 className="text-2xl font-black text-gray-800">My Squads</h2>
                    </div>
                    <button onClick={() => navigate('/finder')} className="text-xs font-bold text-indigo-600 hover:underline md:hidden">+ Add Member</button>
                </div>

                {myTeams.length === 0 ? <div className="p-12 bg-white rounded-3xl border border-dashed text-center text-gray-400 font-medium">No teams joined.</div> : 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myTeams.map(team => {
                        const isLeader = String(team.leader) === String(user?._id);
                        // Check if ticket is booked for this specific team's event
                        const fullEvent = events.find(e => e._id === team.event?._id);
                        const hasTicket = fullEvent && isRegistered(fullEvent);

                        return (
                        <div key={team._id} className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100 relative overflow-hidden group hover:shadow-md transition">
                            
                            {/* QR Button (Only if booked) */}
                            {hasTicket && (
                                <button onClick={() => handleShowTicket(team.event, team)} className="absolute top-6 right-6 bg-black text-white p-3 rounded-2xl hover:scale-110 transition duration-300">
                                    <QrCode size={20}/>
                                </button>
                            )}

                            <h3 className="text-xl font-black text-gray-900 leading-tight">{team.name}</h3>
                            <p className="text-sm text-indigo-600 font-bold mb-6">{team.event?.title}</p>
                            
                            {/* 🔥 FINALIZATION ALERT (If Team exists but no ticket) */}
                            {!hasTicket && isLeader && (
                                <div className="bg-red-50 p-4 rounded-2xl mb-4 border border-red-100 text-center">
                                    <p className="text-red-600 text-xs font-bold mb-2">⚠️ Entry Not Finalized Yet!</p>
                                    <button onClick={() => handleBookTicket(team.event?._id)} className="w-full bg-red-500 text-white py-2 rounded-xl font-black text-xs hover:bg-red-600">
                                        BOOK TICKETS NOW
                                    </button>
                                </div>
                            )}

                            <div className="bg-indigo-50 p-4 rounded-2xl mb-6 flex justify-between items-center border border-indigo-100">
                                <div>
                                    <p className="text-[10px] text-indigo-400 uppercase font-black mb-1">Squad Code</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-mono text-xl font-black tracking-widest text-indigo-900 select-all">{team.code}</p>
                                        <button onClick={() => { navigator.clipboard.writeText(team.code); toast.success("Code Copied!"); }} className="text-indigo-400 hover:text-indigo-600"><Copy size={16}/></button>
                                    </div>
                                </div>
                                {isLeader ? 
                                    <button onClick={() => handleDeleteTeam(team._id)} className="bg-white text-red-500 p-2.5 rounded-xl shadow-sm border border-gray-100 hover:bg-red-50 transition"><Trash2 size={18}/></button> :
                                    <button onClick={() => handleLeaveTeam(team._id)} className="bg-white text-red-500 p-2.5 rounded-xl shadow-sm border border-gray-100 hover:bg-red-50 transition"><LogOut size={18}/></button>
                                }
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Members</p>
                                    {isLeader && (
                                        <button onClick={() => navigate(`/finder?eventId=${team.event?._id}`)} className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition">
                                            <UserPlus size={14}/> Add Member
                                        </button>
                                    )}
                                </div>
                                {team.members?.map(m => (
                                    <div key={m._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <span className="text-sm font-bold text-gray-700 flex items-center">
                                            {m.name} {String(team.leader) === String(m._id) && <Check size={14} className="ml-2 text-indigo-500"/>}
                                        </span>
                                        {isLeader && String(m._id) !== String(user?._id) && (
                                            <button onClick={() => handleRemoveMember(team._id, m._id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg"><X size={16}/></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )})}
                 </div>
                }
            </section>

            {/* SOLO SECTION */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg"><User size={20}/></div>
                    <h2 className="text-2xl font-black text-gray-800">Solo Tickets</h2>
                </div>
                {events.filter(e => !e.isTeamEvent && isRegistered(e)).length === 0 ? 
                 <div className="p-12 bg-white rounded-3xl border border-dashed text-center text-gray-400 font-medium">No solo registrations found.</div> : 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.filter(e => !e.isTeamEvent && isRegistered(e)).map(event => (
                        <div key={event._id} className="bg-white p-5 rounded-3xl shadow-sm border border-green-100 flex justify-between items-center group">
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center font-black">
                                    {event.title.charAt(0)}
                                 </div>
                                 <div>
                                     <h3 className="text-lg font-black text-gray-900 leading-none">{event.title}</h3>
                                     <p className="text-xs text-green-600 font-bold uppercase tracking-tighter mt-1">Confirmed Pass</p>
                                 </div>
                             </div>
                             <button onClick={() => handleShowTicket(event)} className="bg-gray-100 group-hover:bg-black group-hover:text-white p-4 rounded-2xl transition-all duration-300"><QrCode size={20}/></button>
                        </div>
                    ))}
                 </div>
                }
            </section>
        </div>
      )}

      {/* 3. INBOX */}
      {activeTab === 'inbox' && (
          <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><Bell size={20}/></div>
                <h2 className="text-2xl font-black text-gray-800">Notifications</h2>
              </div>
              {requests.length === 0 ? <div className="bg-white p-12 rounded-3xl text-center text-gray-400 font-bold border border-dashed">Inbox is empty.</div> : (
                  <div className="space-y-4">
                      {requests.map(req => {
                          const isInvite = req.type === 'INVITE';
                          const title = isInvite ? `Team Invite: ${req.team?.name}` : `Join Request: ${req.user?.name}`;
                          const subText = isInvite ? `They want you to join their squad.` : `Skill: ${req.user?.skills?.[0] || 'Student'}`;

                          return (
                          <div key={req._id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${isInvite ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                      {isInvite ? 'T' : 'U'}
                                  </div>
                                  <div>
                                      <p className="font-black text-gray-900 text-lg leading-tight">{title}</p>
                                      <p className="text-sm text-gray-500 font-medium">{subText}</p>
                                      {req.message && <p className="text-xs text-gray-400 mt-1 italic">"{req.message}"</p>}
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => respondToRequest(req._id, 'ACCEPT')} className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-500 hover:text-white transition-all shadow-sm border border-green-100"><Check size={20}/></button>
                                  <button onClick={() => respondToRequest(req._id, 'REJECT')} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"><X size={20}/></button>
                              </div>
                          </div>
                      )})}
                  </div>
              )}
          </div>
      )}

      {/* 4. PROFILE */}
      {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
             <h2 className="text-2xl font-black mb-8">Account Settings</h2>
             <div className="space-y-6">
                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label><div className="p-4 bg-gray-50 rounded-2xl font-bold text-gray-800 border">{user?.name}</div></div>
                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label><div className="p-4 bg-gray-50 rounded-2xl font-bold text-gray-800 border">{user?.email}</div></div>
                <div className="pt-4 border-t"><button onClick={() => toast.error("Profile editing coming soon!")} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2">Update Information</button></div>
             </div>
          </div>
      )}

      <TicketModal isOpen={showTicketModal} onClose={() => setShowTicketModal(false)} ticketData={ticketData} />
    </div>
  );
};

export default Dashboard;