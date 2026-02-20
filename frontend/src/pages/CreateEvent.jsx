import React, { useState } from 'react';
import { createEvent } from '../api'; 
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ImagePlus } from 'lucide-react'; // 👈 Icon import kiya

const CreateEvent = () => {
  const navigate = useNavigate();
  
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

  const [bannerFile, setBannerFile] = useState(null); // 🔥 Photo store karne ke liye

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    setBannerFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please login as Organizer first");
        return;
      }

      // 🔥 Photo upload ke liye FormData banana zaroori hai
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        payload.append(key, formData[key]);
      });
      
      if (bannerFile) {
        payload.append('banner', bannerFile);
      }

      const tid = toast.loading("Uploading Event Details & Image...");
      
      await createEvent(payload);

      toast.dismiss(tid);
      toast.success("Event Created Successfully! 🎉");
      navigate('/organizer-dashboard'); 
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error(error.response?.data?.message || "Failed to create event");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-indigo-600">Create New Event 📅</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* 🔥 NEW: Banner Image Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 mb-4 hover:bg-gray-100 transition cursor-pointer">
          <ImagePlus size={32} className="text-indigo-400 mb-2"/>
          <label className="text-sm font-bold text-gray-700 cursor-pointer">
             {bannerFile ? bannerFile.name : "Upload Event Banner (Optional)"}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {/* Title */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">Event Title</label>
          <input type="text" name="title" required
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
            onChange={handleChange} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">Description</label>
          <textarea name="description" required rows="3"
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
            onChange={handleChange}></textarea>
        </div>

        {/* Date & Venue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Date</label>
            <input type="datetime-local" name="date" required
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={handleChange} />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">Venue</label>
            <input type="text" name="venue" required
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={handleChange} />
          </div>
        </div>

        {/* Deadline & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Registration Deadline</label>
            <input type="datetime-local" name="registrationDeadline" required
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={handleChange} />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">Category</label>
            <select name="category" className="w-full px-3 py-2 border rounded bg-white outline-none focus:ring-2 focus:ring-indigo-500" onChange={handleChange}>
              <option value="Tech">Tech</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Workshop">Workshop</option>
            </select>
          </div>
        </div>

        {/* Seats & Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Max Seats</label>
            <input type="number" name="maxSeats" required min="1"
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={handleChange} />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">Price (₹)</label>
            <input type="number" name="price" required min="0"
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={handleChange} />
          </div>
        </div>

        {/* Team Settings */}
        <div className="bg-gray-50 p-4 rounded border">
          <div className="flex items-center mb-4">
            <input type="checkbox" name="isTeamEvent" id="isTeamEvent"
              className="mr-2 h-5 w-5 text-indigo-600 rounded"
              onChange={handleChange} />
            <label htmlFor="isTeamEvent" className="text-gray-700 font-bold cursor-pointer">Is this a Team Event?</label>
          </div>

          {formData.isTeamEvent && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-sm font-medium text-gray-600">Min Team Size</label>
                <input type="number" name="teamSizeMin" min="1" defaultValue="1"
                  className="w-full px-3 py-1 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Max Team Size</label>
                <input type="number" name="teamSizeMax" min="1" defaultValue="1"
                  className="w-full px-3 py-1 border rounded focus:ring-2 focus:ring-indigo-500 outline-none" onChange={handleChange} />
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded shadow-lg transition transform active:scale-95">
          🚀 Create Event
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;