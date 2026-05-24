import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Save, CheckCircle, UploadCloud, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import { useUser } from '../../../context/UserContext';

export const ListYourCampWizard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [application, setApplication] = useState(null);
  const [rejectionLimitReached, setRejectionLimitReached] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    managerName: '',
    businessName: '',
    location: '',
    description: '',
    phone: '',
  });

  // File State (Local Blobs for preview, Files for upload)
  const [files, setFiles] = useState({
    govId: null,
    license: null,
    profilePicture: null,
    coverPhotos: []
  });

  // Previews
  const [previews, setPreviews] = useState({
    govId: null,
    license: null,
    profilePicture: null,
    coverPhotos: []
  });

  const fileInputRefs = {
    govId: useRef(null),
    license: useRef(null),
    profilePicture: useRef(null),
    coverPhotos: useRef(null)
  };

  useEffect(() => {
    fetchDraft();
  }, []);

  const fetchDraft = async () => {
    try {
      setLoading(true);
      const res = await api.get('/role-requests/my-request');
      if (res.data.data) {
        const app = res.data.data;
        if (app.rejectionCount >= 3) {
          setRejectionLimitReached(true);
          return;
        }
        setApplication(app);
        setFormData({
          managerName: app.managerName || user?.fullName || user?.name || '',
          businessName: app.businessName || '',
          location: app.location || '',
          description: app.description || '',
          phone: app.phone || '',
        });
        
        // Setup remote previews if they exist
        setPreviews(prev => ({
          ...prev,
          govId: app.govId || null,
          license: app.license || null,
          profilePicture: app.profilePicture || null,
          coverPhotos: app.coverPhotos || []
        }));

        if (app.status === 'pending') {
          // If already submitted, maybe redirect back to dashboard
          toast.success(t("Application is already pending review."));
          navigate('/camper-dashboard');
        }
      }
    } catch (error) {
      console.error("Error fetching draft:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    if (fieldName === 'coverPhotos') {
      setFiles(prev => ({ ...prev, coverPhotos: [...prev.coverPhotos, ...selectedFiles].slice(0, 5) })); // Max 5 photos
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => ({ ...prev, coverPhotos: [...prev.coverPhotos, ...newPreviews].slice(0, 5) }));
    } else {
      setFiles(prev => ({ ...prev, [fieldName]: selectedFiles[0] }));
      setPreviews(prev => ({ ...prev, [fieldName]: URL.createObjectURL(selectedFiles[0]) }));
    }
    
    // Auto-save on file upload
    saveDraft(fieldName, selectedFiles);
  };

  const removeCoverPhoto = (index) => {
    setFiles(prev => ({
      ...prev,
      coverPhotos: prev.coverPhotos.filter((_, i) => i !== index)
    }));
    setPreviews(prev => ({
      ...prev,
      coverPhotos: prev.coverPhotos.filter((_, i) => i !== index)
    }));
    // Note: Deleting a remote file instantly from cloudinary might be complex, we just update local state and next saveDraft will overwrite.
  };

  const saveDraft = async (fileField = null, fileList = null) => {
    setSaving(true);
    try {
      const data = new FormData();
      data.append('managerName', formData.managerName);
      data.append('businessName', formData.businessName);
      data.append('location', formData.location);
      data.append('description', formData.description);
      data.append('phone', formData.phone);

      if (fileField && fileList) {
        if (fileField === 'coverPhotos') {
          // We must send all files if replacing, but we only have local files in 'fileList'.
          // To properly handle mixed remote and local, a robust solution would just send new ones. 
          // For this wizard, we'll send the newly attached ones.
          fileList.forEach(file => {
            data.append('coverPhotos', file);
          });
        } else {
          data.append(fileField, fileList[0]);
        }
      } else {
        // Send whatever local files we have not yet sent (simplified for draft)
        if (files.govId) data.append('govId', files.govId);
        if (files.license) data.append('license', files.license);
        if (files.profilePicture) data.append('profilePicture', files.profilePicture);
        files.coverPhotos.forEach(file => data.append('coverPhotos', file));
      }

      await api.post('/role-requests/draft', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if(!fileField) toast.success(t("Draft saved securely."));
    } catch (error) {
      console.error("Save draft error:", error);
      toast.error(t("Failed to save draft."));
    } finally {
      setSaving(false);
    }
  };

  const nextStep = async () => {
    // Validate current step
    if (step === 1) {
      if (!formData.businessName || !formData.location) {
        return toast.error(t("Business Name and Location are required."));
      }
      await saveDraft();
    } else if (step === 2) {
      if (!previews.govId || !previews.license) {
        return toast.error(t("Both Gov ID and Business License are required."));
      }
    } else if (step === 3) {
      if (previews.coverPhotos.length === 0) {
        return toast.error(t("At least one cover photo is required."));
      }
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Final save draft just in case
      await saveDraft();
      
      const res = await api.post('/role-requests/submit');
      if (res.data.success) {
        toast.success(t("Application submitted successfully!"));
        navigate('/camper-dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t("Failed to submit application."));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !application && !rejectionLimitReached) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (rejectionLimitReached) {
    return (
      <div className="max-w-2xl mx-auto p-8 mt-12 bg-white rounded-2xl shadow-sm border border-red-100 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("Application Limit Reached")}</h2>
        <p className="text-gray-500">
          {t("You have reached the maximum number of application attempts (3). You can no longer apply to become a Camp Manager.")}
        </p>
        <button 
          onClick={() => navigate('/camper-dashboard')}
          className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg"
        >
          {t("Return to Dashboard")}
        </button>
      </div>
    );
  }

  // Progress color logic
  const getProgressColor = () => {
    if (step === 1) return 'bg-red-500';
    if (step === 2) return 'bg-orange-500';
    if (step === 3) return 'bg-amber-400'; // light orange
    return 'bg-green-500';
  };
  const progressPercent = (step / 4) * 100;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mr-auto ml-0 md:ml-8 lg:ml-12">
        <div className="mb-10 text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t("List Your Camp")}</h1>
          <p className="text-gray-500 text-base mt-2">{t("Complete the steps below to become a Camp Manager.")}</p>
        </div>
        
        {application?.status === 'rejected' && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-800">{t("Previous Application Rejected")}</h4>
              <p className="text-sm text-red-600 mt-1">{application.rejectionReason}</p>
              <p className="text-xs text-red-500 mt-2 font-bold">{t("Attempts remaining")}: {3 - application.rejectionCount}</p>
            </div>
          </div>
        )}

        <div className="mt-6 relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out ${getProgressColor()}`} 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <span className={step >= 1 ? 'text-gray-900' : ''}>{t("Profile")}</span>
          <span className={step >= 2 ? 'text-gray-900' : ''}>{t("Documents")}</span>
          <span className={step >= 3 ? 'text-gray-900' : ''}>{t("Photos")}</span>
          <span className={step >= 4 ? 'text-gray-900' : ''}>{t("Preview")}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-bold text-gray-900">{t("Camp Profile Details")}</h2>
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              <div className="flex-shrink-0 flex flex-col items-center">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t("Profile Photo")}</label>
                <div 
                  className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100 flex items-center justify-center cursor-pointer relative group"
                  onClick={() => fileInputRefs.profilePicture.current.click()}
                >
                  {previews.profilePicture || user?.profilePicture ? (
                    <img src={previews.profilePicture || user?.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-gray-400" />
                  )}
                  <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-xs font-bold uppercase tracking-wider">
                    {t('Change')}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRefs.profilePicture}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'profilePicture')}
                  />
                </div>
              </div>

              <div className="flex-1 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t("Full Name (Manager)")} *</label>
                  <input
                    type="text"
                    name="managerName"
                    value={formData.managerName}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
                    placeholder={t("e.g. Abebe Bikila")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t("Camp / Business Name")} *</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
                    placeholder={t("e.g. Sunny Valley Retreat")}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t("Base Location")} *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
                placeholder={t("City, Region")}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t("Contact Number")}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
                placeholder="+251 911 00 00 00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t("Description")}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none resize-none"
                placeholder={t("Tell us about your camp...")}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-bold text-gray-900">{t("Compliance Documents")}</h2>
            <p className="text-sm text-gray-500 mb-4">{t("Please provide valid documentation. Accepted formats: JPG, PNG, WEBP.")}</p>

            {/* Gov ID */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
              {previews.govId ? (
                <div className="relative w-full max-h-48 overflow-hidden rounded-lg">
                  <img src={previews.govId} alt="Gov ID" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => fileInputRefs.govId.current.click()} className="px-4 py-2 bg-white rounded-lg text-sm font-bold text-gray-900">{t("Change File")}</button>
                  </div>
                </div>
              ) : (
                <div className="text-center cursor-pointer" onClick={() => fileInputRefs.govId.current.click()}>
                  <UploadCloud className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-blue-600">{t("Upload Government ID")} *</p>
                  <p className="text-xs text-gray-400 mt-1">{t("National ID or Passport scan")}</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" ref={fileInputRefs.govId} onChange={(e) => handleFileChange(e, 'govId')} />
            </div>

            {/* Business License */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
              {previews.license ? (
                <div className="relative w-full max-h-48 overflow-hidden rounded-lg">
                  <img src={previews.license} alt="Business License" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => fileInputRefs.license.current.click()} className="px-4 py-2 bg-white rounded-lg text-sm font-bold text-gray-900">{t("Change File")}</button>
                  </div>
                </div>
              ) : (
                <div className="text-center cursor-pointer" onClick={() => fileInputRefs.license.current.click()}>
                  <UploadCloud className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-blue-600">{t("Upload Business License")} *</p>
                  <p className="text-xs text-gray-400 mt-1">{t("Proving local operational authority")}</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" ref={fileInputRefs.license} onChange={(e) => handleFileChange(e, 'license')} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-xl font-bold text-gray-900">{t("Camp Cover Photos")}</h2>
            <p className="text-sm text-gray-500">{t("Upload up to 5 photos showcasing your campsite. First photo will be the main cover.")}</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {previews.coverPhotos.map((src, index) => (
                <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={src} alt={`Cover ${index+1}`} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeCoverPhoto(index)}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {previews.coverPhotos.length < 5 && (
                <div 
                  onClick={() => fileInputRefs.coverPhotos.current.click()}
                  className="aspect-video border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <UploadCloud className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-xs font-semibold text-gray-500">{t("Add Photo")}</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRefs.coverPhotos} onChange={(e) => handleFileChange(e, 'coverPhotos')} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">{t("Almost done!")}</h2>
              <p className="text-gray-500 mt-1">{t("Review your application details before submitting.")}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">{t("Business Name")}</p>
                  <p className="font-semibold text-gray-900">{formData.businessName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">{t("Location")}</p>
                  <p className="font-semibold text-gray-900">{formData.location}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-bold text-gray-400 uppercase">{t("Description")}</p>
                  <p className="font-medium text-gray-700 text-sm">{formData.description || 'N/A'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
                 <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">{t("Profile Picture")}</p>
                  {(previews.profilePicture || user?.profilePicture) ? <img src={previews.profilePicture || user?.profilePicture} className="h-20 w-20 object-cover rounded-full border border-gray-200 shadow-sm" alt="Profile" /> : <span className="text-gray-500 text-sm">Default</span>}
                 </div>
                 <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">{t("Gov ID")}</p>
                  {previews.govId ? <img src={previews.govId} className="h-20 w-32 object-cover rounded-lg border border-gray-200 shadow-sm" alt="Gov ID" /> : <span className="text-red-500 text-sm font-medium">Missing</span>}
                 </div>
                 <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">{t("License")}</p>
                  {previews.license ? <img src={previews.license} className="h-20 w-32 object-cover rounded-lg border border-gray-200 shadow-sm" alt="License" /> : <span className="text-red-500 text-sm font-medium">Missing</span>}
                 </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between pt-6 border-t border-gray-100">
          {step > 1 ? (
            <button 
              onClick={prevStep}
              className="px-5 py-2.5 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("Back")}
            </button>
          ) : (
             <button 
              onClick={() => navigate('/camper-dashboard')}
              className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
              {t("Cancel")}
            </button>
          )}

          <div className="flex gap-3">
             {step < 4 && (
                <button 
                  onClick={() => saveDraft()}
                  disabled={saving}
                  className="px-5 py-2.5 flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : <Save className="w-4 h-4" />}
                  {t("Save Draft")}
                </button>
             )}
            {step < 4 ? (
              <button 
                onClick={nextStep}
                className="px-5 py-2.5 flex items-center gap-2 text-sm font-semibold text-white bg-gray-900 hover:bg-black rounded-xl transition-colors shadow-sm"
              >
                {t("Continue")}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 flex items-center gap-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors shadow-sm disabled:opacity-70"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle className="w-4 h-4" />}
                {t("Submit Application")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
