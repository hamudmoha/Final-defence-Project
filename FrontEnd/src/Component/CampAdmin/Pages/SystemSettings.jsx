import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, Building2, CalendarDays,
  Settings, Shield, CreditCard, AlertCircle, ShieldCheck, Loader, X, FileText, Lock, Clock, Info,
  Database, RefreshCcw, Download, History, Plus, AlertTriangle, Trash2, Camera, User, Image as ImageIcon,
  Menu, ChevronRight
} from 'lucide-react';
import { useUser } from '../../../context/UserContext';
import api from '../../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { IntelligenceLoader } from '../../Common/IntelligenceLoader.jsx';

export const SystemSettings = () => {
  const { user, refreshUser, loadingUser, setUser } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [camp, setCamp] = useState(null);
  const [loadingCamp, setLoadingCamp] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const govIdInputRef = useRef(null);
  const licenseInputRef = useRef(null);
  const campImageInputRef = useRef(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteFormData, setDeleteFormData] = useState({
    password: '',
    otp: '',
    check1: false,
    check2: false,
    check3: false,
    phrase: ''
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [guardrailChecking, setGuardrailChecking] = useState(false);
  const [guardrailResults, setGuardrailResults] = useState({
    activeBookingsCount: 0,
    unresolvedPayoutsCount: 0,
    checked: false,
  });

  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    location: '',
  });

  const [campSettings, setCampSettings] = useState({
    minStay: 1,
    maxStay: 30,
    advanceBooking: 90,
    autoApprove: true,
    allowSameDay: false,
    currency: 'ETB',
    depositPercentage: 30,
    acceptedPaymentMethods: ['Credit Card', 'Bank Transfer', 'Mobile Money', 'Cash'],
    cancellationWindow: 7,
    refundPercentage: 80,
    fullRefundPolicy: true,
    partialRefundPolicy: false,
    allow_flex_pay: false,
    require_full_payment: false,
    policy: '',
    sessionTimeout: 30,
    loginNotifications: true,
    limitSessions: false,
    policyHistory: []
  });

  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(true);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        businessName: user.businessName || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
      });
      fetchCamp();
      fetchBackups();
    }
  }, [user]);

  const fetchCamp = async () => {
    try {
      const res = await api.get('/camps/my/camps');
      if (res.data.success && res.data.data.length > 0) {
        const campData = res.data.data[0];
        setCamp(campData);
        setCampSettings({
          ...campSettings,
          ...campData,
          policy: campData.policy ?? '',
          policyHistory: campData.policyHistory ?? []
        });
      }
    } catch (err) {
      console.error("Failed to fetch camp:", err);
    } finally {
      setLoadingCamp(false);
    }
  };

  const fetchBackups = async () => {
    try {
      setLoadingBackups(true);
      const res = await api.get('/backup/history');
      if (res.data.success) {
        const all = [...(res.data.data.fullBackups || []), ...(res.data.data.incrementalBackups || [])];
        all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setBackups(all);
      }
    } catch (err) {
      console.error("Failed to fetch backups:", err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleUpdateUser = async (field, value) => {
    try {
      const updatedUser = { ...user, [field]: value };
      setUser(updatedUser);
      const res = await api.patch('/users/me', { [field]: value });
      if (res.data.success) {
        toast.success(`${field} updated`, { id: field });
        if (refreshUser) await refreshUser();
      }
    } catch (err) {
      toast.error("Update failed");
      if (refreshUser) refreshUser();
    }
  };

  const handleUpdateCamp = async (field, value) => {
    if (!camp) return;
    try {
      if (field === 'policy' && value !== campSettings.policy) {
        const historyEntry = { text: campSettings.policy, date: new Date() };
        const newHistory = [historyEntry, ...campSettings.policyHistory].slice(0, 10);
        await api.put(`/camps/${camp._id}`, { policy: value, policyHistory: newHistory });
        setCampSettings(prev => ({ ...prev, policy: value, policyHistory: newHistory }));
      } else {
        setCampSettings(prev => ({ ...prev, [field]: value }));
        await api.put(`/camps/${camp._id}`, { [field]: value });
      }
      toast.success("Setting updated", { id: field });
    } catch (err) {
      toast.error("Failed to update setting");
      fetchCamp();
    }
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      const res = await api.post('/backup/create');
      if (res.data.success) {
        toast.success("System snapshot created!");
        fetchBackups();
      }
    } catch (err) {
      toast.error("Backup failed");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (id) => {
    const confirmRestore = window.confirm("Are you sure? This will restore the system to this state and overwrite current data.");
    if (!confirmRestore) return;

    try {
      toast.loading("Restoring snapshot...", { id: 'restore' });
      const res = await api.post('/backup/restore', { id });
      if (res.data.success) {
        toast.success("System successfully restored!", { id: 'restore' });
        window.location.reload();
      }
    } catch (err) {
      toast.error("Restoration failed", { id: 'restore' });
    }
  };

  const handleProfileImageUpload = async (file) => {
    if (!file) return;
    setIsSaving(true);
    try {
      const data = new FormData();
      data.append('profilePicture', file);
      const res = await api.patch('/users/me', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        toast.success("Profile photo updated");
        if (refreshUser) await refreshUser();
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplianceUpload = async (file, field) => {
    if (!file) return;
    setIsSaving(true);
    try {
      const data = new FormData();
      data.append(field, file);
      const res = await api.patch('/users/me', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        toast.success(`${field === 'govId' ? 'Government ID' : 'Business License'} updated. Admin notified.`);
        if (refreshUser) await refreshUser();
      }
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCampImageUpload = async (file) => {
    if (!file || !camp) return;
    setIsSaving(true);
    try {
      const data = new FormData();
      data.append('campImage', file);
      const res = await api.put(`/camps/${camp._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        toast.success("Camp image updated");
        await fetchCamp();
      }
    } catch (err) {
      toast.error("Camp image upload failed");
    } finally {
      setIsSaving(false);
    }
  };

  const runGuardrailChecks = async () => {
    setGuardrailChecking(true);
    setDeleteError('');
    setGuardrailResults({ activeBookingsCount: 0, unresolvedPayoutsCount: 0, checked: false });
    try {
      const [bookingsRes, payoutsRes] = await Promise.all([
        api.get('/bookings/manager-bookings'),
        api.get('/payments/payouts')
      ]);

      let activeCount = 0;
      if (bookingsRes.data?.success) {
        activeCount = bookingsRes.data.data.filter(b => 
          ['PENDING', 'CONFIRMED', 'PARTIALLY_PAID', 'FULLY_PAID'].includes(b.status) &&
          new Date(b.checkIn) >= new Date(new Date().setHours(0,0,0,0))
        ).length;
      }

      let payoutCount = 0;
      if (payoutsRes.data?.success) {
        payoutCount = payoutsRes.data.data.filter(p => 
          ['PENDING', 'PROCESSING'].includes(p.status)
        ).length;
      }

      setGuardrailResults({
        activeBookingsCount: activeCount,
        unresolvedPayoutsCount: payoutCount,
        checked: true
      });
    } catch (err) {
      console.error("Failed to run guardrail checks:", err);
      setDeleteError("Failed to verify account guardrails. Please check your network connection.");
    } finally {
      setGuardrailChecking(false);
    }
  };

  const handleRequestDeleteOtp = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      if (guardrailResults.activeBookingsCount > 0) {
        setDeleteError(`Cannot delete account: You have ${guardrailResults.activeBookingsCount} active/upcoming camper reservations.`);
        setDeleteLoading(false);
        return;
      }
      if (guardrailResults.unresolvedPayoutsCount > 0) {
        setDeleteError(`Cannot delete account: You have ${guardrailResults.unresolvedPayoutsCount} unresolved payouts.`);
        setDeleteLoading(false);
        return;
      }

      await api.post('/auth/deletion-otp');
      setDeleteStep(2);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.post('/auth/self-delete', { password: deleteFormData.password, otp: deleteFormData.otp });
      toast.success("Account successfully deleted");
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  if (loadingUser || loadingCamp) {
    return <IntelligenceLoader text="Initializing System Settings..." />;
  }

  const sections = [
    { id: 'general', label: 'Business Profile', icon: Settings },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'payment', label: 'Payment & Refunds', icon: CreditCard },
    { id: 'policy', label: 'Camp Policy', icon: FileText },
    { id: 'restore', label: 'System Snapshots', icon: Database }
  ];

  return (
    <div className="flex flex-col min-h-full bg-slate-50 p-6 font-sans">
      <Toaster position="top-right" />
      
      <div className="lg:hidden p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              System Settings
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Manage your camp preferences and administrative tools</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" placeholder="Search settings..." className="pl-9 pr-4 py-2 bg-white rounded-xl text-sm font-semibold text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-600 outline-none border-none w-64" />
            </div>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
        
      {/* Desktop Header */}
      <div className="hidden lg:block p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              System Settings
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Manage your camp preferences and administrative tools</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" placeholder="Search settings..." className="pl-9 pr-4 py-2 bg-white rounded-xl text-sm font-semibold text-slate-900 shadow-sm focus:ring-2 focus:ring-teal-600 outline-none border-none w-64" />
            </div>
            <button className="p-2.5 bg-white rounded-xl shadow-sm hover:bg-slate-50 transition-all text-slate-500">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 sticky top-0 bg-slate-50 z-10 pt-2 border-b border-slate-200">
          {sections.map(section => (
            <button 
              key={section.id} 
              onClick={() => scrollToSection(section.id)} 
              className="flex items-center gap-2 px-6 py-2.5 bg-white rounded-xl text-sm font-bold text-slate-600 hover:text-teal-600 shadow-sm whitespace-nowrap transition-all hover:scale-105 active:scale-95 border border-slate-100"
            >
              <section.icon className="w-4 h-4" />
              <span className="capitalize">{section.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 lg:p-6 pt-0 lg:pt-0">
        <div className="space-y-6 lg:space-y-10 w-full">
          


        {/* Personal Section */}
        <div id="profile" className="bg-white p-8 rounded-[2rem] shadow-sm space-y-8 scroll-mt-24">
          <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm"><User className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Personal Profile</h2>
              <p className="text-sm text-slate-500 font-medium">Your personal identity and contact info</p>
            </div>
          </div>

          <div className="flex items-center gap-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
             <div className="relative group cursor-pointer">
               <div className="w-24 h-24 rounded-2xl bg-white overflow-hidden shadow-md border-4 border-white transition-transform group-hover:scale-105">
                 {user?.profilePicture ? <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-teal-600 font-black text-3xl">{user?.fullName?.[0]}</div>}
                 <div className="absolute inset-0 bg-teal-900/40 flex items-center justify-center text-white text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Change</div>
               </div>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleProfileImageUpload(e.target.files[0])} />
             </div>
             <div className="space-y-1">
               <h4 className="font-black text-slate-900 text-lg tracking-tight">Profile Photo</h4>
               <p className="text-sm text-slate-500 font-bold leading-relaxed">Your personal identity snapshot.</p>
               <button onClick={() => fileInputRef.current.click()} className="text-teal-600 text-xs font-black uppercase tracking-[0.2em] mt-2 hover:underline">Upload New Photo</button>
             </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] px-1">Full Name</label>
              <input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} onBlur={(e) => handleUpdateUser('fullName', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateUser('fullName', e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-teal-600 transition-all shadow-inner border border-slate-100" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] px-1">Official Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} onBlur={(e) => handleUpdateUser('email', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateUser('email', e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-teal-600 transition-all shadow-inner border border-slate-100" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] px-1">Phone Number</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} onBlur={(e) => handleUpdateUser('phone', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateUser('phone', e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-teal-600 transition-all shadow-inner border border-slate-100" />
            </div>
          </div>
        </div>

        {/* Business Profile Section */}
        <div id="business" className="bg-white p-8 rounded-[2rem] shadow-sm space-y-8 scroll-mt-24">
          <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm"><Building2 className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Business Profile</h2>
              <p className="text-sm text-slate-500 font-medium">Your official business records and compliance documents</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] px-1">Business Name</label>
              <input type="text" value={formData.businessName} onChange={(e) => setFormData({...formData, businessName: e.target.value})} onBlur={(e) => handleUpdateUser('businessName', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateUser('businessName', e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-teal-600 transition-all shadow-inner border border-slate-100" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] px-1">Business Location</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} onBlur={(e) => handleUpdateUser('location', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateUser('location', e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-teal-600 transition-all shadow-inner border border-slate-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 mt-4">
              <div className="flex flex-col gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="font-black text-slate-900 text-sm tracking-tight">Government ID</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Update your official identification document.</p>
                
                <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border-2 border-slate-200 group cursor-pointer bg-white" onClick={() => user?.govId && window.open(user.govId, '_blank')}>
                  {user?.govId ? (
                    <>
                      <img src={user.govId} alt="Gov ID" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold uppercase tracking-wider bg-slate-900/50 px-3 py-1 rounded-lg backdrop-blur-sm">Click to Preview</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <FileText className="w-6 h-6 opacity-50" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No Document</span>
                    </div>
                  )}
                </div>
                
                <button onClick={() => govIdInputRef.current.click()} className="mt-2 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                  {user?.govId ? "Upload Replacement ID" : "Upload Gov ID"}
                </button>
                <input type="file" ref={govIdInputRef} className="hidden" accept="image/*" onChange={(e) => handleComplianceUpload(e.target.files[0], 'govId')} />
              </div>
              
              <div className="flex flex-col gap-3 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="font-black text-slate-900 text-sm tracking-tight">Business License</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Update your official operating license.</p>
                
                <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border-2 border-slate-200 group cursor-pointer bg-white" onClick={() => user?.license && window.open(user.license, '_blank')}>
                  {user?.license ? (
                    <>
                      <img src={user.license} alt="Business License" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold uppercase tracking-wider bg-slate-900/50 px-3 py-1 rounded-lg backdrop-blur-sm">Click to Preview</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <FileText className="w-6 h-6 opacity-50" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No Document</span>
                    </div>
                  )}
                </div>
                
                <button onClick={() => licenseInputRef.current.click()} className="mt-2 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                  {user?.license ? "Upload Replacement License" : "Upload License"}
                </button>
                <input type="file" ref={licenseInputRef} className="hidden" accept="image/*" onChange={(e) => handleComplianceUpload(e.target.files[0], 'license')} />
              </div>
            </div>
          </div>
        </div>

        {/* Camp Details Section */}
        <div id="camp" className="bg-white p-8 rounded-[2rem] shadow-sm space-y-8 scroll-mt-24">
          <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm"><ImageIcon className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Camp Details</h2>
              <p className="text-sm text-slate-500 font-medium">Your campsite's public profile</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative group cursor-pointer flex-shrink-0">
               <div className="w-32 h-32 md:w-48 md:h-48 rounded-3xl bg-slate-100 overflow-hidden shadow-md border-4 border-white transition-transform group-hover:scale-105 flex items-center justify-center text-slate-400">
                 {camp?.images?.[0] ? <img src={camp.images[0]} alt="Camp" className="w-full h-full object-cover" /> : <ImageIcon className="w-12 h-12" />}
                 <div className="absolute inset-0 bg-teal-900/40 flex items-center justify-center text-white text-xs font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Change Image</div>
               </div>
               <button onClick={() => campImageInputRef.current.click()} className="mt-4 w-full text-center text-teal-600 text-xs font-black uppercase tracking-[0.2em] hover:underline">Upload Image</button>
               <input type="file" ref={campImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleCampImageUpload(e.target.files[0])} />
            </div>
            
            <div className="flex-1 w-full space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] px-1">Camp Name</label>
                <input type="text" value={campSettings.name || ''} onChange={(e) => setCampSettings({...campSettings, name: e.target.value})} onBlur={(e) => handleUpdateCamp('name', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateCamp('name', e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-teal-600 transition-all shadow-inner border border-slate-100" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] px-1">Camp Description</label>
                <textarea rows={4} value={campSettings.description || ''} onChange={(e) => setCampSettings({...campSettings, description: e.target.value})} onBlur={(e) => handleUpdateCamp('description', e.target.value)} className="w-full px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-teal-600 transition-all shadow-inner border border-slate-100 resize-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div id="security" className="bg-white p-8 rounded-[2rem] shadow-sm space-y-8 scroll-mt-24">
          <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-sm"><Shield className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Security & Access</h2>
              <p className="text-sm text-slate-500 font-medium">Protect your administrative dashboard</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Auto-Logout Timeout
              </label>
              <div className="flex items-center gap-4">
                <input type="number" value={campSettings.sessionTimeout || 30} onChange={(e) => setCampSettings({...campSettings, sessionTimeout: e.target.value})} onBlur={(e) => handleUpdateCamp('sessionTimeout', e.target.value)} className="w-24 px-6 py-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-teal-600 transition-all shadow-inner border border-slate-100" />
                <span className="text-sm text-slate-500 font-medium">minutes</span>
              </div>
             </div>
           </div>
         </div>

        {/* Danger Zone Section */}
        <div id="danger" className="bg-red-50/50 p-8 rounded-[2rem] shadow-sm space-y-8 scroll-mt-24 border border-red-100 mt-8">
          <div className="flex items-center justify-between border-b border-red-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-red-600 shadow-sm border border-red-100"><AlertTriangle className="w-6 h-6" /></div>
              <div>
                <h2 className="text-xl font-black text-red-900 tracking-tight">Danger Zone</h2>
                <p className="text-sm text-red-700 font-medium">Irreversible and destructive actions</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-red-100 shadow-sm">
            <div>
              <h4 className="text-md font-bold text-slate-900">Delete Account & Camps</h4>
              <p className="text-sm text-slate-500 mt-1 max-w-xl">
                Permanently delete your manager account and unpublish all camps. Active bookings and payouts must be resolved first. You will have a 15-day grace period to reverse this action by re-uploading your compliance documents.
              </p>
            </div>
            <button 
              onClick={() => {
                setDeleteStep(1);
                setDeleteFormData({ password: '', otp: '', check1: false, check2: false, check3: false, phrase: '' });
                setDeleteError('');
                setShowDeleteModal(true);
                runGuardrailChecks();
              }}
              className="px-6 py-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 border border-red-100"
            >
              <Trash2 size={18} />
              Delete Business Account
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-lg w-full">
            <div className="flex items-center gap-4 text-red-600 mb-6">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete Account</h3>
            </div>
            
            {deleteStep === 1 ? (
              <div className="space-y-6">
                <div className="space-y-4 text-sm font-medium text-slate-700">
                  <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                    <input type="checkbox" checked={deleteFormData.check1} onChange={e => setDeleteFormData({...deleteFormData, check1: e.target.checked})} className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-red-500" />
                    <span>I understand that all my camps will be removed from public searches and I cannot accept new bookings.</span>
                  </label>
                  <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                    <input type="checkbox" checked={deleteFormData.check2} onChange={e => setDeleteFormData({...deleteFormData, check2: e.target.checked})} className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-red-500" />
                    <span>I confirm I have no active/upcoming bookings or unresolved financial payouts. (The system will verify this).</span>
                  </label>
                  <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                    <input type="checkbox" checked={deleteFormData.check3} onChange={e => setDeleteFormData({...deleteFormData, check3: e.target.checked})} className="mt-1 w-4 h-4 text-red-600 rounded focus:ring-red-500" />
                    <span>I understand I will have exactly 15 days to reverse this action by re-uploading all compliance documents before permanent deletion.</span>
                  </label>
                </div>

                {/* Dynamic Guardrail Pre-check Status Badge */}
                {guardrailChecking ? (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <Loader className="w-5 h-5 animate-spin text-teal-600" />
                    <span className="text-sm font-semibold text-slate-600">Verifying account deletion guardrails...</span>
                  </div>
                ) : guardrailResults.checked ? (
                  <div className="space-y-3">
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${guardrailResults.activeBookingsCount === 0 ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                      <div className="mt-0.5">
                        {guardrailResults.activeBookingsCount === 0 ? (
                          <ShieldCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm">Camper Reservations Check</p>
                        <p className="text-xs mt-0.5">
                          {guardrailResults.activeBookingsCount === 0 
                            ? "No active or upcoming camper bookings." 
                            : `You have ${guardrailResults.activeBookingsCount} active/upcoming bookings that must be cancelled or completed.`
                          }
                        </p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${guardrailResults.unresolvedPayoutsCount === 0 ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                      <div className="mt-0.5">
                        {guardrailResults.unresolvedPayoutsCount === 0 ? (
                          <ShieldCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm">Financial Payouts Check</p>
                        <p className="text-xs mt-0.5">
                          {guardrailResults.unresolvedPayoutsCount === 0 
                            ? "All financial payouts resolved." 
                            : `You have ${guardrailResults.unresolvedPayoutsCount} unresolved payouts. Payouts must be fully processed first.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Type "delete #{camp?.name || user?.businessName}" to confirm</label>
                  <input type="text" value={deleteFormData.phrase} onChange={e => setDeleteFormData({...deleteFormData, phrase: e.target.value})} placeholder={`delete #${camp?.name || user?.businessName}`} className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-500" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Account Password</label>
                  <input type="password" value={deleteFormData.password} onChange={e => setDeleteFormData({...deleteFormData, password: e.target.value})} placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-500" />
                </div>

                {deleteError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">{deleteError}</div>}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => setShowDeleteModal(false)} className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors">Cancel</button>
                  <button 
                    onClick={handleRequestDeleteOtp} 
                    disabled={
                      deleteLoading || 
                      guardrailChecking ||
                      !guardrailResults.checked ||
                      guardrailResults.activeBookingsCount > 0 ||
                      guardrailResults.unresolvedPayoutsCount > 0 ||
                      !deleteFormData.check1 || 
                      !deleteFormData.check2 || 
                      !deleteFormData.check3 || 
                      !deleteFormData.password || 
                      deleteFormData.phrase !== `delete #${camp?.name || user?.businessName}`
                    } 
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {deleteLoading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                    Request Verification OTP
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-slate-600 font-medium leading-relaxed">
                  We've sent a 6-digit verification code to your email. Enter it below to finalize the deletion of your business account.
                </p>
                <input 
                  type="text" 
                  value={deleteFormData.otp} 
                  onChange={e => setDeleteFormData({...deleteFormData, otp: e.target.value})}
                  placeholder="------"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 font-mono text-center text-3xl tracking-[0.5em] font-black text-slate-900 outline-none uppercase"
                  maxLength={6}
                />
                {deleteError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">{deleteError}</div>}
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => setShowDeleteModal(false)} className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors">Cancel</button>
                  <button onClick={handleConfirmDelete} disabled={deleteLoading || deleteFormData.otp.length !== 6} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2">
                    {deleteLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 size={18} />}
                    Finalize Deletion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};