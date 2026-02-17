import React, { useEffect, useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { verifyTicket } from '../api'; // 👈 New Import (api.js se)
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { XCircle, CheckCircle, LogOut, ArrowLeft } from 'lucide-react';

const ScannerPage = () => {
  const [scanResult, setScanResult] = useState(null); 
  const [scanData, setScanData] = useState(null);
  const [message, setMessage] = useState("Scan a Ticket");
  const [pauseScan, setPauseScan] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation(); 

  // Dashboard se Event Name aur ID uthao
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

    // Debugging
    console.log("Sending Data:", { qrData: rawValue, eventId: currentEventId });

    setPauseScan(true); 
    setMessage("Verifying...");

    try {
        // 🔥 OLD: axios.post('http://localhost:5000/...', { ... }, config);
        // ✅ NEW: Direct function call from api.js (Headers auto handled)
        const res = await verifyTicket({ 
            qrData: rawValue, 
            eventId: currentEventId 
        });

        // ✅ Success Case
        setScanResult('success');
        setMessage("Entry Granted ✅");
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

  // UI Colors
  let bgColor = "bg-gray-900"; 
  if (scanResult === 'success') bgColor = "bg-green-600";
  if (scanResult === 'error') bgColor = "bg-red-600";

  return (
    <div className={`min-h-screen flex flex-col items-center p-4 relative transition-colors duration-500 ease-in-out ${bgColor} text-white`}>
      
      <button onClick={() => navigate('/gatekeeper-dashboard')} className="absolute top-4 left-4 bg-black/40 p-2 rounded-full shadow-lg hover:bg-black/60 z-50 backdrop-blur-sm transition">
        <ArrowLeft size={20} />
      </button>

      <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="absolute top-4 right-4 bg-black/40 p-2 rounded-full shadow-lg hover:bg-black/60 z-50 backdrop-blur-sm transition">
        <LogOut size={20} />
      </button>

      <div className="mt-12 mb-6 text-center">
        <h1 className="text-xl font-bold text-gray-400 uppercase tracking-widest">SCANNING FOR</h1>
        <h2 className="text-3xl font-black text-yellow-400 mt-1 shadow-sm uppercase">{eventName}</h2>
      </div>

      <div className="relative w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl">
        <Scanner 
            onScan={handleScan}
            onError={handleError}
            paused={pauseScan}
            components={{ finder: true, audio: false, torch: true }}
            styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }}
        />
        
        {scanResult && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm transition-all animate-in fade-in duration-300`}>
                {scanResult === 'success' ? (
                    <CheckCircle size={80} className="text-green-500 mb-4 animate-bounce" />
                ) : (
                    <XCircle size={80} className="text-red-500 mb-4 animate-pulse" />
                )}
                <h2 className={`text-3xl font-black uppercase ${scanResult === 'success' ? 'text-green-400' : 'text-red-500'}`}>
                    {scanResult === 'success' ? "GRANTED" : "DENIED"}
                </h2>
            </div>
        )}
      </div>

      <div className={`mt-6 w-full max-w-sm bg-white rounded-xl p-6 shadow-xl text-center text-gray-800 transition-all transform ${scanResult ? 'scale-105' : ''}`}>
        <p className="text-xl font-bold mb-2">{message}</p>

        {scanData && (
            <div className="bg-gray-100 p-4 rounded-lg text-left border-l-4 border-indigo-500 mt-4">
                <p className="text-sm text-gray-500">NAME</p>
                <p className="text-lg font-bold text-gray-900">{scanData.name}</p>
                <div className="flex justify-between mt-2">
                    <div>
                        <p className="text-sm text-gray-500">DEPT</p>
                        <p className="font-semibold">{scanData.department}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">YEAR</p>
                        <p className="font-semibold">{scanData.year}</p>
                    </div>
                </div>
            </div>
        )}
        
        {!scanData && !scanResult && (
             <p className="text-sm text-gray-400 mt-2">Point camera at the ticket QR code</p>
        )}
      </div>
    </div>
  );
};

export default ScannerPage;