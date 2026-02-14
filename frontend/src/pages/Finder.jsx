import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Search, Send, Users, Loader2, GraduationCap, AlertCircle } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import { useLocation, Link, useNavigate } from 'react-router-dom';

const Finder = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // 1. URL se Event ID nikalo (Dynamic)
  const queryParams = new URLSearchParams(location.search);
  const eventIdFromUrl = queryParams.get('eventId');

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [myTeamId, setMyTeamId] = useState(null); // Store my team ID
  const [myTeamEventId, setMyTeamEventId] = useState(null); // Store my team's event ID

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        setLoading(true);

        // 2. Load My Team First (to know context)
        // Note: Assuming endpoint returns array of teams or single team object. Adjust based on your API.
        let teamId = null;
        let eventId = eventIdFromUrl;

        try {
            const teamRes = await axios.get(`http://localhost:5000/api/teams/my-team`, config);
            const teams = Array.isArray(teamRes.data) ? teamRes.data : (teamRes.data ? [teamRes.data] : []);
            
            // Find team where I am leader
            const myId = user?._id || user?.id;
            const leaderTeam = teams.find(t => String(t.leader?._id || t.leader) === String(myId));

            if (leaderTeam) {
                setMyTeamId(leaderTeam._id);
                setMyTeamEventId(leaderTeam.event?._id || leaderTeam.event);
                teamId = leaderTeam._id;
                // Agar URL me eventId nahi hai, to meri team ka event ID use karo
                if (!eventId) eventId = leaderTeam.event?._id || leaderTeam.event;
            }
        } catch (err) {
            console.log("User has no team yet or error fetching team.");
        }

        // 3. Load Students (Pass eventId if available to filter relevant students)
        // Backend API should handle optional eventId
        const url = eventId 
            ? `http://localhost:5000/api/finder/students?eventId=${eventId}` 
            : `http://localhost:5000/api/finder/students`; 
            
        // Note: Agar backend '/finder/users' use kar raha hai to URL change kar lena
        // Assuming '/api/finder/students' or '/api/finder/users' works.
        // Let's use the one that works in your previous TeamFinder.jsx:
        const studentRes = await axios.get('http://localhost:5000/api/finder/users', config); 
        setStudents(studentRes.data);

      } catch (error) {
        console.error("Error loading finder data:", error);
        toast.error("Failed to load potential teammates.");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user, eventIdFromUrl]);

  // 🚀 REAL CONNECT REQUEST
  const sendConnectRequest = async (studentId) => {
    // Check 1: Kya user ke paas team hai?
    if (!myTeamId) {
      toast.error("You need to create a Team first! Go to Dashboard.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      toast.loading("Sending Invite...");

      await axios.post("http://localhost:5000/api/finder/invite", { // Updated endpoint from invite logic
        recipientId: studentId,
        teamId: myTeamId,
        message: "Hey! We'd love to have you in our team."
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.dismiss();
      toast.success("Invite Sent Successfully! 🚀");

    } catch (error) {
      toast.dismiss();
      const msg = error.response?.data?.message || "Failed to send invite.";
      toast.error(msg);
    }
  };

  // 🔍 Filter Logic
  const filteredStudents = students.filter(student => {
    if (!student) return false;
    const term = searchTerm.toLowerCase();
    // Exclude myself
    const myId = user?._id || user?.id;
    if (String(student._id) === String(myId)) return false;

    return (
        student.name?.toLowerCase().includes(term) || 
        student.department?.toLowerCase().includes(term) ||
        student.skills?.some(skill => skill.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Find Teammates 🤝</h1>
            <p className="text-gray-500 font-medium">
              {eventIdFromUrl || myTeamEventId 
                ? <span>Discover students for Event ID: <span className="font-mono text-blue-600">{(eventIdFromUrl || myTeamEventId).slice(-6)}...</span></span>
                : "Discover talented students looking for a team."
              }
            </p>
          </div>
          
          {/* Action Area */}
          <div className="flex gap-3 items-center flex-wrap">
            {/* Show "Create Team" warning if no team */}
            {!myTeamId && !loading && (
               <Link to="/dashboard" className="text-sm text-red-600 font-bold bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 flex items-center gap-2 border border-red-100 transition-colors">
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
                        {(!student.skills || student.skills.length === 0) && <span className="text-xs text-gray-400">No skills listed</span>}
                      </div>
                  </div>

                  <button 
                    onClick={() => sendConnectRequest(student._id)}
                    disabled={!myTeamId}
                    className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${!myTeamId ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-gray-200'}`}
                  >
                    <Send size={16} /> {myTeamId ? "Invite to Team" : "Create Team First"}
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-600">No students found</h3>
                <p className="text-gray-400 mt-2">Try changing filters or invite your friends!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Finder;