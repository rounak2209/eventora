import React, { useState, useEffect, useContext } from 'react';
import { getMyTeam, getFinderUsers, sendInvite } from '../api'; 
import { toast } from 'react-hot-toast';
import { Search, Send, Users, Loader2, GraduationCap, AlertCircle, MessageCircle, X, CheckCircle, UserCheck } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import ChatBox from '../components/ChatBox';

const Finder = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const eventIdFromUrl = queryParams.get('eventId');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // 🔥 NEW: Store all teams where user is Leader
  const [leaderTeams, setLeaderTeams] = useState([]); 
  
  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch My Teams
        try {
            const teamRes = await getMyTeam();
            const teams = Array.isArray(teamRes.data) ? teamRes.data : (teamRes.data ? [teamRes.data] : []);
            
            const myId = user?._id || user?.id;
            // Filter teams where I am the leader
            const myLedTeams = teams.filter(t => String(t.leader?._id || t.leader) === String(myId));
            setLeaderTeams(myLedTeams);

        } catch (err) {
            console.log("User has no team yet.");
        }

        // 2. Fetch Users
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

  // Step 1: Open Modal when Invite clicked
  const handleInviteClick = (student) => {
      if (leaderTeams.length === 0) {
          toast.error("You need to create a Team first!");
          return;
      }
      setSelectedStudent(student);
      setShowInviteModal(true);
  };

  // Step 2: Send Invite after selecting Team/Event
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
          toast.error("Create a team first to start chatting!");
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
    <div className="bg-[#f8fafc] min-h-screen relative">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Find Teammates 🤝</h1>
            <p className="text-gray-500 font-medium">Discover talented students looking for a team.</p>
          </div>
          
          <div className="flex gap-3 items-center flex-wrap">
            {leaderTeams.length === 0 && !loading && (
               <Link to="/student-dashboard" className="text-sm text-red-600 font-bold bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 flex items-center gap-2 border border-red-100 transition-colors">
                 <AlertCircle size={16}/> Create Team First
               </Link>
            )}

            <div className="relative group w-full md:w-auto">
              <Search className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search skills, name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full md:w-80 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64 text-blue-600">
            <Loader2 size={48} className="animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <div key={student._id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 relative group flex flex-col justify-between h-full">
                  
                  <div>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-200">
                          {student.name ? student.name[0].toUpperCase() : "U"}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 leading-tight">{student.name}</h3>
                          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">
                            <GraduationCap size={14} /> {student.department || 'General'} • {student.year || 'N/A'} Year
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-6 line-clamp-3 italic bg-gray-50 p-3 rounded-xl border border-gray-100">
                        "{student.bio || "No bio added yet. Ready to hack!"}"
                      </p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {student.skills?.slice(0, 4).map((skill, i) => (
                          <span key={i} className="bg-blue-50 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg border border-blue-100">
                            {skill}
                          </span>
                        ))}
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                      <button 
                        onClick={() => openChat(student)}
                        disabled={leaderTeams.length === 0} 
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition ${leaderTeams.length === 0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                      >
                          <MessageCircle size={18} /> Chat
                      </button>
                      
                      <button 
                        onClick={() => handleInviteClick(student)}
                        disabled={leaderTeams.length === 0}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold border transition ${leaderTeams.length === 0 ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
                      >
                        <Send size={18} /> Invite
                      </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-600">No students found</h3>
              </div>
            )}
          </div>
        )}

        {/* 🔥 INVITE SELECTION MODAL WITH VALIDATION */}
        {showInviteModal && selectedStudent && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in">
                <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md relative scale-100 animate-in zoom-in-95">
                    <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24}/></button>
                    
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Select Team</h3>
                    <p className="text-gray-500 mb-6 text-sm">Which team do you want to invite <b>{selectedStudent.name}</b> to?</p>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {leaderTeams.map(team => {
                            // 🔥 Check if student is already in THIS specific team
                            const isAlreadyInTeam = team.members.some(m => String(m._id || m) === String(selectedStudent._id));

                            return (
                            <button 
                                key={team._id} 
                                onClick={() => !isAlreadyInTeam && confirmInvite(team)}
                                disabled={isAlreadyInTeam}
                                className={`w-full text-left p-4 rounded-2xl border transition-all group flex justify-between items-center ${
                                    isAlreadyInTeam 
                                    ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60' 
                                    : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                                }`}
                            >
                                <div>
                                    <p className={`font-bold ${isAlreadyInTeam ? 'text-gray-500' : 'text-gray-800 group-hover:text-indigo-700'}`}>
                                        {team.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Event: {team.event?.title || "Unknown Event"}</p>
                                </div>
                                
                                {isAlreadyInTeam ? (
                                    <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded flex items-center gap-1">
                                        <CheckCircle size={12}/> Added
                                    </span>
                                ) : (
                                    <Send size={18} className="text-gray-300 group-hover:text-indigo-500"/>
                                )}
                            </button>
                        )})}
                    </div>
                </div>
            </div>
        )}

        {chatOpen && chatRecipient && (
            <ChatBox 
                recipientId={chatRecipient._id} 
                recipientName={chatRecipient.name} 
                onClose={() => setChatOpen(false)} 
            />
        )}
      </div>
    </div>
  );
};

export default Finder;