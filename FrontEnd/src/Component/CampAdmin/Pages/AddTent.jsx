import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCamp } from '../../../context/CampContext'; // adjust path as needed
import api from '../../../services/api';
import { Tent, Upload, Info, Image as ImageIcon, ShieldCheck, Loader, Shield, Plus, X, RotateCcw, ChevronDown } from 'lucide-react';
import { IntelligenceLoader } from '../../Common/IntelligenceLoader.jsx';

// Predefined amenity options for tents
const tentAmenitiesOptions = [
  'Electricity', 'Mattress', 'Pillow', 'Blanket', 'Lighting', 
  'Table', 'Chairs', 'Heater', 'Fan', 'Lockable', 'WiFi', 'Private Bathroom'
];



export const AddTent = () => {
  const { t } = useTranslation();
  const { campId, loading: campLoading, error: campError } = useCamp();
  
  // Tent form state
  const [tentForm, setTentForm] = useState({
    name: '',
    capacity: '',
    pricePerNight: '',
    description: '',
    size: '',
    sizeUnit: 'm²',
    status: 'Available'
  });
  const [tentImages, setTentImages] = useState([]);
  const [tentAmenities, setTentAmenities] = useState([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [customAmenities, setCustomAmenities] = useState(() => {
    const saved = localStorage.getItem(`custom_amenities_${campId}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [archivedAmenities, setArchivedAmenities] = useState(() => {
    const saved = localStorage.getItem(`archived_amenities_${campId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [visibleAmenities, setVisibleAmenities] = useState(() => {
    const saved = localStorage.getItem(`visible_amenities_${campId}`);
    if (saved) return JSON.parse(saved);
    // Default visible is standard options
    return [...tentAmenitiesOptions];
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);

  // Show loading state while fetching campId or submitting
  if (campLoading) {
    return <IntelligenceLoader text="Initializing System..." />;
  }

  if (isSubmitting) {
    return <IntelligenceLoader text="Processing Submission..." />;
  }

  if (campError || !campId) {
    return <div className="p-6 text-center text-red-500">{campError || 'Camp ID not found. Please ensure your account is linked to a camp.'}</div>;
  }

  const handleTentChange = (e) => {
    const { name, value } = e.target;
    setTentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    setTentImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(tentImages[index].previewUrl);
    setTentImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomAmenity = (e) => {
    e.preventDefault();
    if (!newAmenity.trim()) return;
    
    const val = newAmenity.trim();
    if (!visibleAmenities.includes(val) && !archivedAmenities.includes(val)) {
      const updatedVisible = [...visibleAmenities, val];
      setVisibleAmenities(updatedVisible);
      localStorage.setItem(`visible_amenities_${campId}`, JSON.stringify(updatedVisible));
      
      const updatedCustom = [...customAmenities, val];
      setCustomAmenities(updatedCustom);
      localStorage.setItem(`custom_amenities_${campId}`, JSON.stringify(updatedCustom));
      
      setTentAmenities(prev => [...prev, val]);
    } else if (archivedAmenities.includes(val)) {
      handleRestoreAmenity(val);
    }
    setNewAmenity('');
  };

  const handleArchiveAmenity = (amenity) => {
    const updatedVisible = visibleAmenities.filter(a => a !== amenity);
    const updatedArchived = [...archivedAmenities, amenity];
    
    setVisibleAmenities(updatedVisible);
    setArchivedAmenities(updatedArchived);
    setTentAmenities(prev => prev.filter(a => a !== amenity));
    
    localStorage.setItem(`visible_amenities_${campId}`, JSON.stringify(updatedVisible));
    localStorage.setItem(`archived_amenities_${campId}`, JSON.stringify(updatedArchived));
  };

  const handleRestoreAmenity = (amenity) => {
    const updatedVisible = [...visibleAmenities, amenity];
    const updatedArchived = archivedAmenities.filter(a => a !== amenity);
    
    setVisibleAmenities(updatedVisible);
    setArchivedAmenities(updatedArchived);
    
    localStorage.setItem(`visible_amenities_${campId}`, JSON.stringify(updatedVisible));
    localStorage.setItem(`archived_amenities_${campId}`, JSON.stringify(updatedArchived));
  };

  const handleTentAmenityChange = (amenity) => {
    setTentAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleTentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    const formData = new FormData();
    formData.append('name', tentForm.name);
    formData.append('capacity', tentForm.capacity);
    formData.append('pricePerNight', tentForm.pricePerNight);
    formData.append('description', tentForm.description);
    
    const finalSize = tentForm.size ? `${tentForm.size}${tentForm.sizeUnit}` : '';
    formData.append('size', finalSize);
    
    formData.append('status', tentForm.status);
    formData.append('amenities', JSON.stringify(tentAmenities));
    tentImages.forEach(img => {
      formData.append('images', img.file);
    });

    try {
      await api.post(`/tents/camp/${campId}`, formData);
      setSubmitMessage({ type: 'success', text: 'Tent added successfully!' });
      setTentForm({ name: '', capacity: '', pricePerNight: '', description: '', size: '', sizeUnit: 'm²', status: 'Available' });
      setTentImages([]);
      setTentAmenities([]);
    } catch (error) {
      console.error('Tent creation error:', error);
      setSubmitMessage({ type: 'error', text: error.response?.data?.error || error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ImagePreviewSection = ({ images, onRemove }) => (
    <div className="mt-2">
      <label className="block text-sm font-semibold text-gray-700 mb-2">Images (max 10, click to preview)</label>
      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <div key={idx} className="relative group">
            <img
              src={img.previewUrl}
              alt={`Preview ${idx+1}`}
              className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
              onClick={() => window.open(img.previewUrl, '_blank')}
            />
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition shadow-sm"
            >
              ✕
            </button>
          </div>
        ))}
        {images.length < 10 && (
          <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition bg-gray-50">
            <span className="text-2xl text-gray-400">+</span>
            <span className="text-xs text-gray-500 mt-1">Add</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">Supported: JPG, PNG. Max 10 images.</p>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('Add New Tent')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('Expand your campground by listing a beautiful new tent for your guests.')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t('Tent Details')}</h2>
            <p className="text-xs text-gray-500">{t('Provide the specifics about this accommodation')}</p>
          </div>
        </div>

        <form onSubmit={handleTentSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Tent Name *')}</label>
              <input type="text" name="name" value={tentForm.name} onChange={handleTentChange} required className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" placeholder={t("e.g., Deluxe Family Tent")} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Capacity (persons) *')}</label>
              <input type="number" name="capacity" value={tentForm.capacity} onChange={handleTentChange} required min="1" className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" placeholder="e.g., 4" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Price per Night (ETB) *')}</label>
              <input type="number" name="pricePerNight" value={tentForm.pricePerNight} onChange={handleTentChange} required min="0" step="0.01" className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm" placeholder="e.g., 1500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Size')}</label>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
                <input type="number" name="size" value={tentForm.size} onChange={handleTentChange} min="0" step="any" className="flex-1 p-2.5 bg-transparent border-none focus:ring-0 text-sm" placeholder="e.g., 20" />
                <select name="sizeUnit" value={tentForm.sizeUnit} onChange={handleTentChange} className="px-3 py-2.5 bg-gray-50 border-l border-gray-300 text-sm font-semibold text-gray-700 focus:outline-none">
                  <option value="m²">m²</option>
                  <option value="sq ft">sq ft</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Status')}</label>
              <select name="status" value={tentForm.status} onChange={handleTentChange} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm appearance-none">
                <option value="Available">{t('Available')}</option>
                <option value="Booked">{t('Booked')}</option>
                <option value="Maintenance">{t('Maintenance')}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('Description')}</label>
              <textarea name="description" value={tentForm.description} onChange={handleTentChange} rows={4} className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none" placeholder={t("Describe the tent, its features, and any special notes...")} />
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{t("Amenities")}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{t("Select all that apply. Hover active amenities to archive them.")}</p>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  placeholder={t("Add custom...")}
                  className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
                <button 
                  type="button"
                  onClick={handleAddCustomAmenity}
                  className="px-3 py-1.5 rounded-lg bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {archivedAmenities.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3 text-gray-700 text-sm font-semibold">
                  <RotateCcw className="w-4 h-4" />
                  {t("Archived Amenities History")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {archivedAmenities.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleRestoreAmenity(item)}
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-xs text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors flex items-center gap-1.5 shadow-sm group"
                    >
                      {item}
                      <Plus className="w-3 h-3 text-gray-400 group-hover:text-green-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {visibleAmenities.map(amenity => (
                <div key={amenity} className="flex items-center justify-between group p-3 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50/50 rounded-xl transition-colors shadow-sm">
                  <label className="flex items-center space-x-3 text-sm text-gray-700 cursor-pointer w-full">
                    <input type="checkbox" checked={tentAmenities.includes(amenity)} onChange={() => handleTentAmenityChange(amenity)} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <span className="font-medium">{amenity}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleArchiveAmenity(amenity)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Archive amenity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {visibleAmenities.length === 0 && (
                <div className="col-span-full py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <p className="text-sm text-gray-500">{t("No active amenities. Add custom ones or restore from history.")}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <ImagePreviewSection images={tentImages} onRemove={removeImage} />
          </div>

          {submitMessage && (
            <div className={`mt-6 p-4 rounded-xl text-sm font-medium ${submitMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {submitMessage.text}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? t('Adding Tent...') : t('Add Tent')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
