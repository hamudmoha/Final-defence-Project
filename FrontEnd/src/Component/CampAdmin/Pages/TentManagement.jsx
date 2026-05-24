import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Plus, Tent, CheckCircle2, Wrench, MapPin, Edit, X,
  Eye, EyeOff, LayoutGrid, List, Upload, Users, CheckCircle, Shield, Loader, Menu, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import { useUser } from '../../../context/UserContext';
import toast, { Toaster } from 'react-hot-toast';
import { IntelligenceLoader } from '../../Common/IntelligenceLoader.jsx';

export const TentManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loadingUser } = useUser();
  const [tents, setTents] = useState([]);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Predefined amenity options for tents
  const tentAmenitiesOptions = [
    'Electricity', 'Mattress', 'Pillow', 'Blanket', 'Lighting',
    'Table', 'Chairs', 'Heater', 'Fan', 'Lockable', 'WiFi', 'Private Bathroom'
  ];

  // UI state
  const [statusTab, setStatusTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Edit modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editImages, setEditImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [editAmenities, setEditAmenities] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const fileInputRef = useRef(null);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [newItem, setNewItem] = useState({
    campId: '',
    name: '',
    description: '',
    capacity: '',
    pricePerNight: '',
    amenities: '',
    size: '',
  });

  // Fetch camps and tents
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const campsRes = await api.get('/camps/my/camps');
        const campsData = campsRes.data.data;
        setCamps(campsData);

        const tentsPromises = campsData.map(camp => api.get(`/tents/camp/${camp._id}`).then(res => res.data.data));
        const tentsArrays = await Promise.all(tentsPromises);
        setTents(tentsArrays.flat());
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.response?.data?.message || t('Failed to load data'));
      } finally {
        setLoading(false);
      }
    };
    if (user && !loadingUser) fetchData();
  }, [user, loadingUser, t]);

  const getCampForItem = (item) => camps.find(c => c._id === item.campId);

  // Filter tents based on status tab and search
  const filteredTents = tents.filter(item => {
    if (statusTab !== 'All' && item.status !== statusTab) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = item.name.toLowerCase().includes(term);
      let amenitiesMatch = false;
      if (item.amenities) {
        amenitiesMatch = item.amenities.some(a => a.toLowerCase().includes(term));
      }
      if (!nameMatch && !amenitiesMatch) return false;
    }
    return true;
  });

  // Status update function
  const updateStatus = async (item, newStatus) => {
    try {
      await api.put(`/tents/${item._id}`, { status: newStatus });
      setTents(prev => prev.map(t => t._id === item._id ? { ...t, status: newStatus } : t));
      toast.success(`${t('Tent is now')} ${t(newStatus)}`);
    } catch (err) {
      console.error('Status update error:', err);
      toast.error(t('Failed to update status'));
    }
  };

  // Toggle between available and maintenance (eye icon)
  const toggleMaintenance = (item) => {
    const newStatus = item.status?.toLowerCase() === 'available' ? 'Maintenance' : 'Available';
    updateStatus(item, newStatus);
  };

  // Occupy modal state
  const [showOccupyModal, setShowOccupyModal] = useState(false);
  const [occupyingItem, setOccupyingItem] = useState(null);
  const [occupyForm, setOccupyForm] = useState({
    checkIn: '',
    checkOut: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guests: 1,
    totalAmount: 0,
    amountPaid: 0,
    paymentType: 'CASH'
  });
  const [occupyLoading, setOccupyLoading] = useState(false);

  // Helper to calculate total amount based on price per night and check-in/out dates
  const calculateTotalAmount = (checkIn, checkOut, pricePerNight) => {
    if (!checkIn || !checkOut || !pricePerNight) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = end - start;
    const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
    return nights * pricePerNight;
  };

  // Open occupy modal
  const openOccupyModal = (item) => {
    setOccupyingItem(item);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const initialTotal = item.pricePerNight || 0;
    setOccupyForm({
      checkIn: today,
      checkOut: tomorrow,
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      guests: 1,
      totalAmount: initialTotal,
      amountPaid: initialTotal,
      paymentType: 'CASH'
    });
    setShowOccupyModal(true);
  };

  // Handle date changes with dynamic amount calculation
  const handleDateChange = (field, val) => {
    const updatedForm = { ...occupyForm, [field]: val };
    if (field === 'checkIn' && updatedForm.checkOut < val) {
      updatedForm.checkOut = val;
    }
    const newTotal = calculateTotalAmount(updatedForm.checkIn, updatedForm.checkOut, occupyingItem?.pricePerNight);
    updatedForm.totalAmount = newTotal;
    updatedForm.amountPaid = newTotal;
    setOccupyForm(updatedForm);
  };

  const handleOccupySubmit = async (e) => {
    e.preventDefault();
    setOccupyLoading(true);
    try {
      await api.post('/bookings/manual-occupy', {
        tentId: occupyingItem._id,
        ...occupyForm
      });
      toast.success(t('Reservation created and tent marked as occupied!'));
      setShowOccupyModal(false);
      const campsRes = await api.get('/camps/my/camps');
      const campsData = campsRes.data.data;
      const tentsPromises = campsData.map(camp => api.get(`/tents/camp/${camp._id}`).then(res => res.data.data));
      const tentsArrays = await Promise.all(tentsPromises);
      setTents(tentsArrays.flat());
    } catch (err) {
      console.error('Manual occupy error:', err);
      toast.error(err.response?.data?.message || t('Failed to mark as occupied'));
    } finally {
      setOccupyLoading(false);
    }
  };

  const deleteTent = async (id) => {
    if (!window.confirm(t('Are you sure you want to delete this tent? This action cannot be undone.'))) return;
    try {
      await api.delete(`/tents/${id}`);
      setTents(prev => prev.filter(t => t._id !== id));
      toast.success(t('Tent deleted successfully'));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(t('Failed to delete tent'));
    }
  };

  // Open edit modal
  const openEditModal = (item) => {
    setEditingItem({ ...item, type: 'tent' });
    setEditForm({ ...item });
    setExistingImages(item.images || []);
    setEditImages([]);
    setEditAmenities(item.amenities || []);
    setEditError('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setEditImages(prev => [...prev, ...files]);
  };
  const removeNewImage = (index) => {
    setEditImages(prev => prev.filter((_, i) => i !== index));
  };
  const removeExistingImage = async (imageUrl) => {
    setExistingImages(prev => prev.filter(url => url !== imageUrl));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const formData = new FormData();
      const allowedFields = ['name', 'description', 'capacity', 'pricePerNight', 'size', 'status'];
      allowedFields.forEach(key => {
        if (editForm[key] !== undefined) {
          formData.append(key, editForm[key]);
        }
      });
      formData.append('amenities', JSON.stringify(editAmenities));
      formData.append('existingImages', JSON.stringify(existingImages));
      editImages.forEach(file => {
        formData.append('images', file);
      });
      const response = await api.put(`/tents/${editingItem._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const updatedTent = response.data.data;
      setTents(prev => prev.map(t => t._id === updatedTent._id ? updatedTent : t));
      toast.success(t('Tent updated successfully'));
      setEditingItem(null);
    } catch (err) {
      console.error('Update error:', err);
      setEditError(err.response?.data?.message || t('Update failed'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.campId) {
      setAddError(t('Please select a camp'));
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      const payload = {
        name: newItem.name,
        description: newItem.description,
        capacity: parseInt(newItem.capacity),
        pricePerNight: parseFloat(newItem.pricePerNight),
        amenities: newItem.amenities.split(',').map(s => s.trim()).filter(Boolean),
        size: newItem.size,
        status: 'available'
      };
      const response = await api.post(`/tents/camp/${newItem.campId}`, payload);
      setTents(prev => [...prev, response.data.data]);
      toast.success(t('Tent added successfully'));
      setShowAddModal(false);
      setNewItem({ campId: '', name: '', description: '', capacity: '', pricePerNight: '', amenities: '', size: '' });
    } catch (err) {
      setAddError(err.response?.data?.message || t('Failed to create tent'));
    } finally {
      setAdding(false);
    }
  };

  // Stats with click handlers
  const stats = [
    { label: t('Total Tents'), value: tents.length, icon: Tent, color: 'text-blue-500', bgColor: 'bg-blue-50', baseColor: 'bg-blue-500', filter: 'All' },
    { label: t('Available'), value: tents.filter(i => i.status?.toLowerCase() === 'available').length, icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-50', baseColor: 'bg-emerald-500', filter: 'Available' },
    { label: t('Occupied/Booked'), value: tents.filter(i => ['occupied', 'booked'].includes(i.status?.toLowerCase())).length, icon: Users, color: 'text-orange-500', bgColor: 'bg-orange-50', baseColor: 'bg-orange-500', filter: 'Occupied' },
    { label: t('Maintenance'), value: tents.filter(i => i.status?.toLowerCase() === 'maintenance').length, icon: Wrench, color: 'text-rose-500', bgColor: 'bg-rose-50', baseColor: 'bg-rose-500', filter: 'Maintenance' },
  ];

  if (loadingUser || loading) {
    return <IntelligenceLoader text={t("Initializing Tents...")} />;
  }
  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 m-6">{error}</div>;
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 p-6 font-sans">
      <Toaster position="top-right" />
      
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{t('Tent Management')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('Manage your campsite inventory and occupancy')}</p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Filter className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => navigate('/manager-dashboard/notifications')}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-200 transition-colors"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          <button
            onClick={() => navigate('/manager-dashboard/add-tent')}
            className="flex items-center gap-1.5 sm:gap-2 bg-teal-600 hover:bg-teal-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{t('Add Tent')}</span>
          </button>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-2xl z-50 lg:hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-800">{t('Search & Filter')}</h3>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-xl bg-slate-50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('Search')}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder={t('Search by name or amenities...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('Status')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['All', 'Available', 'Booked', 'Occupied', 'Maintenance'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => {
                          setStatusTab(tab);
                          setMobileFiltersOpen(false);
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          statusTab === tab 
                            ? 'bg-teal-600 text-white shadow-sm' 
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {t(tab)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('View Mode')}</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        viewMode === 'grid' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" /> {t('Grid')}
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        viewMode === 'list' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <List className="w-4 h-4" /> {t('List')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-100">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full py-3.5 bg-teal-600 text-white rounded-xl font-bold text-sm"
                >
                  {t('Apply')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 mb-6 sm:mb-8">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.3, ease: "easeOut" } }}
            onClick={() => setStatusTab(stat.filter)}
            className={`relative bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer group overflow-hidden transition-shadow duration-300 hover:shadow-lg ${
              statusTab === stat.filter ? 'ring-2 ring-teal-500' : ''
            }`}
          >
            <div className={`absolute bottom-0 left-0 w-full h-1 ${stat.baseColor} opacity-90 transition-all duration-300 group-hover:h-1.5`}></div>
            <div className={`absolute bottom-0 left-0 h-full w-1 ${stat.baseColor} opacity-90 transition-all duration-300 group-hover:w-1.5`}></div>

            <div className="relative z-10 pl-1">
              <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] lg:tracking-[0.3em] mb-0.5 sm:mb-1">{stat.label}</p>
              <h3 className="text-base sm:text-lg lg:text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
            <div className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full ${stat.bgColor} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${stat.color}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Status tabs + View toggle row - Desktop */}
      <div className="hidden lg:flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-1 bg-slate-100/50 p-1 rounded-lg overflow-x-auto scrollbar-hide">
          {['All', 'Available', 'Booked', 'Occupied', 'Maintenance'].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                statusTab === tab ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {t(tab)}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Desktop Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('Search by name or amenities...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-64 bg-white"
            />
          </div>
          
          {/* Desktop View toggle */}
          <div className="flex items-center space-x-1 bg-slate-100/50 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tents Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          <AnimatePresence>
            {filteredTents.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500">
                {t('No tents match your criteria.')}
              </div>
            ) : (
              filteredTents.map((item, idx) => {
                const camp = getCampForItem(item);
                const firstImage = item.images?.[0] || camp?.images?.[0] || 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=640';
                const status = item.status?.toLowerCase() || 'available';
                const statusColor = status === 'available' ? 'bg-teal-500' : (status === 'occupied' || status === 'booked') ? 'bg-orange-500' : 'bg-red-500';
                const statusText = t(item.status || 'Available');
                return (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col group"
                  >
                    <div className="h-40 sm:h-44 lg:h-48 w-full relative overflow-hidden">
                      <img src={firstImage} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 flex gap-1.5 sm:gap-2">
                        <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold shadow-sm ${statusColor} text-white`}>
                          {statusText}
                        </span>
                        <button
                          onClick={() => toggleMaintenance(item)}
                          className="p-1 sm:p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors"
                          title={item.status?.toLowerCase() === 'available' ? t('Mark as maintenance') : t('Mark as available')}
                        >
                          {item.status?.toLowerCase() === 'available' ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700" />}
                        </button>
                        <button
                          onClick={() => openOccupyModal(item)}
                          className="p-1 sm:p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors"
                          title={t('Mark as occupied (Offline booking)')}
                        >
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700" />
                        </button>
                        <button
                          onClick={() => deleteTent(item._id)}
                          className="p-1 sm:p-1.5 bg-white/80 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                          title={t('Delete Tent')}
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 lg:p-5 flex-1 flex flex-col">
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1 sm:mb-2">{item.name}</h3>
                      <div className="flex items-center text-slate-500 text-xs sm:text-sm mb-2 sm:mb-3 lg:mb-4">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{typeof camp?.location === 'string' ? camp.location : (camp?.location?.address || t('Location N/A'))}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 sm:gap-y-3 mb-3 sm:mb-4 lg:mb-6">
                        <div><p className="text-[10px] sm:text-xs text-slate-400">{t('Capacity')}</p><p className="text-xs sm:text-sm font-medium">{item.capacity} {t('people')}</p></div>
                        <div className="text-right"><p className="text-[10px] sm:text-xs text-slate-400">{t('Price')}</p><p className="text-xs sm:text-sm font-bold text-teal-600">ETB {item.pricePerNight}/{t('night')}</p></div>
                        {item.size && <div><p className="text-[10px] sm:text-xs text-slate-400">{t('Size (sq m)')}</p><p className="text-xs sm:text-sm">{item.size}</p></div>}
                      </div>
                      <div className="mt-auto">
                        <button
                          onClick={() => openEditModal(item)}
                          className="w-full flex items-center justify-center gap-2 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t('Edit')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredTents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">{t('No tents match your criteria.')}</div>
          ) : (
            filteredTents.map((item) => {
              const camp = getCampForItem(item);
              const status = item.status?.toLowerCase() || 'available';
              const statusColor = status === 'available' ? 'bg-teal-100 text-teal-700' : (status === 'occupied' || status === 'booked') ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700';
              const statusText = t(item.status || 'Available');
              return (
                <div key={item._id} className="bg-white rounded-xl border border-slate-100 p-3 sm:p-4 flex flex-wrap items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <img src={item.images?.[0] || camp?.images?.[0] || 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=120'} alt={item.name} className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 truncate">{item.name}</h3>
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-semibold ${statusColor} whitespace-nowrap`}>
                        {statusText}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{camp?.location?.address || t('Location N/A')}</p>
                    <div className="flex flex-wrap gap-2 sm:gap-4 mt-1.5 sm:mt-2 text-[10px] sm:text-xs">
                      <span className="flex items-center gap-1">👥 {item.capacity} {t('persons')}</span>
                      <span className="flex items-center gap-1">💰 ETB {item.pricePerNight}/{t('night')}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2">
                    <button onClick={() => toggleMaintenance(item)} className="p-1.5 sm:p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title={status === 'available' ? t('Mark as maintenance') : t('Mark as available')}>
                      {status === 'available' ? <EyeOff className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> : <Eye className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
                    </button>
                    <button onClick={() => openOccupyModal(item)} className="p-1.5 sm:p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title={t('Mark as occupied (Offline booking)')}>
                      <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </button>
                    <button onClick={() => openEditModal(item)} className="p-1.5 sm:p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title={t('Edit')}>
                      <Edit className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Edit Modal - Responsive */}
      <AnimatePresence>
        {editingItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
            <motion.div initial={{ y: "100%", scale: 1 }} animate={{ y: 0, scale: 1 }} exit={{ y: "100%", scale: 1 }} transition={{ type: "spring", damping: 25 }} className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-slate-100 p-4 sm:p-6 flex justify-between items-center">
                <h2 className="text-base sm:text-xl font-bold text-slate-800">{t('Edit Tent')}</h2>
                <button onClick={() => setEditingItem(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                {editError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-xs sm:text-sm">{editError}</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div><label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">{t('Name *')}</label><input type="text" name="name" value={editForm.name || ''} onChange={handleEditChange} className="w-full border border-slate-200 rounded-lg px-3 sm:px-4 py-2 text-sm" required /></div>
                  <div><label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">{t('Price per Night (ETB) *')}</label><input type="number" name="pricePerNight" value={editForm.pricePerNight || ''} onChange={handleEditChange} className="w-full border border-slate-200 rounded-lg px-3 sm:px-4 py-2 text-sm" required /></div>
                  <div><label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">{t('Status')}</label>
                    <select name="status" value={editForm.status || 'available'} onChange={handleEditChange} className="w-full border border-slate-200 rounded-lg px-3 sm:px-4 py-2 text-sm">
                      <option value="available">{t('Available')}</option>
                      <option value="occupied">{t('Occupied')}</option>
                      <option value="maintenance">{t('Maintenance')}</option>
                    </select>
                  </div>
                  <div><label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">{t('Capacity')}</label><input type="number" name="capacity" value={editForm.capacity || ''} onChange={handleEditChange} className="w-full border border-slate-200 rounded-lg px-3 sm:px-4 py-2 text-sm" /></div>
                  <div><label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">{t('Size (sq m)')}</label><input type="text" name="size" value={editForm.size || ''} onChange={handleEditChange} className="w-full border border-slate-200 rounded-lg px-3 sm:px-4 py-2 text-sm" /></div>
                  <div className="sm:col-span-2"><label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">{t('Description')}</label><textarea name="description" rows="3" value={editForm.description || ''} onChange={handleEditChange} className="w-full border border-slate-200 rounded-lg px-3 sm:px-4 py-2 text-sm" /></div>
                </div>

                {/* Amenities checkboxes - Responsive grid */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">{t('Amenities')}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {tentAmenitiesOptions.map(amenity => (
                      <label key={amenity} className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm">
                        <input
                          type="checkbox"
                          checked={editAmenities.includes(amenity)}
                          onChange={() => {
                            if (editAmenities.includes(amenity)) setEditAmenities(prev => prev.filter(a => a !== amenity));
                            else setEditAmenities(prev => [...prev, amenity]);
                          }}
                          className="rounded text-teal-600 w-3.5 h-3.5 sm:w-4 sm:h-4"
                        />
                        {t(amenity)}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Images section */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">{t('Images')}</label>
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-3">
                    {existingImages.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt={`Existing ${idx}`} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-slate-200" />
                        <button type="button" onClick={() => removeExistingImage(url)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px]"><X className="w-2.5 h-2.5 sm:w-3 sm:h-3" /></button>
                      </div>
                    ))}
                    {editImages.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img src={URL.createObjectURL(file)} alt="New preview" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-slate-200" />
                        <button type="button" onClick={() => removeNewImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px]"><X className="w-2.5 h-2.5 sm:w-3 sm:h-3" /></button>
                      </div>
                    ))}
                    <label className="w-16 h-16 sm:w-20 sm:h-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-teal-400 transition bg-slate-50">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                      <span className="text-[8px] sm:text-[10px] text-slate-500">{t('Add')}</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} ref={fileInputRef} />
                    </label>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400">{t('Add new images – existing ones are kept unless removed.')}</p>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button type="button" onClick={() => setEditingItem(null)} className="px-3 sm:px-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm hover:bg-slate-50 order-2 sm:order-1">{t('Cancel')}</button>
                  <button type="submit" disabled={editLoading} className="px-3 sm:px-4 py-2 bg-teal-600 text-white rounded-lg text-xs sm:text-sm hover:bg-teal-700 disabled:opacity-50 order-1 sm:order-2">
                    {editLoading ? <Loader className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin inline mr-1" /> : null} {t('Save Changes')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Occupy Modal - Responsive */}
      <AnimatePresence>
        {showOccupyModal && occupyingItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4 backdrop-blur-sm">
            <motion.div initial={{ y: "100%", scale: 1 }} animate={{ y: 0, scale: 1 }} exit={{ y: "100%", scale: 1 }} transition={{ type: "spring", damping: 25 }} className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-xl font-bold text-slate-800">{t('Book & Occupy Tent')}</h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">{occupyingItem.name} • {t('Capacity')}: {occupyingItem.capacity} {t('guests')}</p>
                </div>
                <button onClick={() => setShowOccupyModal(false)} className="p-1 rounded-lg hover:bg-slate-200 transition-colors ml-2 flex-shrink-0"><X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" /></button>
              </div>
              <form onSubmit={handleOccupySubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">{t('Check-In')}</label>
                    <input 
                      type="date" 
                      value={occupyForm.checkIn} 
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleDateChange('checkIn', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">{t('Check-Out')}</label>
                    <input 
                      type="date" 
                      value={occupyForm.checkOut} 
                      min={occupyForm.checkIn}
                      onChange={(e) => handleDateChange('checkOut', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">{t('Guest Name *')}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Abdi Kassa"
                      value={occupyForm.guestName}
                      onChange={(e) => setOccupyForm({...occupyForm, guestName: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">{t('Guest Email')}</label>
                    <input 
                      type="email" 
                      placeholder="e.g. guest@example.com"
                      value={occupyForm.guestEmail}
                      onChange={(e) => setOccupyForm({...occupyForm, guestEmail: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">{t('Guest Phone')}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +251..."
                      value={occupyForm.guestPhone}
                      onChange={(e) => setOccupyForm({...occupyForm, guestPhone: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">{t('Number of Guests')}</label>
                    <input 
                      type="number" 
                      min="1"
                      max={occupyingItem.capacity || 10}
                      value={occupyForm.guests}
                      onChange={(e) => setOccupyForm({...occupyForm, guests: parseInt(e.target.value) || 1})}
                      className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider">{t('Payment & Financial Details')}</h4>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mb-1">{t('Total Amount Owed (ETB)')}</label>
                      <input 
                        type="number" 
                        min="0"
                        value={occupyForm.totalAmount}
                        onChange={(e) => setOccupyForm({...occupyForm, totalAmount: parseFloat(e.target.value) || 0})}
                        className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mb-1">{t('Amount Paid (ETB)')}</label>
                      <input 
                        type="number" 
                        min="0"
                        max={occupyForm.totalAmount}
                        value={occupyForm.amountPaid}
                        onChange={(e) => setOccupyForm({...occupyForm, amountPaid: parseFloat(e.target.value) || 0})}
                        className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase mb-1">{t('Payment Method / Type')}</label>
                    <select
                      value={occupyForm.paymentType}
                      onChange={(e) => setOccupyForm({...occupyForm, paymentType: e.target.value})}
                      className="w-full border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm bg-white cursor-pointer"
                    >
                      <option value="CASH">{t('Cash Payment (Offline)')}</option>
                      <option value="ONLINE">{t('Chapa Payment (Online)')}</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowOccupyModal(false)} className="px-3 sm:px-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-50 transition-colors">{t('Cancel')}</button>
                  <button type="submit" disabled={occupyLoading} className="px-3 sm:px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                    {occupyLoading ? <Loader className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    {t('Make a Reservation')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};