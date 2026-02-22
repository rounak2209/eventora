import React, { useState, useContext, useEffect } from 'react';
import { updateProfile, updatePassword } from '../api';
import { toast } from 'react-hot-toast';
import { Check, Edit3, Lock, Key } from 'lucide-react'; 
import AuthContext from '../context/AuthContext';

const Profile = () => {
  const { user } = useContext(AuthContext);
  
  // States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ bio: '', skills: '', isLookingForTeam: true });
  
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Sync context data to state when loaded
  useEffect(() => {
    if (user) {
        setProfileData({
            bio: user.bio || '',
            skills: user.skills?.join(', ') || '',
            isLookingForTeam: user.isLookingForTeam !== false
        });
    }
  }, [user]);

  // Profile Update API
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Updating profile...");
    try {
        const skillsArray = profileData.skills.split(',').map(s => s.trim()).filter(s => s);
        await updateProfile({ 
            bio: profileData.bio, 
            skills: skillsArray,
            isLookingForTeam: profileData.isLookingForTeam 
        });
        toast.dismiss(tid);
        toast.success("Profile Updated! 🚀");
        setIsEditingProfile(false);
        setTimeout(() => window.location.reload(), 1000); 
    } catch (error) {
        toast.dismiss(tid);
        toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  // Password Update API
  const handlePasswordUpdate = async (e) => {
      e.preventDefault();
      if (passwordData.newPassword !== passwordData.confirmPassword) {
          return toast.error("New passwords do not match!");
      }
      if (passwordData.newPassword.length < 6) {
          return toast.error("Password must be at least 6 characters long.");
      }
      const tid = toast.loading("Updating password...");
      try {
          await updatePassword({ 
              currentPassword: passwordData.currentPassword, 
              newPassword: passwordData.newPassword 
          });
          toast.dismiss(tid);
          toast.success("Password Updated Successfully! 🔒");
          setIsEditingPassword(false);
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } catch (error) {
          toast.dismiss(tid);
          toast.error(error.response?.data?.message || "Failed to update password");
      }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-transparent min-h-screen relative text-gray-100 selection:bg-orange-500/30 overflow-hidden z-10">
      
      {/* Background Subtle Glows */}
      <div className="absolute top-[10%] left-[-5%] w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      <div className="mb-10 text-center">
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">My Profile</h1>
          <p className="text-gray-400 font-medium mt-1">Manage your account settings and security</p>
      </div>

      <div className="max-w-xl mx-auto bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] border border-white/10 border-t-white/20 animate-in fade-in zoom-in-95 duration-500">
             
         {/* MAIN PROFILE SECTION */}
         <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
             <h2 className="text-xl font-black text-white drop-shadow-md uppercase tracking-widest">Account Details</h2>
             {!isEditingProfile && (
                 <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-orange-500/20 transition active:scale-95">
                     <Edit3 size={12}/> Edit Profile
                 </button>
             )}
         </div>

         {isEditingProfile ? (
             <form onSubmit={handleProfileUpdate} className="space-y-5 animate-in fade-in">
                <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl font-bold text-gray-500 mt-1.5 cursor-not-allowed">{user?.name}</div>
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl font-bold text-gray-500 mt-1.5 cursor-not-allowed">{user?.email}</div>
                </div>
                <div>
                    <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">Bio</label>
                    <textarea rows="3" className="w-full p-4 bg-black/40 border border-white/10 focus:border-orange-500/50 outline-none rounded-xl font-medium text-white mt-1.5 resize-none shadow-inner transition-colors" placeholder="Tell everyone about yourself..." value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})}></textarea>
                </div>
                
                {user.role === 'student' && (
                  <>
                    <div>
                        <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest ml-1">Skills (Comma Separated)</label>
                        <input type="text" className="w-full p-4 bg-black/40 border border-white/10 focus:border-orange-500/50 outline-none rounded-xl font-medium text-white mt-1.5 shadow-inner transition-colors" placeholder="e.g. React, Node.js, UI Design" value={profileData.skills} onChange={e => setProfileData({...profileData, skills: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10 mt-2">
                        <label className="relative flex items-center p-1 rounded-full cursor-pointer">
                            <input type="checkbox" checked={profileData.isLookingForTeam} onChange={e => setProfileData({...profileData, isLookingForTeam: e.target.checked})} className="peer relative appearance-none w-6 h-6 border-2 border-gray-600 rounded-lg checked:bg-orange-500 checked:border-orange-500 cursor-pointer transition-all" />
                            <Check className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        </label>
                        <div className="flex flex-col">
                            <span className="text-[11px] text-white font-black uppercase tracking-widest">Looking for Team?</span>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Turn on to let leaders find you</span>
                        </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4 mt-4 border-t border-white/10">
                    <button type="submit" className="flex-[2] bg-orange-500/10 text-orange-400 border border-orange-500/30 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-orange-500/20 transition active:scale-95 shadow-md">Save Profile</button>
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 bg-white/5 text-gray-400 border border-white/10 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition active:scale-95">Cancel</button>
                </div>
             </form>
         ) : (
             <div className="space-y-6 animate-in fade-in">
                <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="p-4 bg-white/5 border border-white/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] rounded-xl font-bold text-white mt-1.5 flex justify-between">
                        {user?.name}
                        <span className="bg-orange-500/20 text-orange-400 text-[9px] px-2 py-1 rounded-md uppercase tracking-widest">{user?.role}</span>
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="p-4 bg-white/5 border border-white/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] rounded-xl font-bold text-gray-300 mt-1.5">{user?.email}</div>
                </div>
                
                {(profileData.bio || user?.bio) && (
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Bio</label>
                        <div className="p-4 bg-white/5 border border-white/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] rounded-xl font-medium text-gray-300 mt-1.5 text-sm leading-relaxed">{profileData.bio || user?.bio}</div>
                    </div>
                )}
                
                {user.role === 'student' && (
                  <>
                    {(profileData.skills || user?.skills?.length > 0) && (
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Skills</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {(profileData.skills ? profileData.skills.split(',') : user?.skills)?.map((skill, i) => skill.trim() && (
                                    <span key={i} className="bg-white/5 backdrop-blur-md border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">{skill.trim()}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="mt-4">
                        <span className={`inline-block px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-inner border ${profileData.isLookingForTeam ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-gray-500/10 border-gray-500/30 text-gray-400'}`}>
                            {profileData.isLookingForTeam ? '👀 Actively Looking for a Team' : '🚫 Not Looking for a Team'}
                        </span>
                    </div>
                  </>
                )}
             </div>
         )}

         {/* 🔥 SECURITY & PASSWORD SECTION */}
         <div className="mt-10 border-t border-white/10 pt-8">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-black text-white drop-shadow-md uppercase tracking-widest flex items-center gap-2">
                     <Lock size={16} className="text-orange-400" /> Security
                 </h3>
                 {!isEditingPassword && (
                     <button onClick={() => setIsEditingPassword(true)} className="flex items-center gap-1.5 bg-white/5 text-gray-400 border border-white/10 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition active:scale-95">
                         Change Password
                     </button>
                 )}
             </div>

             {isEditingPassword && (
                 <form onSubmit={handlePasswordUpdate} className="space-y-4 animate-in fade-in slide-in-from-top-2">
                     <div>
                         <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Current Password</label>
                         <div className="relative mt-1.5">
                             <Key size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                             <input type="password" required className="w-full pl-10 pr-4 py-3.5 bg-black/40 border border-white/10 focus:border-orange-500/50 outline-none rounded-xl font-medium text-white shadow-inner transition-colors" placeholder="Enter current password" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} />
                         </div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">New Password</label>
                             <div className="relative mt-1.5">
                                 <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                 <input type="password" required minLength="6" className="w-full pl-10 pr-4 py-3.5 bg-black/40 border border-white/10 focus:border-orange-500/50 outline-none rounded-xl font-medium text-white shadow-inner transition-colors" placeholder="Min 6 characters" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} />
                             </div>
                         </div>
                         <div>
                             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                             <div className="relative mt-1.5">
                                 <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                 <input type="password" required minLength="6" className="w-full pl-10 pr-4 py-3.5 bg-black/40 border border-white/10 focus:border-orange-500/50 outline-none rounded-xl font-medium text-white shadow-inner transition-colors" placeholder="Retype password" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
                             </div>
                         </div>
                     </div>
                     <div className="flex gap-3 pt-2">
                        <button type="submit" className="flex-1 bg-red-500/10 text-red-400 border border-red-500/30 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-500/20 transition active:scale-95 shadow-md">Update Password</button>
                        <button type="button" onClick={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }) || setIsEditingPassword(false)} className="flex-1 bg-white/5 text-gray-400 border border-white/10 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition active:scale-95">Cancel</button>
                    </div>
                 </form>
             )}
         </div>
      </div>
    </div>
  );
};

export default Profile;