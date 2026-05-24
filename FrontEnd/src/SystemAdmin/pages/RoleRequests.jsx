import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText, 
  Tent,
  AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import SystemAdminLoader from "../components/SystemAdminLoader";
import api from "../../services/api";

export const RoleRequests = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/role-requests');
      setRequests(res.data?.data || []);
    } catch (err) {
      toast.error(t("Failed to fetch role requests"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    if (status === 'rejected' && !rejectReason.trim()) {
      return toast.error(t("Please provide a rejection reason."));
    }

    setProcessing(true);
    try {
      await api.put(`/role-requests/${id}/review`, { 
        status, 
        rejectionReason: status === 'rejected' ? rejectReason : undefined 
      });
      toast.success(t(`Application ${status} successfully.`));
      setRejectReason("");
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || t("Failed to process request."));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <SystemAdminLoader text={t("Loading requests...")} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("Role Escalation Requests")}</h1>
          <p className="text-gray-500 text-sm mt-1">{t("Review applications from campers wanting to become Camp Managers.")}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("Camper")}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("Business Name")}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("Location")}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("Status")}</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t("Action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>{t("No pending role requests.")}</p>
                  </td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          {req.userId?.profilePicture ? (
                            <img src={req.userId.profilePicture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                              {req.userId?.fullName?.charAt(0) || "U"}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{req.userId?.fullName}</p>
                          <p className="text-xs text-gray-500">{req.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-900 font-medium">
                      {req.businessName}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {req.location}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
                        {t(req.status)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedRequest(req)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t("Review")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Tent className="w-5 h-5 text-green-600" />
                {t("Application Review")}
              </h2>
              <button 
                onClick={() => { setSelectedRequest(null); setRejectReason(""); }}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Profile Details */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">{t("Camp Profile Details")}</h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">{t("Business Name")}</p>
                      <p className="font-medium text-gray-900">{selectedRequest.businessName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">{t("Location")}</p>
                      <p className="font-medium text-gray-900">{selectedRequest.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">{t("Phone")}</p>
                      <p className="font-medium text-gray-900">{selectedRequest.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">{t("Applicant")}</p>
                      <p className="font-medium text-gray-900">{selectedRequest.userId?.fullName} ({selectedRequest.userId?.email})</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 uppercase font-semibold">{t("Description")}</p>
                      <p className="font-medium text-gray-700 mt-1">{selectedRequest.description}</p>
                    </div>
                 </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">{t("Compliance Documents")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                     <p className="text-sm font-semibold text-gray-700 mb-2">{t("Profile Picture")}</p>
                     <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        {selectedRequest.profilePicture || selectedRequest.userId?.profilePicture ? (
                           <a href={selectedRequest.profilePicture || selectedRequest.userId?.profilePicture} target="_blank" rel="noreferrer">
                             <img src={selectedRequest.profilePicture || selectedRequest.userId?.profilePicture} alt="Profile Picture" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                           </a>
                        ) : (
                           <span className="flex items-center justify-center h-full text-gray-400">{t("No Document")}</span>
                        )}
                     </div>
                  </div>
                  <div>
                     <p className="text-sm font-semibold text-gray-700 mb-2">{t("Government ID")}</p>
                     <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        {selectedRequest.govId ? (
                           <a href={selectedRequest.govId} target="_blank" rel="noreferrer">
                             <img src={selectedRequest.govId} alt="Gov ID" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                           </a>
                        ) : (
                           <span className="flex items-center justify-center h-full text-gray-400">{t("No Document")}</span>
                        )}
                     </div>
                  </div>
                  <div>
                     <p className="text-sm font-semibold text-gray-700 mb-2">{t("Business License")}</p>
                     <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        {selectedRequest.license ? (
                           <a href={selectedRequest.license} target="_blank" rel="noreferrer">
                             <img src={selectedRequest.license} alt="License" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                           </a>
                        ) : (
                           <span className="flex items-center justify-center h-full text-gray-400">{t("No Document")}</span>
                        )}
                     </div>
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">{t("Cover Photos")}</h3>
                {selectedRequest.coverPhotos?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedRequest.coverPhotos.map((photo, i) => (
                      <div key={i} className="aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        <a href={photo} target="_blank" rel="noreferrer">
                           <img src={photo} alt={`Cover ${i}`} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                   <p className="text-sm text-gray-500">{t("No cover photos provided.")}</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 sticky bottom-0">
               <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t("Rejection Reason (if rejecting)")}</label>
                    <input 
                      type="text" 
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder={t("e.g. License is expired or blurred")}
                      className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => handleReview(selectedRequest._id, 'rejected')}
                      disabled={processing}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      {t("Reject")}
                    </button>
                    <button 
                      onClick={() => handleReview(selectedRequest._id, 'approved')}
                      disabled={processing}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {processing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle className="w-4 h-4" />}
                      {t("Approve & Promote")}
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
