import React, { useState } from 'react';
import { Sparkles, MessageSquare, Send, Loader2 } from 'lucide-react';
import { getAiSummary, chatWithAiData } from '../api'; 

const AIInsights = ({ eventId }) => {
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const fetchSummary = async () => {
    if (!eventId) return alert("Please select an event first!");
    
    setIsSummaryLoading(true);
    setSummary(''); 
    
    try {
      const res = await getAiSummary(eventId); // Axios call
      if (res.data.success) {
        setSummary(res.data.summary);
      } else {
        setSummary('❌ Failed to generate summary. Please try again.');
      }
    } catch (error) {
      console.error("Summary Error:", error);
      
      if (error.response && error.response.status === 429) {
          setSummary('⏳ AI is resting! You are asking too fast. Please wait 1 minute before generating again.');
      } else {
          setSummary('❌ Server error. Check backend console or network tab.');
      }
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatQuery.trim() || !eventId) return;

    const newChat = [...chatHistory, { role: 'user', text: chatQuery }];
    setChatHistory(newChat);
    setChatQuery('');
    setIsChatLoading(true);

    try {
      const res = await chatWithAiData({ eventId, question: chatQuery }); // Axios call

      if (res.data.success) {
        setChatHistory([...newChat, { role: 'ai', text: res.data.answer }]);
      } else {
        setChatHistory([...newChat, { role: 'ai', text: '❌ Error getting answer.' }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      
      if (error.response && error.response.status === 429) {
          setChatHistory([...newChat, { role: 'ai', text: '⏳ AI needs a breather! Too many requests. Please wait 1 minute.' }]);
      } else {
          setChatHistory([...newChat, { role: 'ai', text: '❌ Server error while chatting.' }]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 border-t-white/20 p-6 md:p-8 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/10 transition-all duration-300">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-l-4 border-orange-500 pl-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Sparkles size={20} className="text-orange-400" /> AI Event Copilot
          </h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">
            Smart Data Analysis & Predictions
          </p>
        </div>
        
        <button 
          onClick={fetchSummary}
          disabled={isSummaryLoading}
          className="bg-orange-500/10 border border-orange-500/30 text-orange-400 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500/20 transition-all active:scale-95 shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto justify-center"
        >
          {isSummaryLoading ? (
             <><Loader2 size={14} className="animate-spin" /> Analyzing...</>
          ) : (
             <><Sparkles size={14} /> Generate Insights</>
          )}
        </button>
      </div>

      {/* --- SUMMARY SKELETON --- */}
      {isSummaryLoading && (
        <div className="animate-pulse space-y-4 p-5 bg-black/20 rounded-2xl border border-white/5 mb-6">
          <div className="h-3 bg-orange-500/20 rounded-full w-3/4"></div>
          <div className="h-3 bg-white/10 rounded-full w-full"></div>
          <div className="h-3 bg-white/10 rounded-full w-5/6"></div>
        </div>
      )}

      {/* --- SUMMARY CONTENT --- */}
      {summary && !isSummaryLoading && (
        <div className={`p-6 bg-black/20 border rounded-2xl mb-8 shadow-[inset_0_1px_5px_rgba(0,0,0,0.5)] ${summary.includes('⏳') ? 'border-amber-500/40 text-amber-300' : 'border-orange-500/20'}`}>
          {summary.split('\n\n').map((paragraph, index) => (
            <p key={index} className={`text-sm font-medium leading-relaxed mb-4 last:mb-0 ${summary.includes('⏳') ? 'text-amber-300' : 'text-gray-300'}`}>
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {/* --- CHAT SECTION --- */}
      <div className="border-t border-white/10 pt-6 mt-4">
        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <MessageSquare size={14} className="text-orange-400" /> Ask AI about your data
        </h3>

        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="space-y-4 mb-5 max-h-60 overflow-y-auto pr-2 dark-scroll">
            {chatHistory.map((chat, index) => (
              <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3.5 rounded-2xl max-w-[85%] sm:max-w-[75%] text-xs font-medium leading-relaxed shadow-md ${
                  chat.role === 'user' 
                    ? 'bg-orange-500/20 border border-orange-500/30 text-orange-50 rounded-br-sm' 
                    : chat.text.includes('⏳') 
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-bl-sm' 
                        : 'bg-white/5 border border-white/10 text-gray-300 rounded-bl-sm'
                }`}>
                  {chat.text}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="p-3.5 bg-white/5 border border-white/10 text-gray-400 rounded-2xl rounded-bl-sm text-xs animate-pulse flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-orange-400" /> AI is thinking...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Input - FIX APPLIED HERE */}
        <form onSubmit={handleChatSubmit} className="flex gap-2 w-full items-center">
          <input 
            type="text" 
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            placeholder="E.g., What was the total revenue?" 
            className="flex-1 w-full min-w-0 bg-black/40 border border-white/10 rounded-xl px-3 sm:px-4 py-3 text-white focus:border-orange-500/50 outline-none font-medium text-xs sm:text-sm placeholder-gray-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] transition-all"
          />
          <button 
            type="submit" 
            disabled={isChatLoading || !chatQuery.trim()}
            className="shrink-0 bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 sm:px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 transition-all flex items-center gap-2 active:scale-95"
          >
            <span className="hidden sm:inline">Ask</span> <Send size={14} className="text-orange-400" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default AIInsights;