import React, { useEffect, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { verifyTicket } from '../api'; 
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { XCircle, CheckCircle, LogOut, ArrowLeft } from 'lucide-react'; 

const ScannerPage = () => {
  const [scanResult, setScanResult] = useState(null); 
  const [scanData, setScanData] = useState(null);
  const [message, setMessage] = useState("Awaiting Scan...");
  const [pauseScan, setPauseScan] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation(); 


  const eventName = location.state?.eventName || "General Entry";
  const currentEventId = location.state?.eventId; 

  // 1. SECURITY CHECK
  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    
    if (!token || (role !== 'gatekeeper' && role !== 'organizer')) {
        toast.error("Unauthorized Access!");
        navigate('/'); 
    }

    if (!currentEventId) {
        toast.error("⚠️ Error: Event ID Missing. Please select event again.");
        navigate('/gatekeeper-dashboard');
    }
  }, [navigate, currentEventId]);

  // 2. SCAN HANDLER
  const handleScan = async (detectedCodes) => {
    if (pauseScan) return; 

    const rawValue = detectedCodes?.[0]?.rawValue;
    if (!rawValue) return;

    console.log("Sending Data:", { qrData: rawValue, eventId: currentEventId });

    setPauseScan(true); 
    setMessage("Verifying Ticket...");

    try {
        const res = await verifyTicket({ 
            qrData: rawValue, 
            eventId: currentEventId 
        });

        // ✅ Success Case
        setScanResult('success');
        setMessage("Entry Granted");
        setScanData(res.data.student);
        
        new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3').play().catch(()=>{});
        toast.success("Welcome!");

    } catch (error) {
        // ❌ Error Case
        const errMsg = error.response?.data?.message || "Invalid Ticket";
        console.error("Scan Error:", errMsg);

        setScanResult('error'); 
        setMessage(errMsg);
        setScanData(null);

        new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/assets/sound/explosion.mp3').play().catch(()=>{});
        
        if (errMsg.includes("Already")) {
            toast.error("⚠️ ALREADY USED");
        } else if (errMsg.includes("Wrong Event")) {
            toast.error("⛔ WRONG EVENT TICKET");
        } else {
            toast.error("❌ " + errMsg);
        }
    }

    // 3. Resume after 3 seconds
    setTimeout(() => {
        setScanResult(null); 
        setScanData(null);
        setMessage("Ready for next...");
        setPauseScan(false);
    }, 3000);
  };

  const handleError = (error) => {
    console.error("Scanner Error:", error);
  };

  // Dynamic Neon Glows for the Glass Box
  let glowStyle = "border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]";
  let messageColor = "text-orange-400";
  
  if (scanResult === 'success') {
      glowStyle = "border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)]";
      messageColor = "text-emerald-400";
  } else if (scanResult === 'error') {
      glowStyle = "border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)]";
      messageColor = "text-red-500";
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center p-4 relative font-sans text-gray-100 selection:bg-orange-500/30 overflow-hidden z-10">
      
      {/* Background Subtle Overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none -z-10"></div>

      {/* Glass Top Controls */}
      <div className="w-full max-w-sm flex justify-between items-center mt-2 z-50">
          <button onClick={() => navigate('/gatekeeper-dashboard')} className="bg-black/50 border border-white/10 p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-black/70 backdrop-blur-xl transition-all active:scale-95 shadow-lg">
            <ArrowLeft size={20} />
          </button>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl text-red-400 hover:bg-red-500/30 backdrop-blur-xl transition-all active:scale-95 shadow-lg">
            <LogOut size={20} />
          </button>
      </div>

      {/* Header */}
      <div className="mt-8 mb-8 text-center px-4">

        <div className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-md border border-orange-500/30 text-orange-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div> 
            Scanner Active
        </div>
        <h2 className="text-3xl font-black text-white leading-tight uppercase tracking-tight drop-shadow-md break-words max-w-sm">{eventName}</h2>
      </div>

      {/* Scanner Box */}
      <div className={`relative w-full max-w-sm aspect-square bg-black/60 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden border-2 transition-all duration-500 ease-out z-10 ${glowStyle}`}>
        <Scanner 
            onScan={handleScan}
            onError={handleError}
            paused={pauseScan}
            components={{ finder: true, audio: false, torch: true }}
            styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
        />
        
        {/* Result Overlay Inside Scanner */}
        {scanResult && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md transition-all animate-in zoom-in-95 duration-300 z-20`}>
                {scanResult === 'success' ? (
                    <div className="bg-emerald-500/20 p-5 rounded-full mb-4 animate-bounce border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                        <CheckCircle size={60} className="text-emerald-400" />
                    </div>
                ) : (
                    <div className="bg-red-500/20 p-5 rounded-full mb-4 animate-pulse border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                        <XCircle size={60} className="text-red-500" />
                    </div>
                )}
                <h2 className={`text-3xl font-black uppercase tracking-widest ${scanResult === 'success' ? 'text-emerald-400' : 'text-red-500'}`}>
                    {scanResult === 'success' ? "GRANTED" : "DENIED"}
                </h2>
            </div>
        )}
      </div>

      {/* Info Card */}
      <div className={`mt-8 w-full max-w-sm bg-black/50 backdrop-blur-2xl rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10 transition-all transform duration-300 z-10 ${scanResult ? 'scale-105 border-white/30' : ''}`}>
        <p className={`text-xl font-black uppercase tracking-widest text-center transition-colors drop-shadow-md ${messageColor}`}>
            {message}
        </p>

        {scanData && (
            <div className="bg-black/40 p-5 rounded-2xl text-left border-l-4 border-l-emerald-500 mt-5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-2">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Participant Name</p>
                <p className="text-2xl font-black text-white mb-4 drop-shadow-sm">{scanData.name}</p>
                
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                    <div>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Department</p>
                        <p className="text-sm font-bold text-gray-200">{scanData.department}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Year</p>
                        <p className="text-sm font-bold text-gray-200">{scanData.year}</p>
                    </div>
                </div>
            </div>
        )}
        
        {!scanData && !scanResult && (
             <div className="text-center mt-3">
                 <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">Point camera at QR code</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default ScannerPage;