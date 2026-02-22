import React, { useState } from 'react';
import { createEvent } from '../api'; // 🔥 Wapas api.js use kar rahe hain (No hardcoding)
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ImagePlus, Calendar as CalendarIcon, MapPin, Users, Tags, IndianRupee, Trophy, ArrowLeft, Send } from 'lucide-react'; 

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // 🔥 TERI ORIGINAL STATE (UNTOUCHED)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    venue: '',
    registrationDeadline: '',
    category: 'Tech',
    price: 0,
    maxSeats: 100,
    isTeamEvent: false,
    teamSizeMin: 1,
    teamSizeMax: 1
  });

  const [bannerFile, setBannerFile] = useState(null); 
  const [preview, setPreview] = useState(null); 

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setBannerFile(file);
        setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please login as Organizer first");
        return;
      }

      setLoading(true);
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        payload.append(key, formData[key]);
      });
      
      if (bannerFile) {
        payload.append('banner', bannerFile); // 🔥 Pack banner for api.js
      }

      const tid = toast.loading("Launching Event & Uploading Image... 🚀");
      
      // 🔥 EXPERT FIX: Seedha api.js call ho raha hai bina kisi hardcoding ke!
      await createEvent(payload);

      toast.dismiss(tid);
      toast.success("Event Created Successfully! 🎉");
      navigate('/organizer-dashboard'); 
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error(error.response?.data?.message || "Failed to create event");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-gray-100 min-h-screen font-sans selection:bg-orange-500/30 relative z-10">
      
      {/* Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      <div className="mb-8 text-center relative">
        <button 
             onClick={() => navigate('/organizer-dashboard')} 
             className="absolute left-0 top-2 bg-white/5 border border-white/10 p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-sm"
          >
             <ArrowLeft size={20} />
        </button>

        <div className="inline-flex items-center justify-center p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Trophy size={28} className="text-orange-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">Host a New Event</h1>
        <p className="text-gray-400 mt-2 font-medium">Fill in the details below to launch your event on Eventora.</p>
      </div>

      {/* Main Frosted Glass Card */}
      <div className="bg-black/40 backdrop-blur-3xl saturate-150 p-6 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 border-t-white/20">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="relative group">
            <label className="cursor-pointer border-2 border-dashed border-white/20 rounded-[1.5rem] p-4 flex flex-col items-center justify-center bg-white/[0.02] hover:bg-white/[0.05] hover:border-orange-500/50 transition-all overflow-hidden min-h-[200px] md:min-h-[250px]">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                
                {preview ? (
                    <div className="w-full flex justify-center">
                        <img src={preview} alt="Preview" className="max-h-[200px] md:max-h-[250px] w-auto object-contain rounded-xl" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm rounded-[1.5rem]">
                             <div className="bg-black/80 px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-2 border border-white/10 shadow-xl">
                                 <ImagePlus size={16}/> Change Image
                             </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-orange-500/10 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                            <ImagePlus size={32} className="text-orange-400"/>
                        </div>
                        <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors uppercase tracking-widest text-center">Upload Event Banner</span>
                        <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest font-bold text-center">We recommend a landscape ratio (e.g. 16:9)</p>
                    </>
                )}
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Event Title</label>
                <input type="text" name="title" required value={formData.title} placeholder="e.g. Hackathon 2026"
                  className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] placeholder-gray-600 transition-all font-bold"
                  onChange={handleChange} />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Description</label>
                <textarea name="description" required rows="4" value={formData.description} placeholder="What is this event about?"
                  className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] placeholder-gray-600 transition-all resize-none font-medium"
                  onChange={handleChange}></textarea>
              </div>

              {/* Date */}
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    <CalendarIcon size={14} className="text-orange-400"/> Event Date & Time
                </label>
                <input type="datetime-local" name="date" required value={formData.date} style={{ colorScheme: 'dark' }}
                  className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 outline-none shadow-inner transition-all font-bold"
                  onChange={handleChange} />
              </div>

              {/* Venue */}
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    <MapPin size={14} className="text-orange-400"/> Venue
                </label>
                <input type="text" name="venue" required value={formData.venue} placeholder="e.g. Main Auditorium"
                  className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 outline-none shadow-inner placeholder-gray-600 transition-all font-bold"
                  onChange={handleChange} />
              </div>

              {/* Registration Deadline */}
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Registration Deadline</label>
                <input type="datetime-local" name="registrationDeadline" required value={formData.registrationDeadline} style={{ colorScheme: 'dark' }}
                  className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 outline-none shadow-inner transition-all font-bold"
                  onChange={handleChange} />
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    <Tags size={14} className="text-orange-400"/> Category
                </label>
                <select name="category" value={formData.category} className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 outline-none shadow-inner appearance-none cursor-pointer font-bold" onChange={handleChange}>
                  <option value="Tech" className="bg-gray-900 text-white">Tech</option>
                  <option value="Cultural" className="bg-gray-900 text-white">Cultural</option>
                  <option value="Sports" className="bg-gray-900 text-white">Sports</option>
                  <option value="Workshop" className="bg-gray-900 text-white">Workshop</option>
                </select>
              </div>

              {/* Max Capacity */}
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    <Users size={14} className="text-orange-400"/> Total Capacity
                </label>
                <input type="number" name="maxSeats" required min="1" value={formData.maxSeats} placeholder="100"
                  className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 outline-none shadow-inner transition-all font-bold"
                  onChange={handleChange} />
              </div>

              {/* Price */}
              <div>
                <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    <IndianRupee size={14} className="text-orange-400"/> Ticket Price (₹)
                </label>
                <input type="number" name="price" required min="0" value={formData.price} placeholder="0 for Free"
                  className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:ring-1 focus:ring-orange-500/50 outline-none shadow-inner transition-all font-bold"
                  onChange={handleChange} />
              </div>
          </div>

          {/* Team Settings Wrapper */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mt-4 shadow-xl">
            <div className="flex items-center gap-3">
              <label className="relative flex items-center p-2 rounded-full cursor-pointer">
                <input type="checkbox" name="isTeamEvent" id="isTeamEvent" checked={formData.isTeamEvent}
                  className="peer relative appearance-none w-6 h-6 border-2 border-gray-600 rounded-lg checked:bg-orange-500 checked:border-orange-500 cursor-pointer transition-all"
                  onChange={handleChange} />
                <Send className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </label>
              <label htmlFor="isTeamEvent" className="text-white font-black cursor-pointer text-base md:text-lg uppercase tracking-tight">Allow Squad Registrations?</label>
            </div>

            {formData.isTeamEvent && (
              <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Min Team Size</label>
                  <input type="number" name="teamSizeMin" min="1" value={formData.teamSizeMin}
                    className="w-full px-5 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-orange-500/50 outline-none shadow-inner transition-all font-bold" onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Max Team Size</label>
                  <input type="number" name="teamSizeMax" min="1" value={formData.teamSizeMax}
                    className="w-full px-5 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-orange-500/50 outline-none shadow-inner transition-all font-bold" onChange={handleChange} />
                </div>
              </div>
            )}
          </div>

          <div className="pt-6">
              <button type="submit" disabled={loading} className="w-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-black text-sm uppercase tracking-[0.3em] py-5 rounded-2xl shadow-lg transition-all transform active:scale-95 flex justify-center items-center gap-3 hover:bg-orange-500/20 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] disabled:opacity-50">
                {loading ? "Launching..." : "Launch Event"} <Send size={20} />
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;