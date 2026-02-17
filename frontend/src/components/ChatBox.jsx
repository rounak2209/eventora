import React, { useState, useEffect, useContext, useRef } from 'react';
import { X, Send, Loader2, Users, Check, CheckCheck } from 'lucide-react'; // 🔥 Icons Import
import axios from 'axios';
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

    // 1. Join Rooms (User & Group)
    useEffect(() => {
        if (socket && isGroup) {
            socket.emit("join_team", recipientId);
        }
    }, [socket, isGroup, recipientId]);

    // 2. Load History & Emit Read
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/chat/history/${recipientId}?isGroup=${isGroup}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(res.data);
                setLoading(false);

                // 🔥 Agar 1-on-1 chat hai aur messages hain, toh "Mark as Read" bhejo
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

    // 3. Real-time Listeners
    useEffect(() => {
        if (!socket) return;
        
        // A. Handle New Message
        const handleReceive = (msg) => {
            const isRelevant = isGroup 
                ? msg.recipient === recipientId 
                : (msg.sender._id === recipientId || msg.sender === recipientId || msg.sender === myId);

            if (isRelevant) {
                setMessages((prev) => {
                    if (prev.length > 0 && prev[prev.length - 1]._id === msg._id) return prev;
                    
                    // Agar chat khuli hai aur samne wale ne message bheja, toh turant Read mark karo
                    if (!isGroup && msg.sender._id === recipientId) {
                        socket.emit("mark_as_read", { senderId: recipientId, recipientId: myId });
                    }
                    return [...prev, msg];
                });
            }
        };

        // B. 🔥 Handle "Blue Tick" Update
        // Jab samne wala mera message padh le
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

    // Scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Send Message
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msgData = {
            sender: myId,
            recipient: recipientId,
            content: newMessage,
            isGroup: isGroup,
            read: false, // Default Unread
            timestamp: new Date()
        };

        socket.emit("send_message", msgData);

        // Optimistic UI Update (Only for 1-on-1 to show sending tick immediately)
        if (!isGroup) {
             setMessages((prev) => [...prev, { ...msgData, sender: { _id: myId } }]);
        }
        
        setNewMessage("");
    };

    return (
        <div className="fixed bottom-4 right-4 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className={`p-4 flex justify-between items-center text-white ${isGroup ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">
                        {isGroup ? <Users size={16}/> : recipientName?.[0]?.toUpperCase()}
                    </div>
                    <h3 className="font-bold text-sm">{recipientName} {isGroup && "(Group)"}</h3>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-lg transition"><X size={18}/></button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto h-80 bg-gray-50 flex flex-col gap-3">
                {loading ? (
                    <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-indigo-500"/></div>
                ) : messages.length === 0 ? (
                    <p className="text-center text-gray-400 text-xs mt-10">Start the conversation!</p>
                ) : (
                    messages.map((msg, idx) => {
                        const senderId = msg.sender?._id || msg.sender;
                        const isMe = String(senderId) === String(myId);
                        
                        return (
                            <div key={idx} ref={scrollRef} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {isGroup && !isMe && (
                                    <span className="text-[10px] text-gray-500 mb-1 ml-1">
                                        {msg.sender?.name || "Member"}
                                    </span>
                                )}
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none shadow-sm border border-gray-200'}`}>
                                    {msg.content}
                                </div>
                                
                                {/* 🔥 TICKS LOGIC (Only for 1-on-1 and My Messages) */}
                                {isMe && !isGroup && (
                                    <span className="text-[10px] mt-1 mr-1 flex justify-end">
                                        {msg.read ? (
                                            <CheckCheck size={14} className="text-blue-500" /> // Blue Tick
                                        ) : (
                                            <Check size={14} className="text-gray-400" /> // Gray Tick
                                        )}
                                    </span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-3 bg-white border-t flex gap-2">
                <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className={`text-white p-2 rounded-xl transition ${isGroup ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}><Send size={18}/></button>
            </form>
        </div>
    );
};

export default ChatBox;