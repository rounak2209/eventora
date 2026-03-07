import React, { useState, useEffect, useContext } from 'react';
import { getMyTeam, getFinderUsers, sendInvite } from '../api'; 
import { toast } from 'react-hot-toast';
import { Search, Send, Users, Loader2, GraduationCap, AlertCircle, MessageCircle, X, CheckCircle, UserCheck } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import ChatBox from '../components/ChatBox';

const Finder = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const eventIdFromUrl = queryParams.get('eventId');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [leaderTeams, setLeaderTeams] = useState([]); 
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState(null);

  // Full screen image view ke liye
  const [fullscreenImage, setFullscreenImage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        try {
            const teamRes = await getMyTeam();
            const teams = Array.isArray(teamRes.data) ? teamRes.data : (teamRes.data ? [teamRes.data] : []);
            
            const myId = user?._id || user?.id;
            const myLedTeams = teams.filter(t => String(t.leader?._id || t.leader) === String(myId) && t.isOpen !== false);
            setLeaderTeams(myLedTeams);

        } catch (err) {
            console.log("User has no active open team.");
        }

        const studentRes = await getFinderUsers(); 
        setStudents(studentRes.data);

      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  const handleInviteClick = (student) => {
      if (leaderTeams.length === 0) {
          toast.error("You need an open, unfinalized team to invite members!");
          return;
      }
      setSelectedStudent(student);
      setShowInviteModal(true);
  };

  const confirmInvite = async (team) => {
    if (!selectedStudent || !team) return;

    const eventName = team.event?.title || "Upcoming Event";
    const toastId = toast.loading(`Inviting to ${team.name}...`);

    try {
      const msg = `Official Team Invite for event: "${eventName}"`;

      await sendInvite({
        recipientId: selectedStudent._id,
        teamId: team._id,
        message: msg 
      });

      toast.success("Invite Sent Successfully! 🚀", { id: toastId });
      setShowInviteModal(false);
      setSelectedStudent(null);

    } catch (error) {
      const msg = error.response?.data?.message || "Failed to send invite.";
      toast.error(msg, { id: toastId });
    }
  };

  const openChat = (student) => {
      if (leaderTeams.length === 0) {
          toast.error("Create an open team first to start chatting!");
          return;
      }
      setChatRecipient(student);
      setChatOpen(true);
  };

  const filteredStudents = students.filter(student => {
    if (!student) return false;
    const term = searchTerm.toLowerCase();
    const myId = user?._id || user?.id;
    if (String(student._id) === String(myId)) return false;

    return (
        student.name?.toLowerCase().includes(term) || 
        student.department?.toLowerCase().includes(term) ||
        student.skills?.some(skill => skill.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-transparent min-h-screen relative text-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Find Teammates </h1>
            <p className="text-gray-300 font-medium mt-1">Discover talented students looking for a team.</p>
          </div>
          
          {/* 🔥 FIX 5: Navbar styling exactly match kiya aur Profile add kiya */}
          <div className="flex bg-white/5 backdrop-blur-2xl p-1.5 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/10 overflow-x-auto max-w-full custom-scrollbar">
             <style>
              {` .custom-scrollbar::-webkit-scrollbar { height: 0px; } `}
             </style>
             <button className="px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all flex items-center gap-2 whitespace-nowrap">
               <Search size={14} /> Find Talent
             </button>
             {['events', 'my_hub', 'inbox'].map((tab) => (
               <button 
                 key={tab} 
                 onClick={() => navigate(`/student-dashboard?tab=${tab}`)} 
                 className="px-5 py-2 rounded-xl font-bold text-xs tracking-widest uppercase transition-all whitespace-nowrap text-gray-300 hover:bg-white/10 border border-transparent"
               >
                 {tab.replace('_', ' ')}
               </button>
             ))}
             <button onClick={() => navigate('/profile')} className="px-5 py-2 rounded-xl font-bold text-xs tracking-widest uppercase transition-all whitespace-nowrap text-gray-300 hover:bg-white/10 border border-transparent">PROFILE</button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-end items-center gap-4 mb-8">
            {leaderTeams.length === 0 && !loading && (
               <Link to="/student-dashboard?tab=events" className="text-sm text-red-400 font-bold bg-red-500/10 px-4 py-2 rounded-xl hover:bg-red-500/20 flex items-center gap-2 border border-red-500/20 transition-all backdrop-blur-md">
                 <AlertCircle size={16}/> Create an Open Team First
               </Link>
            )}

            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-orange-400 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search skills, name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 w-full bg-white/5 border border-white/10 border-t-white/20 text-white placeholder-gray-400 rounded-xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)] backdrop-blur-xl focus:ring-1 focus:ring-orange-500/50 outline-none transition-all"
              />
            </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 text-orange-400">
            <Loader2 size={48} className="animate-spin drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <div key={student._id} className="bg-white/5 backdrop-blur-2xl rounded-[2rem] p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/10 border-t-white/20 border-l-white/20 hover:bg-white/10 hover:border-white/30 transition-all duration-300 relative group flex flex-col justify-between h-full">
                  
                  <div>
                      <div className="flex items-center gap-4 mb-4">
                        {student.profilePic ? (
                            <img 
                                src={student.profilePic} 
                                alt={student.name} 
                                onClick={() => setFullscreenImage(student.profilePic)}
                                className="w-32 h-32 rounded-2xl object-cover border border-white/10 shadow-[0_0_15px_rgba(245,158,11,0.15)] shrink-0 cursor-pointer hover:scale-105 hover:opacity-90 transition-all" 
                            />
                        ) : (
                            <div className="w-32 h-32 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center font-black text-3xl shadow-[inset_0_0_15px_rgba(245,158,11,0.05)] shrink-0">
                              {student.name ? student.name[0].toUpperCase() : "U"}
                            </div>
                        )}
                        <div>
                          <h3 className="font-bold text-xl text-white leading-tight drop-shadow-md">{student.name}</h3>
                          <div className="flex items-center gap-2 text-gray-300 text-xs font-bold uppercase tracking-wider mt-1 drop-shadow-sm">
                            <GraduationCap size={14} className="text-orange-400" /> {student.department || 'General'} • {student.year || 'N/A'} Yr • {student.gender || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-6 line-clamp-3 italic drop-shadow-sm">
                        "{student.bio || "No bio added yet. Ready to hack!"}"
                      </p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {student.skills?.slice(0, 4).map((skill, i) => (
                          <span key={i} className="bg-white/5 text-gray-200 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                            {skill}
                          </span>
                        ))}
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                      <button 
                        onClick={() => openChat(student)}
                        disabled={leaderTeams.length === 0} 
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition duration-300 ${leaderTeams.length === 0 ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'}`}
                      >
                          <MessageCircle size={18} className={leaderTeams.length !== 0 ? "text-gray-300" : ""} /> Chat
                      </button>
                      
                      <button 
                        onClick={() => handleInviteClick(student)}
                        disabled={leaderTeams.length === 0}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition duration-300 ${
                          leaderTeams.length === 0 
                          ? 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed' 
                          : 'bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                        }`}
                      >
                        <Send size={18} /> Invite
                      </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-dashed border-white/20 shadow-2xl">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-300">No students found</h3>
              </div>
            )}
          </div>
        )}

        {/* INVITE MODAL */}
        {showInviteModal && selectedStudent && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex justify-center items-center z-50 animate-in fade-in">
                <div className="bg-[#12141a]/80 border border-white/10 border-t-white/20 p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative scale-100 animate-in zoom-in-95">
                    <button onClick={() => setShowInviteModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition"><X size={24}/></button>
                    
                    <h3 className="text-2xl font-black text-white mb-2">Select Team</h3>
                    <p className="text-gray-400 mb-8 text-sm">Which team do you want to invite <b className="text-orange-400">{selectedStudent.name}</b> to?</p>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {leaderTeams.map(team => {
                            const isAlreadyInTeam = team.members.some(m => String(m._id || m) === String(selectedStudent._id));

                            return (
                            <button 
                                key={team._id} 
                                onClick={() => !isAlreadyInTeam && confirmInvite(team)}
                                disabled={isAlreadyInTeam}
                                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group flex justify-between items-center ${
                                    isAlreadyInTeam 
                                    ? 'bg-white/5 border-white/5 cursor-not-allowed opacity-50' 
                                    : 'bg-white/5 border-white/10 hover:border-orange-500/50 hover:bg-orange-500/10'
                                }`}
                            >
                                <div>
                                    <p className={`font-bold ${isAlreadyInTeam ? 'text-gray-500' : 'text-gray-200 group-hover:text-white'}`}>
                                        {team.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Event: {team.event?.title || "Unknown Event"}</p>
                                </div>
                                
                                {isAlreadyInTeam ? (
                                    <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded flex items-center gap-1 border border-green-500/20">
                                        <CheckCircle size={12}/> Added
                                    </span>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                                       <Send size={14} className="text-gray-400 group-hover:text-orange-400"/>
                                    </div>
                                )}
                            </button>
                        )})}
                    </div>
                </div>
            </div>
        )}

        {/* CHAT BOX */}
        {chatOpen && chatRecipient && (
            <ChatBox 
                recipientId={chatRecipient._id} 
                recipientName={chatRecipient.name} 
                onClose={() => setChatOpen(false)} 
            />
        )}

        {/* FULLSCREEN IMAGE MODAL */}
        {fullscreenImage && (
            <div 
                className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
                onClick={() => setFullscreenImage(null)}
            >
                <div className="relative max-w-2xl w-full flex justify-center animate-in zoom-in-95 duration-300">
                    <button 
                        onClick={() => setFullscreenImage(null)} 
                        className="absolute -top-12 right-0 bg-white/10 p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/20 transition-all shadow-lg"
                    >
                        <X size={24} />
                    </button>
                    <img 
                        src={fullscreenImage} 
                        alt="Profile Full Size" 
                        className="max-w-full max-h-[85vh] rounded-[2rem] object-contain shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/20"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Finder;