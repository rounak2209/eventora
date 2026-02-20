import React, { useState, useEffect, useContext } from 'react';
import { 
  getEvents, getMyTeam, getMyRequests, bookTicket, 
  createTeam, joinTeam, deleteTeam, leaveTeam, 
  removeMember, handleRequest, getMyConversations 
} from '../api'; 
import { toast } from 'react-hot-toast';
import { 
  Calendar, Users, Bell, QrCode, LogOut, Trash2, 
  Plus, ArrowRight, Check, X, MapPin, User, History, Settings,
  Search, UserPlus, Copy, MessageCircle 
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
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');

  // 🔥 Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState(null);
  const [isGroupChat, setIsGroupChat] = useState(false); // New Flag for Group Chat

  useEffect(() => {
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

  // --- HELPER FUNCTIONS ---
  const isRegistered = (event) => {
    const myId = user?._id || user?.id;
    return event.participants?.some(p => String(p._id || p) === String(myId));
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
  
  // 🔥 CHAT HANDLERS
  const openChat = (recipientId, recipientName) => {
      setChatRecipient({ _id: recipientId, name: recipientName });
      setIsGroupChat(false); // 1-on-1 Chat
      setChatOpen(true);
  };
  const openGroupChat = (team) => {
      setChatRecipient({ _id: team._id, name: `${team.name} Squad` });
      setIsGroupChat(true); // Group Chat
      setChatOpen(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-indigo-600">Syncing Hub...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen relative">
      
      {/* TOPBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Hello, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 font-medium">Ready for your next challenge?</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border overflow-x-auto max-w-full">
           <button onClick={() => navigate('/finder')} className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-2"><Search size={14} /> Find Talent</button>
           {['events', 'my_hub', 'inbox', 'profile'].map((tab) => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}>{tab.replace('_', ' ').toUpperCase()}</button>
           ))}
        </div>
      </div>

      {/* EVENTS TAB */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => {
            const hasTicket = isRegistered(event);
            const myTeam = myTeams.find(t => t.event?._id === event._id);
            const hasTeam = !!myTeam;
            const isLeader = hasTeam && String(myTeam.leader?._id || myTeam.leader) === String(user?._id || user?.id);
            return (
              <div key={event._id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative group hover:shadow-xl transition-all duration-300">
                <div className={`absolute top-6 right-6 text-[10px] font-black uppercase px-3 py-1 rounded-full ${event.isTeamEvent ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{event.isTeamEvent ? 'Team' : 'Solo'}</div>
                <h3 className="text-xl font-black text-gray-900 mb-4 pr-12 leading-tight">{event.title}</h3>
                <div className="space-y-2 mb-6"><div className="flex items-center text-gray-500 text-xs font-bold uppercase tracking-wider"><Calendar size={14} className="mr-2 text-indigo-500"/> {new Date(event.date).toDateString()}</div><div className="flex items-center text-gray-500 text-xs font-bold uppercase tracking-wider"><MapPin size={14} className="mr-2 text-indigo-500"/> {event.venue}</div></div>
                {hasTicket ? <button onClick={() => handleShowTicket(event, myTeam)} className="w-full bg-green-50 text-green-700 border border-green-200 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2">✓ TICKET CONFIRMED (View QR)</button> : hasTeam ? ( isLeader ? <div className="space-y-3"><div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 text-center"><p className="text-xs text-purple-700 font-bold mb-2">Team Ready: {myTeam.name}</p><button onClick={() => handleBookTicket(event._id)} className="w-full bg-purple-600 text-white py-3 rounded-xl font-black shadow-lg hover:bg-purple-700 transition">Finalize Team Entry (Get QRs) 🎟️</button></div></div> : <div className="bg-yellow-50 p-4 rounded-xl text-center border border-yellow-100"><p className="text-yellow-700 font-bold text-sm">Waiting for Leader to Book</p></div> ) : ( event.isTeamEvent ? <div className="space-y-3">{createTeamData.eventId === event._id ? <form onSubmit={handleCreateTeam} className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100"><input type="text" placeholder="Squad Name..." className="w-full text-sm p-3 border rounded-xl mb-3 focus:ring-2 focus:ring-indigo-500 outline-none" value={createTeamData.name} onChange={e => setCreateTeamData({...createTeamData, name: e.target.value})} required/><div className="flex gap-2"><button className="bg-indigo-600 text-white text-xs py-2.5 rounded-xl font-bold flex-1">Create</button><button type="button" onClick={() => setCreateTeamData({ name: '', eventId: '' })} className="bg-white text-gray-500 text-xs py-2.5 rounded-xl font-bold border">Cancel</button></div></form> : <button onClick={() => setCreateTeamData({...createTeamData, eventId: event._id})} className="w-full bg-black text-white py-3 rounded-2xl font-black text-sm hover:scale-[1.02] transition">Create Team</button>}<div className="flex gap-2"><input type="text" placeholder="Join Code" className="bg-gray-100 border rounded-2xl px-4 text-sm flex-1 uppercase font-bold outline-none" value={joinCode[event._id] || ''} onChange={(e) => setJoinCode({...joinCode, [event._id]: e.target.value})}/><button onClick={() => handleJoinByCode(event._id)} className="bg-indigo-100 hover:bg-indigo-200 p-3 rounded-2xl text-indigo-700 transition-all"><ArrowRight size={18}/></button></div></div> : <button onClick={() => handleBookTicket(event._id)} className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] transition">Register Solo</button> )}
              </div>
            )
          })}
        </div>
      )}

      {/* --- 🔥 MY HUB TAB (FIXED: Added Solo Events + Group Chat + 1-on-1 Chat) --- */}
      {activeTab === 'my_hub' && (
        <div className="space-y-12">
            
            {/* 🔥 NEW SECTION: MY SOLO EVENTS */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3"><div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><User size={20}/></div><h2 className="text-2xl font-black text-gray-800">My Solo Events</h2></div>
                </div>
                {events.filter(e => !e.isTeamEvent && isRegistered(e)).length === 0 ? (
                    <div className="p-12 bg-white rounded-3xl border border-dashed text-center text-gray-400 font-medium">No solo events joined yet.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.filter(e => !e.isTeamEvent && isRegistered(e)).map(event => (
                            <div key={event._id} className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-md transition">
                                <button onClick={() => handleShowTicket(event, null)} className="absolute top-6 right-6 bg-black text-white p-3 rounded-2xl hover:scale-110 transition duration-300">
                                    <QrCode size={20}/>
                                </button>
                                
                                <div className="mb-4 pr-12">
                                    <h3 className="text-xl font-black text-gray-900 leading-tight">{event.title}</h3>
                                    <span className="inline-block mt-2 text-[10px] font-black uppercase px-2 py-1 rounded bg-green-100 text-green-700">Solo Participant</span>
                                </div>
                                
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center text-gray-500 text-xs font-bold uppercase tracking-wider"><Calendar size={14} className="mr-2 text-blue-500"/> {new Date(event.date).toDateString()}</div>
                                    <div className="flex items-center text-gray-500 text-xs font-bold uppercase tracking-wider"><MapPin size={14} className="mr-2 text-blue-500"/> {event.venue}</div>
                                </div>

                                <button onClick={() => handleShowTicket(event, null)} className="w-full bg-blue-50 text-blue-600 border border-blue-200 py-3 rounded-xl font-black text-sm hover:bg-blue-100 transition flex justify-center items-center gap-2">
                                    <QrCode size={16}/> View Event Ticket
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* MY SQUADS SECTION */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3"><div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Users size={20}/></div><h2 className="text-2xl font-black text-gray-800">My Squads</h2></div>
                </div>
                {myTeams.length === 0 ? <div className="p-12 bg-white rounded-3xl border border-dashed text-center text-gray-400 font-medium">No teams joined.</div> : 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myTeams.map(team => {
                        const isLeader = String(team.leader?._id || team.leader) === String(user?._id || user?.id);
                        const fullEvent = events.find(e => e._id === (team.event?._id || team.event));
                        const hasTicket = fullEvent && isRegistered(fullEvent);

                        return (
                        <div key={team._id} className="bg-white p-6 rounded-3xl shadow-sm border border-purple-100 relative overflow-hidden group hover:shadow-md transition">
                            {hasTicket && <button onClick={() => handleShowTicket(fullEvent, team)} className="absolute top-6 right-6 bg-black text-white p-3 rounded-2xl hover:scale-110 transition duration-300"><QrCode size={20}/></button>}
                            
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 leading-tight">{team.name}</h3>
                                    <p className="text-sm text-indigo-600 font-bold mb-6">{fullEvent?.title || "Event Details Loading..."}</p>
                                </div>
                                {/* 🔥 GROUP CHAT BUTTON ADDED */}
                                <button 
                                    onClick={() => openGroupChat(team)} 
                                    className="bg-purple-100 text-purple-600 p-2 rounded-xl hover:bg-purple-200 transition flex items-center gap-2 text-xs font-bold mt-14"
                                >
                                    <MessageCircle size={16}/> Group Chat
                                </button>
                            </div>
                            
                            {!hasTicket && isLeader && <div className="bg-red-50 p-4 rounded-2xl mb-4 border border-red-100 text-center"><p className="text-red-600 text-xs font-bold mb-2">⚠️ Entry Not Finalized Yet!</p><button onClick={() => handleBookTicket(fullEvent?._id)} className="w-full bg-red-500 text-white py-2 rounded-xl font-black text-xs hover:bg-red-600">BOOK TICKETS NOW</button></div>}

                            <div className="bg-indigo-50 p-4 rounded-2xl mb-6 flex justify-between items-center border border-indigo-100">
                                <div><p className="text-[10px] text-indigo-400 uppercase font-black mb-1">Squad Code</p><div className="flex items-center gap-2"><p className="font-mono text-xl font-black tracking-widest text-indigo-900 select-all">{team.code}</p><button onClick={() => { navigator.clipboard.writeText(team.code); toast.success("Code Copied!"); }} className="text-indigo-400 hover:text-indigo-600"><Copy size={16}/></button></div></div>
                                {isLeader ? <button onClick={() => handleDeleteTeam(team._id)} className="bg-white text-red-500 p-2.5 rounded-xl shadow-sm border border-gray-100 hover:bg-red-50 transition"><Trash2 size={18}/></button> : <button onClick={() => handleLeaveTeam(team._id)} className="bg-white text-red-500 p-2.5 rounded-xl shadow-sm border border-gray-100 hover:bg-red-50 transition"><LogOut size={18}/></button>}
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1"><p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Members</p>{isLeader && <button onClick={() => navigate(`/finder?eventId=${fullEvent?._id}`)} className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition"><UserPlus size={14}/> Add Member</button>}</div>
                                {team.members?.map(m => {
                                    // Don't show 1-on-1 chat button for myself
                                    const isMe = String(m._id) === String(user?._id || user?.id);
                                    return (
                                    <div key={m._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <span className="text-sm font-bold text-gray-700 flex items-center">
                                            {m.name} {String(team.leader?._id || team.leader) === String(m._id) && <Check size={14} className="ml-2 text-indigo-500"/>}
                                        </span>
                                        {/* 🔥 1-ON-1 CHAT BUTTON */}
                                        {!isMe && (
                                            <button 
                                                onClick={() => openChat(m._id, m.name)} 
                                                className="text-gray-400 hover:text-indigo-600 transition"
                                                title="Chat"
                                            >
                                                <MessageCircle size={16}/>
                                            </button>
                                        )}
                                    </div>
                                )})}
                            </div>
                        </div>
                    )})}
                 </div>
                }
            </section>
        </div>
      )}

      {/* --- 🔥 INBOX TAB (FIXED: Leader Name) --- */}
      {activeTab === 'inbox' && (
          <div className="max-w-3xl mx-auto">
             
             {/* 1. MESSAGES */}
             <div className="mb-10">
                 <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                     <MessageCircle className="text-blue-600"/> Messages (From Leaders)
                 </h2>
                 {conversations.length === 0 ? (
                    <div className="bg-white p-6 rounded-2xl border border-dashed text-center text-gray-400 text-sm">No recent messages.</div>
                 ) : (
                    <div className="grid gap-3">
                        {conversations.map(chat => (
                            <div key={chat._id} onClick={() => openChat(chat._id, chat.name)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">{chat.name[0]}</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">
                                            {chat.name} 
                                            {chat.teamName && <span className="text-xs font-normal text-indigo-600 ml-1">of team {chat.teamName}</span>}
                                        </h3>
                                        <p className="text-xs text-gray-500 truncate w-64">{chat.lastMessage}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-lg">
                                    {new Date(chat.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        ))}
                    </div>
                 )}
             </div>

             {/* 2. OFFICIAL INVITES */}
             <div>
                 <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                     <Bell className="text-purple-600"/> Official Team Invites
                 </h2>
                 {requests.length === 0 ? (
                    <div className="bg-white p-6 rounded-2xl border border-dashed text-center text-gray-400 text-sm">No pending invites.</div>
                 ) : (
                    <div className="space-y-4">
                        {requests.map(req => {
                            const isInvite = req.type === 'INVITE';
                            const title = isInvite ? `Team Invite: ${req.team?.name}` : `Join Request: ${req.user?.name}`;
                            const eventId = req.team?.event?._id || req.team?.event;
                            const linkedEvent = events.find(e => e._id === eventId);

                            return (
                                <div key={req._id} className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-purple-500 flex justify-between items-center">
                                    <div>
                                        <p className="font-black text-lg text-gray-900">{title}</p>
                                        
                                        {isInvite && linkedEvent && (
                                            <p className="text-xs font-bold text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded mb-1">
                                                Target Event: {linkedEvent.title}
                                            </p>
                                        )}

                                        {/* 🔥 FIX: Try req.sender.name first, then team.leader.name */}
                                        <p className="text-sm text-gray-500">
                                            From Leader: {req.sender?.name || req.team?.leader?.name || "Team Captain"}
                                        </p>
                                        
                                        {req.message && <p className="text-xs text-gray-400 mt-1 italic">"{req.message}"</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => respondToRequest(req._id, 'ACCEPT')} className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold hover:bg-green-200 flex items-center gap-2"><Check size={16}/> Accept</button>
                                        <button onClick={() => respondToRequest(req._id, 'REJECT')} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100 flex items-center gap-2"><X size={16}/> Reject</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                 )}
             </div>
          </div>
      )}

      {/* --- PROFILE TAB --- */}
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

      {/* 🔥 CHAT BOX RENDER */}
      {chatOpen && chatRecipient && (
          <ChatBox 
              recipientId={chatRecipient._id} 
              recipientName={chatRecipient.name} 
              isGroup={isGroupChat} // 🔥 Updated prop to handle Group/1-on-1 logic
              onClose={() => setChatOpen(false)} 
          />
      )}
    </div>
  );
};

export default Dashboard;