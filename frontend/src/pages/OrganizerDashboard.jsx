import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { User, Mail, Shield, Plus, X, Trash2, Download, Send, Award, CheckSquare, Square } from 'lucide-react'; // 👈 CheckSquare & Square added

const OrganizerDashboard = () => {
  const [events, setEvents] = useState([]); 
  const [selectedEventId, setSelectedEventId] = useState(''); 
  const [stats, setStats] = useState(null);
  const [gatekeepers, setGatekeepers] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Certificate Sending State
  const [sendingCerts, setSendingCerts] = useState(false);

  // Modal State
  const [showGatekeeperForm, setShowGatekeeperForm] = useState(false);
  
  // 🔥 UPDATED STATE: Added assignedEventIds array
  const [gkData, setGkData] = useState({ name: '', email: '', password: '', assignedEventIds: [] });
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // 1. Fetch Events & Gatekeepers on Load
  useEffect(() => {
    const initData = async () => {
      try {
        // Events fetch
        const eventRes = await axios.get('http://localhost:5000/api/events', config);
        setEvents(eventRes.data);
        if (eventRes.data.length > 0) {
           const sortedEvents = eventRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
           setSelectedEventId(sortedEvents[0]._id);
        } else {
            setLoading(false);
        }

        // Gatekeepers fetch
        const gkRes = await axios.get('http://localhost:5000/api/auth/gatekeepers', config);
        setGatekeepers(gkRes.data);

      } catch (err) {
        console.error("Error loading data:", err);
        setLoading(false);
      }
    };
    initData();
  }, []);

  // 2. Fetch Stats when Event Changes
  useEffect(() => {
    if (!selectedEventId) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/analytics/stats?eventId=${selectedEventId}`, config);
        setStats(res.data.stats);
        setLoading(false);
      } catch (err) { 
        console.error(err); 
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedEventId]);

  // Actions
  const handleDownload = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/analytics/download-report?eventId=${selectedEventId}`, {
        ...config,
        responseType: 'blob'
      });
      saveAs(new Blob([res.data], { type: 'application/pdf' }), 'Event_Report.pdf');
    } catch (err) {
      toast.error("Download Failed");
    }
  };

  const handleEmail = async () => {
    if(!window.confirm("Email report to yourself?")) return;
    try {
      await axios.post('http://localhost:5000/api/analytics/send-report', { eventId: selectedEventId }, config);
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
        const res = await axios.post('http://localhost:5000/api/certificate/issue-all', { eventId: selectedEventId }, config);
        toast.success(res.data.message, { id: toastId });
    } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to send certificates", { id: toastId });
    } finally {
        setSendingCerts(false);
    }
  };

  // 🔥 EVENT SELECTION LOGIC (Checkbox Toggle)
  const toggleEventSelection = (eventId) => {
    const currentIds = gkData.assignedEventIds;
    if (currentIds.includes(eventId)) {
        // Remove if exists
        setGkData({ ...gkData, assignedEventIds: currentIds.filter(id => id !== eventId) });
    } else {
        // Add if not exists
        setGkData({ ...gkData, assignedEventIds: [...currentIds, eventId] });
    }
  };

  // Create Gatekeeper
  const handleCreateGatekeeper = async (e) => {
    e.preventDefault();
    
    // Validation: At least one event must be selected
    if(gkData.assignedEventIds.length === 0) {
        return toast.error("Please assign at least one event!");
    }

    const toastId = toast.loading("Creating Gatekeeper & Sending Credentials... 📨");

    try {
      await axios.post('http://localhost:5000/api/auth/add-gatekeeper', gkData, config);
      toast.success(`Gatekeeper "${gkData.name}" created!`, { id: toastId });
      
      // Refresh List
      const gkRes = await axios.get('http://localhost:5000/api/auth/gatekeepers', config);
      setGatekeepers(gkRes.data);
      
      setShowGatekeeperForm(false);
      setGkData({ name: '', email: '', password: '', assignedEventIds: [] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create gatekeeper", { id: toastId });
    }
  };

  if (loading && !stats) return <div className="flex h-screen items-center justify-center text-xl font-bold text-gray-500">Loading Dashboard... ⏳</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Organizer Dashboard</h1>
          <p className="text-gray-500">Analytics & Security Management</p>
        </div>
        <button onClick={() => navigate('/create-event')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow flex items-center gap-2">
          <Plus size={18} /> Create Event
        </button>
      </div>

      {/* --- CONTROLS SECTION --- */}
      <div className="bg-white p-4 rounded-lg shadow mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
             <span className="font-bold text-gray-700">Select Event:</span>
             <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="border p-2 rounded w-full md:w-64 bg-gray-50">
               {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
             </select>
        </div>
        <div className="flex gap-2">
            <button onClick={handleDownload} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900">
                <Download size={16} /> PDF Report
            </button>
            <button onClick={handleEmail} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                <Send size={16} /> Email Me
            </button>
            <button 
                onClick={handleSendCertificates} 
                disabled={sendingCerts}
                className={`flex items-center gap-2 px-4 py-2 rounded text-white shadow transition-all ${sendingCerts ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600'}`}
            >
                <Award size={16} /> 
                {sendingCerts ? "Sending..." : "Send Certificates"}
            </button>
        </div>
      </div>

      {stats ? (
        <>
            {/* --- STATS CARDS --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-5 bg-white border border-gray-100 shadow rounded-xl">
                    <p className="text-sm text-gray-500 font-medium">Total Registrations</p>
                    <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                </div>
                <div className="p-5 bg-white border border-gray-100 shadow rounded-xl">
                    <p className="text-sm text-gray-500 font-medium">Checked In (Present)</p>
                    <p className="text-3xl font-bold text-green-600">{stats.present}</p>
                </div>
                <div className="p-5 bg-white border border-gray-100 shadow rounded-xl">
                    <p className="text-sm text-gray-500 font-medium">Pending (Absent)</p>
                    <p className="text-3xl font-bold text-red-500">{stats.absent}</p>
                </div>
                <div className="p-5 bg-white border border-gray-100 shadow rounded-xl">
                    <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold text-blue-600">₹{stats.total * 500}</p>
                </div>
            </div>

            {/* --- GRAPHS SECTION --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
                  <h3 className="text-lg font-bold mb-4 text-center text-gray-700">Department Breakdown</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(stats.departments || {}).map(([key, val]) => ({ name: key, count: val }))}>
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip cursor={{fill: '#f3f4f6'}} />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
                  <h3 className="text-lg font-bold mb-4 text-center text-gray-700">Gender Ratio</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={[
                          { name: 'Male', value: stats.male || 0 },
                          { name: 'Female', value: stats.female || 0 }
                        ]} 
                        cx="50%" cy="50%" 
                        innerRadius={60}
                        outerRadius={80} 
                        paddingAngle={5}
                        dataKey="value" 
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#ec4899" />
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
            </div>
        </>
      ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow mb-8">
              <p className="text-gray-500">Select an event to view analytics</p>
          </div>
      )}

      {/* --- GATEKEEPER MANAGEMENT --- */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Shield className="text-purple-600" /> Security Team (Gatekeepers)
            </h2>
            <button 
                onClick={() => setShowGatekeeperForm(true)} 
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition"
            >
                <Plus size={18} /> Add Gatekeeper
            </button>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gatekeepers.length > 0 ? (
                gatekeepers.map((gk) => (
                    <div key={gk._id} className="bg-white p-5 rounded-xl shadow border border-gray-100 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-3 rounded-full">
                                <User size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{gk.name}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Mail size={12} /> {gk.email}
                                </p>
                            </div>
                        </div>
                        
                        {/* 🔥 Display Assigned Events */}
                        <div className="mt-1 bg-gray-50 p-2 rounded text-xs text-gray-600 border border-gray-100">
                            <strong>Assigned Duties:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {gk.assignedEvents && gk.assignedEvents.length > 0 ? (
                                    gk.assignedEvents.map(ev => (
                                        <span key={ev._id} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                                            {ev.title}
                                        </span>
                                    ))
                                ) : <span className="text-red-400">No events assigned</span>}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="col-span-full text-center py-8 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
                    No gatekeepers added yet.
                </div>
            )}
        </div>
      </div>

      {/* --- POPUP MODAL (FORM) --- */}
      {showGatekeeperForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto scale-100 animate-in zoom-in-95 duration-200">
                <button 
                    onClick={() => setShowGatekeeperForm(false)} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-1 text-gray-800">Add New Gatekeeper</h2>
                <p className="text-sm text-gray-500 mb-6">Enter details and assign events for access.</p>

                <form onSubmit={handleCreateGatekeeper} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input 
                            type="text" required 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                            value={gkData.name}
                            onChange={e => setGkData({...gkData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Login ID)</label>
                        <input 
                            type="email" required 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                            value={gkData.email}
                            onChange={e => setGkData({...gkData, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input 
                            type="password" required 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none"
                            value={gkData.password}
                            onChange={e => setGkData({...gkData, password: e.target.value})}
                        />
                    </div>

                    {/* 🔥 EVENT SELECTION LIST (Checkboxes) */}
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Assign Events (Who can they scan?)</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {events.map((ev) => {
                                const isSelected = gkData.assignedEventIds.includes(ev._id);
                                return (
                                    <div 
                                        key={ev._id} 
                                        onClick={() => toggleEventSelection(ev._id)}
                                        className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition-all ${isSelected ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                                    >
                                        {isSelected ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} className="text-gray-400" />}
                                        <span className={`text-sm ${isSelected ? 'font-bold text-indigo-700' : 'text-gray-600'}`}>{ev.title}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-right">
                            {gkData.assignedEventIds.length} events selected
                        </p>
                    </div>
                    
                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow-lg flex justify-center items-center gap-2">
                         Create & Send Credentials <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default OrganizerDashboard;