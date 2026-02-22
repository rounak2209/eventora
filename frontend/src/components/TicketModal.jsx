import React from 'react';
import { QRCodeCanvas } from 'qrcode.react'; 
import { X, MapPin, Calendar, ShieldCheck } from 'lucide-react';

const TicketModal = ({ isOpen, onClose, ticketData }) => {
  if (!isOpen || !ticketData) return null;

  const { event, user, team } = ticketData;

  const userId = user?._id || user?.id;
  const eventId = event?._id || event?.id;
  const teamId = team?._id || team?.id || null;

  const qrPayload = JSON.stringify({
    userId: userId,
    eventId: eventId,
    teamId: teamId, 
    type: "GATE_PASS"
  });

  return (
    // 🔥 FIX: 'items-start' aur 'pt-24' (Padding Top) laga diya hai. Ab ye zindagi mein upar nahi ghusega!
    <div className="fixed inset-0 bg-black/90 z-[999] backdrop-blur-xl overflow-y-auto flex justify-center items-start pt-24 pb-12 px-4">
      
      {/* Box ke margin ko 'mb-auto' kiya taaki naturally set ho */}
      <div className="w-full max-w-[320px] mb-auto flex flex-col bg-[#0a0a0a]/95 backdrop-blur-3xl saturate-150 rounded-[2rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.9)] border border-white/10 relative animate-in zoom-in-95 duration-300">
        
        {/* Glow Effects */}
        <div className="absolute top-[-30%] left-[-30%] w-56 h-56 bg-orange-600/20 rounded-full blur-[70px] pointer-events-none"></div>
        <div className="absolute bottom-[-30%] right-[-30%] w-56 h-56 bg-amber-600/10 rounded-full blur-[70px] pointer-events-none"></div>

        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 bg-black/40 border border-white/10 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 z-20 transition-all active:scale-95"
        >
          <X size={18}/>
        </button>
        
        {/* Header Gradient */}
        <div className="bg-gradient-to-br from-orange-500/20 to-amber-600/10 border-b border-white/5 p-5 text-white text-center relative shrink-0 pt-6">
          <div className="text-[8px] font-black tracking-[0.25em] text-orange-400 uppercase mb-1.5 drop-shadow-sm">Official Entry Pass</div>
          <h2 className="text-lg font-black uppercase leading-tight mb-1 text-white drop-shadow-md truncate px-4">{event?.title || "Event Pass"}</h2>
          <div className="flex justify-center items-center gap-1.5 text-gray-300 text-[10px] font-bold uppercase tracking-wider">
            <Calendar size={12} className="text-orange-400"/> {event?.date ? new Date(event.date).toDateString() : "Date TBD"}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 relative flex-1">
            {/* User Info */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-amber-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-[0_0_15px_rgba(245,158,11,0.4)] uppercase shrink-0">
                    {user?.name?.charAt(0) || "P"}
                </div>
                <div className="overflow-hidden">
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">Participant</p>
                    <h3 className="text-base font-black text-white leading-tight drop-shadow-sm truncate">{user?.name || "Attendee"}</h3>
                    {team ? (
                        <p className="text-[9px] font-black uppercase tracking-wider text-orange-400 mt-0.5 truncate">
                          SQUAD: {team.name}
                        </p>
                    ) : (
                        <p className="text-[9px] font-black uppercase tracking-wider text-green-400 mt-0.5">
                          Solo Entry
                        </p>
                    )}
                </div>
            </div>

            {/* QR Section */}
            <div className="flex flex-col items-center mt-1">
                <div className="bg-white p-2.5 rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.15)] mb-3 relative z-10">
                    <QRCodeCanvas 
                        value={qrPayload} 
                        size={130}
                        level={"H"} 
                        includeMargin={false}
                        className="rounded-lg"
                    />
                </div>
                <div className="flex items-center gap-1.5 text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-wider shadow-sm relative z-10">
                    <ShieldCheck size={14}/> Verified Ticket
                </div>
            </div>

            {/* Venue Info */}
            <div className="mt-4 flex items-center gap-2.5 text-gray-300 px-3 bg-white/5 p-2 rounded-xl border border-white/5 relative z-10">
                <MapPin size={14} className="text-orange-400 shrink-0"/>
                <p className="text-[10px] font-bold uppercase tracking-wide truncate">{event?.venue || "Main Campus Hall"}</p>
            </div>
        </div>

        {/* Footer ID Section */}
        <div className="bg-black/80 text-white p-3 flex justify-between items-center px-5 border-t border-white/5 relative z-10 shrink-0">
            <div>
                <p className="text-[7px] text-gray-600 font-black uppercase tracking-widest mb-0.5">Ticket ID</p>
                <p className="font-mono text-[10px] font-black tracking-widest text-orange-400">
                    {userId ? userId.slice(-8).toUpperCase() : "TEMP-ID"}
                </p>
            </div>
            <div className="h-5 w-px bg-white/10"></div>
            <div className="text-right">
                <p className="text-[7px] text-gray-600 font-black uppercase tracking-widest mb-0.5">Access Type</p>
                <p className={`text-[10px] font-black uppercase tracking-widest ${team ? 'text-purple-400' : 'text-green-400'}`}>
                  {team ? 'SQUAD' : 'SOLO'}
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;