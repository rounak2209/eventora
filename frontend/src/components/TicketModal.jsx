import React from 'react';
import { QRCodeCanvas } from 'qrcode.react'; 
import { X, MapPin, Calendar, ShieldCheck } from 'lucide-react';

const TicketModal = ({ isOpen, onClose, ticketData }) => {
  // Agar modal open nahi hai ya data nahi mila to kuch mat dikhao
  if (!isOpen || !ticketData) return null;

  const { event, user, team } = ticketData;

  // 🆔 ID Normalization (Safety check)
  const userId = user?._id || user?.id;
  const eventId = event?._id || event?.id;
  const teamId = team?._id || team?.id || null;

  // 🔥 QR Payload: Ye wahi data hai jo Scanner scan karega
  const qrPayload = JSON.stringify({
    userId: userId,
    eventId: eventId,
    teamId: teamId, 
    type: "GATE_PASS"
  });

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in zoom-in duration-200">
        
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-6 right-6 bg-white/20 p-2 rounded-full text-white hover:bg-white/40 z-10 transition-colors"
        >
          <X size={20}/>
        </button>
        
        {/* Header Gradient */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white text-center">
          <div className="text-[10px] font-black tracking-[0.2em] uppercase mb-2 opacity-80">Official Entry Pass</div>
          <h2 className="text-2xl font-black uppercase leading-tight mb-1">{event?.title || "Event Pass"}</h2>
          <div className="flex justify-center items-center gap-2 text-indigo-100 text-xs font-bold">
            <Calendar size={12}/> {event?.date ? new Date(event.date).toDateString() : "Date TBD"}
          </div>
        </div>

        <div className="p-8">
            {/* User Info */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl border-2 border-indigo-100 uppercase">
                    {user?.name?.charAt(0) || "P"}
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Participant</p>
                    <h3 className="text-xl font-black text-gray-800 leading-tight">{user?.name || "Attendee"}</h3>
                    {team ? (
                        <p className="text-xs text-indigo-500 font-bold">Squad: {team.name}</p>
                    ) : (
                        <p className="text-xs text-green-600 font-bold">Solo Entry</p>
                    )}
                </div>
            </div>

            {/* QR Section */}
            <div className="flex flex-col items-center bg-gray-50 rounded-3xl p-6 border-2 border-dashed border-gray-200">
                <div className="bg-white p-4 rounded-2xl shadow-inner mb-4">
                    <QRCodeCanvas 
                        value={qrPayload} 
                        size={160} 
                        level={"H"} // High Error Correction (Scans faster)
                        includeMargin={false}
                    />
                </div>
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider">
                    <ShieldCheck size={14}/> Verified Ticket
                </div>
            </div>

            {/* Venue Info */}
            <div className="mt-8 flex items-center gap-3 text-gray-500 px-2">
                <MapPin size={18} className="text-indigo-500"/>
                <p className="text-xs font-bold uppercase tracking-tight">{event?.venue || "Main Campus Hall"}</p>
            </div>
        </div>

        {/* Footer ID Section */}
        <div className="bg-gray-900 text-white p-5 flex justify-between items-center px-8">
            <div>
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Ticket ID</p>
                <p className="font-mono text-xs font-bold text-indigo-400">
                    {userId ? userId.slice(-8).toUpperCase() : "TEMP-ID"}
                </p>
            </div>
            <div className="h-8 w-px bg-gray-800"></div>
            <div className="text-right">
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Access</p>
                <p className="text-xs font-black uppercase">{team ? 'SQUAD' : 'SOLO'}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;