import React, { useState, useEffect, useContext, useRef } from 'react';
import { X, Send, Loader2, Users, Check, CheckCheck } from 'lucide-react'; 
import { getChatHistory } from '../api';
import AuthContext from '../context/AuthContext';
import SocketContext from '../context/SocketContext';

const ChatBox = ({ recipientId, recipientName, onClose, isGroup = false }) => {
    const { user } = useContext(AuthContext);
    const socket = useContext(SocketContext);
    
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef();

    const myId = user?._id || user?.id;
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (socket && isGroup) {
            socket.emit("join_team", recipientId);
        }
    }, [socket, isGroup, recipientId]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await getChatHistory(recipientId, isGroup);
                setMessages(res.data);
                setLoading(false);
                if (socket && !isGroup && res.data.length > 0) {
                    socket.emit("mark_as_read", { senderId: recipientId, recipientId: myId });
                }
            } catch (err) {
                console.error("Chat load error", err);
                setLoading(false);
            }
        };
        fetchHistory();
    }, [recipientId, token, isGroup, socket, myId]);

    useEffect(() => {
        if (!socket) return;
        
        const handleReceive = (msg) => {
            const isRelevant = isGroup 
                ? msg.recipient === recipientId 
                : (msg.sender._id === recipientId || msg.sender === recipientId || msg.sender === myId);

            if (isRelevant) {
                setMessages((prev) => {
                    if (prev.length > 0 && prev[prev.length - 1]._id === msg._id) return prev;
                    if (!isGroup && msg.sender._id === recipientId) {
                        socket.emit("mark_as_read", { senderId: recipientId, recipientId: myId });
                    }
                    return [...prev, msg];
                });
            }
        };

        const handleReadUpdate = ({ readBy }) => {
            if (!isGroup && readBy === recipientId) {
                setMessages(prev => prev.map(msg => 
                    msg.sender === myId || msg.sender?._id === myId ? { ...msg, read: true } : msg
                ));
            }
        };

        socket.on("receive_message", handleReceive);
        socket.on("messages_read_update", handleReadUpdate);

        return () => {
            socket.off("receive_message", handleReceive);
            socket.off("messages_read_update", handleReadUpdate);
        };
    }, [socket, recipientId, myId, isGroup]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;
        
        const msgData = {
            sender: myId,
            recipient: recipientId,
            content: newMessage,
            isGroup: isGroup,
            read: false,
            timestamp: new Date()
        };

        socket.emit("send_message", msgData);
        if (!isGroup) {
             setMessages((prev) => [...prev, { ...msgData, sender: { _id: myId } }]);
        }
        setNewMessage("");
    };

    return (
        // 🔥 EXPERT BUG FIX: Added `h-[28rem]` to permanently LOCK the outer box height.
        // Ye box ab kisi bhi haal mein stretch nahi hoga!
        <div className="fixed bottom-4 right-4 w-80 md:w-96 h-[28rem] bg-black/60 backdrop-blur-3xl saturate-150 border border-white/10 border-t-white/20 border-l-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
            
            {/* Header */}
            <div className={`p-4 flex justify-between items-center text-white border-b border-white/5 shrink-0 ${isGroup ? 'bg-purple-500/10' : 'bg-indigo-500/10'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 border rounded-xl flex items-center justify-center font-black shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] ${isGroup ? 'bg-purple-500/20 border-purple-500/30' : 'bg-indigo-500/20 border-indigo-500/30'}`}>
                        {isGroup ? <Users size={16} className="text-purple-300"/> : <span className="text-indigo-300 text-sm">{recipientName?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div>
                        <h3 className="font-bold text-sm drop-shadow-sm text-white leading-tight">{recipientName}</h3>
                        <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isGroup ? 'text-purple-300/80' : 'text-indigo-300/80'}`}>
                            {isGroup ? "Squad Chat" : "Direct Message"}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-all border border-transparent hover:border-white/10 active:scale-95">
                    <X size={18} className="text-gray-300 hover:text-white" />
                </button>
            </div>

            {/* 🔥 EXPERT BUG FIX: flex-1 ensures it fills space, overflow-y-auto enables scroll. */}
            <div className="flex-1 p-4 overflow-y-auto bg-transparent flex flex-col gap-3 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-indigo-400" size={24}/></div>
                ) : messages.length === 0 ? (
                    <div className="text-center mt-10">
                        <div className="bg-white/5 inline-block p-2 rounded-2xl border border-white/5 mb-2 shadow-inner">
                             <MessageCircle size={20} className="text-gray-400" />
                        </div>
                        <p className="text-gray-400 text-xs font-medium italic drop-shadow-sm">Break the ice!</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const senderId = msg.sender?._id || msg.sender;
                        const isMe = String(senderId) === String(myId);
                        
                        return (
                            <div key={idx} ref={scrollRef} className={`flex flex-col ${isMe ? 'items-end' : 'items-start animate-in slide-in-from-left-2'}`}>
                                {isGroup && !isMe && (
                                    <span className="text-[10px] text-indigo-300/80 font-black mb-1 ml-2 uppercase">
                                        {msg.sender?.name?.split(' ')[0] || "Member"}
                                    </span>
                                )}
                                <div className={`max-w-[85%] p-3 rounded-[1rem] text-sm shadow-md border backdrop-blur-md ${
                                    isMe 
                                    ? 'bg-indigo-500/20 text-indigo-50 border-indigo-500/30 rounded-br-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                                    : 'bg-white/5 text-gray-100 border-white/10 rounded-bl-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                                }`}>
                                    {msg.content}
                                </div>
                                
                                {isMe && !isGroup && (
                                    <div className="mt-1 flex items-center gap-1 mr-1">
                                        <span className="text-[9px] text-gray-500 font-bold">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {msg.read ? (
                                            <CheckCheck size={14} className="text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]" /> 
                                        ) : (
                                            <Check size={14} className="text-gray-600" /> 
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-3 bg-white/[0.02] border-t border-white/10 flex gap-2 backdrop-blur-md shrink-0">
                <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500/50 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] placeholder-gray-500 transition-all"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                    type="submit" 
                    className={`text-white p-2.5 rounded-xl transition-all active:scale-90 shadow-lg border shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${
                        isGroup 
                        ? 'bg-purple-600/70 hover:bg-purple-600 border-purple-500/30' 
                        : 'bg-indigo-600/70 hover:bg-indigo-600 border-indigo-500/30'
                    }`}
                >
                    <Send size={18} className={isGroup ? "text-purple-300" : "text-indigo-300"}/>
                </button>
            </form>
        </div>
    );
};

const MessageCircle = ({size, className}) => <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>;

export default ChatBox;