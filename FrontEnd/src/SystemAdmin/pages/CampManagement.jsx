import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { Tent, AlertCircle, CheckCircle, Ban, FileText, RefreshCw, MapPin, Users, DollarSign, Shield, Mail, Phone, Briefcase, ExternalLink, User } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import SystemAdminLoader from "../components/SystemAdminLoader";

export function CampManagement() {
  const [pendingCamps, setPendingCamps] = useState([]);
  const [activeCamps, setActiveCamps] = useState([]);
  const [kycQueue, setKycQueue] = useState([]);
  const [stats, setStats] = useState({ active: 0, pending: 0, kyc: 0, blocked: 0 });
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCamp, setSelectedCamp] = useState(null);
  const [editingCamp, setEditingCamp] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", location: "", description: "" });
  const [updating, setUpdating] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, activeRes, kycRes] = await Promise.all([
        api.get('/admin/camps?businessStatus=pending').catch(() => ({ data: { data: [] } })),
        api.get('/admin/camps?status=active').catch(() => ({ data: { data: [] } })),
        api.get('/admin/kyc').catch(() => ({ data: { data: [] } })),
      ]);

      const pending = pendingRes.data?.data ?? [];
      const active = activeRes.data?.data ?? [];
      const kyc = kycRes.data?.data ?? [];

      setPendingCamps(pending);
      setActiveCamps(active);
      setKycQueue(kyc);
      setStats({
        active: active.filter(c => c.status === 'active').length,
        pending: pending.length,
        kyc: kyc.length,
        blocked: active.filter(c => c.status === 'blocked' || c.status === 'banned').length,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load camp data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleApproveCamp = async (id) => {
    try {
      await api.patch(`/admin/camps/${id}/status`, { status: 'active' });
      toast.success(`Camp approved and published`);
      fetchAll();
      setSelectedCamp(null);
    } catch {
      toast.error("Failed to approve camp");
    }
  };

  const handleRejectCamp = async (id) => {
    if (!rejectionReason.trim()) { toast.error("Please provide a rejection reason"); return; }
    try {
      await api.patch(`/admin/camps/${id}/status`, { status: 'rejected', reason: rejectionReason });
      toast.success("Camp rejected");
      setRejectionReason("");
      fetchAll();
      setSelectedCamp(null);
    } catch {
      toast.error("Failed to reject camp");
    }
  };

  const handleUpdateCamp = async () => {
    setUpdating(true);
    try {
      await api.patch(`/admin/camps/${editingCamp._id || editingCamp.id}`, editForm);
      toast.success("Camp details updated successfully");
      setEditingCamp(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update camp");
    } finally {
      setUpdating(false);
    }
  };

  const openEditDialog = (camp, e) => {
    e.stopPropagation();
    setEditingCamp(camp);
    setEditForm({
      name: camp.name || "",
      location: camp.location || "",
      description: camp.description || ""
    });
  };

  const handleBlockCamp = async (id) => {
    try {
      await api.patch(`/admin/camps/${id}/status`, { status: 'blocked' });
      toast.success("Camp temporarily blocked");
      fetchAll();
      setSelectedCamp(null);
    } catch {
      toast.error("Failed to block camp");
    }
  };

  const handleBanCamp = async (id) => {
    try {
      await api.patch(`/admin/camps/${id}/status`, { status: 'banned' });
      toast.success("Camp permanently banned");
      fetchAll();
      setSelectedCamp(null);
    } catch {
      toast.error("Failed to ban camp");
    }
  };

  const handleSendWarning = async (id) => {
    if (!warningMessage.trim()) { toast.error("Please enter a warning message"); return; }
    try {
      await api.post(`/admin/camps/${id}/warn`, { message: warningMessage });
      toast.success("Warning sent to camp");
      setWarningMessage("");
    } catch {
      toast.error("Failed to send warning");
    }
  };

  const handleApproveKYC = async (id) => {
    try {
      await api.patch(`/admin/kyc/${id}`, { status: 'approved' });
      toast.success("KYC document approved");
      fetchAll();
    } catch {
      toast.error("Failed to approve KYC");
    }
  };

  const handleRejectKYC = async (id) => {
    try {
      await api.patch(`/admin/kyc/${id}`, { status: 'rejected' });
      toast.success("KYC document rejected");
      fetchAll();
    } catch {
      toast.error("Failed to reject KYC");
    }
  };

  const filteredActive = activeCamps.filter(c =>
    !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <SystemAdminLoader text="Fetching Platform Camps..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Camp Management</h1>
          <p className="text-gray-500 mt-1">Approve, monitor, and manage all camps on the platform</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Camps",     value: stats.active,  accent: "#10b981", bg: "#f0fdf4", icon: Tent },
          { label: "Pending Approval", value: stats.pending, accent: "#f97316", bg: "#fff7ed", icon: AlertCircle },
          { label: "KYC Pending",      value: stats.kyc,     accent: "#3b82f6", bg: "#eff6ff", icon: FileText },
          { label: "Blocked / Banned", value: stats.blocked, accent: "#ef4444", bg: "#fff1f2", icon: Ban },
        ].map(({ label, value, accent, bg, icon: Icon }) => (
          <div key={label}
            className="rounded-2xl border p-5 flex items-center gap-4 cursor-pointer hover:shadow-sm transition-shadow"
            style={{ background: bg, borderColor: accent + "30" }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "white" }}>
              <Icon className="w-6 h-6" style={{ color: accent }} />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-sm font-medium text-gray-600">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-gray-100/50 p-1 rounded-xl">
          <TabsTrigger value="pending" className="cursor-pointer rounded-lg px-6 py-2">
            Pending {stats.pending > 0 && <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">{stats.pending}</span>}
          </TabsTrigger>
          <TabsTrigger value="active" className="cursor-pointer rounded-lg px-6 py-2">Active Camps</TabsTrigger>
          <TabsTrigger value="kyc" className="cursor-pointer rounded-lg px-6 py-2">
            KYC Queue {stats.kyc > 0 && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{stats.kyc}</span>}
          </TabsTrigger>
        </TabsList>

        {/* Pending Approvals Tab */}
        <TabsContent value="pending" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Registration Requests</h2>
                <p className="text-sm text-gray-500">Review new camp submissions</p>
              </div>
            </div>

            {pendingCamps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 bg-green-50 rounded-full mb-4">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">All clear!</h3>
                <p className="text-gray-500">No camps are awaiting approval.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-16"></TableHead>
                      <TableHead>Camp ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {pendingCamps.map((camp) => (
                      <TableRow 
                        key={camp._id || camp.id} 
                        className="group hover:bg-orange-50/30 cursor-pointer transition-colors"
                      >
                        <TableCell className="py-2">
                          <div 
                            className="w-10 h-10 rounded-full bg-orange-100 overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-orange-400 transition-all"
                            onClick={(e) => { e.stopPropagation(); setSelectedManager(camp.manager); }}
                          >
                            {camp.manager?.profilePicture ? (
                              <img src={camp.manager.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-orange-600 font-bold text-xs">
                                {camp.manager?.name?.charAt(0) || "M"}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell onClick={() => setSelectedCamp(camp)} className="font-mono text-xs text-gray-400">{(camp._id || camp.id)?.slice(-8).toUpperCase()}</TableCell>
                        <TableCell onClick={() => setSelectedCamp(camp)} className="font-medium text-gray-900">{camp.name}</TableCell>
                        <TableCell 
                          onClick={(e) => { e.stopPropagation(); setSelectedManager(camp.manager); }}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {camp.manager?.name || camp.managerName || "—"}
                        </TableCell>
                        <TableCell onClick={() => setSelectedCamp(camp)} className="text-gray-600">{camp.location}</TableCell>
                        <TableCell onClick={() => setSelectedCamp(camp)} className="text-gray-500">{camp.createdAt ? new Date(camp.createdAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell onClick={() => setSelectedCamp(camp)}>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-none capitalize">{camp.businessStatus || camp.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => setSelectedCamp(camp)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Active Camps Tab */}
        <TabsContent value="active" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Active Platform Camps</h2>
                <p className="text-sm text-gray-500">Monitor and manage live listings</p>
              </div>
              <Input
                placeholder="Search camps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64"
              />
            </div>

            {filteredActive.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                  <Tent className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No active camps</h3>
                <p className="text-gray-500">{searchQuery ? "Try a different search term." : "No live camps on the platform yet."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-16"></TableHead>
                      <TableHead>Camp ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredActive.map((camp) => (
                      <TableRow 
                        key={camp._id || camp.id} 
                        className="group hover:bg-green-50/30 cursor-pointer transition-colors"
                      >
                        <TableCell className="py-2">
                          <div 
                            className="w-10 h-10 rounded-full bg-teal-100 overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-teal-400 transition-all"
                            onClick={(e) => { e.stopPropagation(); setSelectedManager(camp.manager); }}
                          >
                            {camp.manager?.profilePicture ? (
                              <img src={camp.manager.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-teal-600 font-bold text-xs">
                                {camp.manager?.name?.charAt(0) || "M"}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell onClick={() => setSelectedCamp(camp)} className="font-mono text-xs text-gray-400">{(camp._id || camp.id)?.slice(-8).toUpperCase()}</TableCell>
                        <TableCell onClick={() => setSelectedCamp(camp)} className="font-medium text-gray-900">{camp.name}</TableCell>
                        <TableCell 
                          onClick={(e) => { e.stopPropagation(); setSelectedManager(camp.manager); }}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {camp.manager?.name || camp.managerName || "—"}
                        </TableCell>
                        <TableCell onClick={() => setSelectedCamp(camp)} className="text-gray-600">{camp.location}</TableCell>
                        <TableCell onClick={() => setSelectedCamp(camp)}>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="font-semibold text-gray-900">{camp.averageRating?.toFixed(1) ?? "0.0"}</span>
                          </div>
                        </TableCell>
                        <TableCell onClick={() => setSelectedCamp(camp)} className="text-gray-600 font-medium">{camp.totalBookings ?? 0}</TableCell>
                        <TableCell onClick={() => setSelectedCamp(camp)}>
                          <Badge 
                            variant={camp.status === "active" ? "default" : "destructive"}
                            className="capitalize border-none shadow-none"
                          >
                            {camp.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={(e) => openEditDialog(camp, e)}
                            >
                              Edit
                            </Button>
                            <Button onClick={() => setSelectedCamp(camp)} variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">Manage</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* KYC Queue Tab */}
        <TabsContent value="kyc" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">KYC Verifications</h2>
                <p className="text-sm text-gray-500">Review manager identity documents</p>
              </div>
            </div>

            {kycQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 bg-green-50 rounded-full mb-4">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Queue empty!</h3>
                <p className="text-gray-500">No KYC documents awaiting review.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-16"></TableHead>
                      <TableHead>KYC ID</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Camp Name</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {kycQueue.map((kyc) => (
                      <TableRow key={kyc._id || kyc.id} className="hover:bg-gray-50/50">
                        <TableCell className="py-2 text-center">
                           <div 
                            className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all inline-block"
                            onClick={() => setSelectedManager(kyc.manager)}
                          >
                            {kyc.manager?.profilePicture ? (
                              <img src={kyc.manager.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                {kyc.manager?.name?.charAt(0) || "M"}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-400">{(kyc._id || kyc.id)?.slice(-8).toUpperCase()}</TableCell>
                        <TableCell 
                          onClick={() => setSelectedManager(kyc.manager)}
                          className="font-medium text-blue-600 hover:underline cursor-pointer"
                        >
                          {kyc.manager?.name || kyc.managerName || "—"}
                        </TableCell>
                        <TableCell className="text-gray-600">{kyc.camp?.name || kyc.campName || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal border-gray-200">{kyc.documentType || kyc.document}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">{kyc.createdAt ? new Date(kyc.createdAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700 border-none capitalize">{kyc.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                             {kyc.manager?.profilePicture && (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="text-blue-600 font-bold"
                                 onClick={() => setViewerDoc({ url: kyc.manager.profilePicture, title: "Manager Profile Photo" })}
                               >
                                 Profile Photo
                               </Button>
                             )}
                             {kyc.manager?.license && (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="text-blue-600 font-bold"
                                 onClick={() => setViewerDoc({ url: kyc.manager.license, title: "Business License" })}
                               >
                                 License
                               </Button>
                             )}
                             {kyc.manager?.govId && (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="text-blue-600 font-bold"
                                 onClick={() => setViewerDoc({ url: kyc.manager.govId, title: "Government ID" })}
                                >
                                 Gov ID
                               </Button>
                             )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600"
                              onClick={() => handleApproveKYC(kyc._id || kyc.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleRejectKYC(kyc._id || kyc.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Document Viewer Modal */}
      <Dialog open={!!viewerDoc} onOpenChange={() => setViewerDoc(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{viewerDoc?.title || "Document"}</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-gray-100">
            {viewerDoc?.url && <img src={viewerDoc.url} alt="Document" className="w-full h-auto max-h-[70vh] object-contain" />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review / Manage Camp Modal */}
      <Dialog open={!!selectedCamp} onOpenChange={() => setSelectedCamp(null)}>
        <DialogContent className="bg-white border-gray-100 shadow-2xl max-w-2xl p-0 overflow-hidden">
          <DialogDescription className="sr-only">Review camp registration and perform moderation actions.</DialogDescription>
          {selectedCamp && (
            <>
              <DialogHeader className="p-6 bg-gradient-to-r from-green-900 to-emerald-800 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-xl overflow-hidden backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    {selectedCamp.manager?.profilePicture ? (
                      <img src={selectedCamp.manager.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Tent className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-white">{selectedCamp.name}</DialogTitle>
                    <p className="text-green-100/80 text-sm mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {selectedCamp.location}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Badge className="bg-white text-green-900 border-none px-3 py-1 capitalize font-bold">
                      {selectedCamp.businessStatus || selectedCamp.status}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Manager</Label>
                    <p className="text-gray-900 font-semibold">{selectedCamp.manager?.name || selectedCamp.managerName || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Business Status</Label>
                    <p className="text-gray-900 font-semibold flex items-center gap-1 capitalize">{selectedCamp.businessStatus || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rating</Label>
                    <p className="text-gray-900 font-semibold flex items-center gap-1">★ {selectedCamp.averageRating?.toFixed(1) ?? "0.0"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-gray-900">Description</Label>
                  <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {selectedCamp.description || "No description provided."}
                  </p>
                </div>

                {/* Manager Verification Details */}
                {(selectedCamp.manager?.license || selectedCamp.manager?.govId) && (
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      Manager Verification Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <Label className="text-xs font-bold text-blue-600 uppercase mb-2 block">Manager Contact</Label>
                        <p className="text-sm font-medium">{selectedCamp.manager?.name}</p>
                        <p className="text-xs text-gray-500">{selectedCamp.manager?.email}</p>
                        <p className="text-xs text-gray-500">{selectedCamp.manager?.phone || "No phone"}</p>
                        {selectedCamp.manager?.businessName && (
                           <p className="text-xs font-semibold mt-1 text-blue-700">Business: {selectedCamp.manager.businessName}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {selectedCamp.manager?.profilePicture ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="justify-start border-blue-200 text-blue-700 hover:bg-blue-50 font-bold"
                            onClick={() => setViewerDoc({ url: selectedCamp.manager.profilePicture, title: "Manager Profile Photo" })}
                          >
                            <User className="w-4 h-4 mr-2" /> View Profile Photo
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400 italic text-xs">
                             <AlertCircle className="w-4 h-4" /> No Profile Photo Uploaded
                          </div>
                        )}
                        {selectedCamp.manager?.license && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="justify-start border-blue-200 text-blue-700 hover:bg-blue-50 font-bold"
                            onClick={() => setViewerDoc({ url: selectedCamp.manager.license, title: "Business License" })}
                          >
                            <FileText className="w-4 h-4 mr-2" /> View Business License
                          </Button>
                        )}
                        {selectedCamp.manager?.govId && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="justify-start border-blue-200 text-blue-700 hover:bg-blue-50 font-bold"
                            onClick={() => setViewerDoc({ url: selectedCamp.manager.govId, title: "Government ID" })}
                          >
                            <Shield className="w-4 h-4 mr-2" /> View Government ID
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(selectedCamp.businessStatus === 'pending' || selectedCamp.status === 'pending') ? (
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <h4 className="font-bold text-gray-900">Registration Review</h4>
                    <div className="space-y-4 bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">Rejection Reason (if applicable)</Label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Why is this camp being rejected? Be specific."
                          className="bg-white border-gray-200 text-sm"
                        />
                      </div>
                      <div className="flex gap-4">
                        <Button 
                          onClick={() => handleApproveCamp(selectedCamp._id || selectedCamp.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-lg font-bold shadow-lg shadow-green-200"
                        >
                          Approve Registration
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => handleRejectCamp(selectedCamp._id || selectedCamp.id)}
                          className="flex-1 h-12 text-lg font-bold shadow-lg shadow-red-200"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <h4 className="font-bold text-gray-900">Administrative Actions</h4>
                    <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <div>
                        <Label className="text-sm font-semibold mb-2 block text-yellow-800">Send Official Warning</Label>
                        <div className="flex gap-2">
                          <Input
                            value={warningMessage}
                            onChange={(e) => setWarningMessage(e.target.value)}
                            placeholder="Reason for warning..."
                            className="bg-white text-sm"
                          />
                          <Button 
                            variant="secondary" 
                            className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none"
                            onClick={() => handleSendWarning(selectedCamp._id || selectedCamp.id)}
                          >
                            Send
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          className="border-orange-200 text-orange-700 hover:bg-orange-50"
                          onClick={() => handleBlockCamp(selectedCamp._id || selectedCamp.id)}
                        >
                          <Ban className="w-4 h-4 mr-2" /> Block
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => handleBanCamp(selectedCamp._id || selectedCamp.id)}
                        >
                          <Ban className="w-4 h-4 mr-2" /> Permanent Ban
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 border-t flex justify-end">
                <Button variant="ghost" onClick={() => setSelectedCamp(null)}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Camp Details Modal */}
      <Dialog open={!!editingCamp} onOpenChange={() => setEditingCamp(null)}>
        <DialogContent className="bg-white border-gray-100 shadow-2xl max-w-lg p-0">
          <DialogDescription className="sr-only">Edit camp listing details including name, location, and description.</DialogDescription>
          {editingCamp && (
            <>
              <DialogHeader className="p-6 border-b">
                <DialogTitle className="text-xl font-bold">Edit Camp Details</DialogTitle>
                <p className="text-sm text-gray-500">Modify camp listing information</p>
              </DialogHeader>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Camp Name</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={editForm.location} onChange={(e) => setEditForm(p => ({ ...p, location: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label>Price Per Night (ETB)</Label>
                    <Input type="number" value={editForm.price} onChange={(e) => setEditForm(p => ({ ...p, price: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))} rows={4} />
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingCamp(null)}>Cancel</Button>
                <Button 
                  onClick={handleUpdateCamp}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Manager Profile Popup (Chat Style) */}
      <Dialog open={!!selectedManager} onOpenChange={() => setSelectedManager(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white border-none shadow-2xl rounded-3xl">
          <DialogTitle className="sr-only">Manager Profile - {selectedManager?.name}</DialogTitle>
          <DialogDescription className="sr-only">Detailed profile preview for camp manager verification and contact.</DialogDescription>
          {selectedManager && (
            <div className="flex flex-col">
              {/* Profile Header Background */}
              <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-700 relative">
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                  <div className="w-24 h-24 rounded-3xl bg-white p-1.5 shadow-xl">
                    <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
                      {selectedManager.profilePicture ? (
                        <img src={selectedManager.profilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="pt-16 pb-8 px-8 text-center">
                <h3 className="text-2xl font-bold text-gray-900">{selectedManager.name}</h3>
                <p className="text-blue-600 font-semibold text-sm mt-1 uppercase tracking-wider">Camp Manager</p>
                
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-gray-100/80">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Email Address</p>
                      <p className="text-sm font-medium text-gray-700 truncate">{selectedManager.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-gray-100/80">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-green-600">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</p>
                      <p className="text-sm font-medium text-gray-700">{selectedManager.phone || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-gray-100/80">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-orange-600">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Business Entity</p>
                      <p className="text-sm font-medium text-gray-700">{selectedManager.businessName || "Private Listing"}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <Button 
                    className="rounded-2xl bg-blue-600 hover:bg-blue-700 h-12 font-bold"
                    onClick={() => window.location.href = `mailto:${selectedManager.email}`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-2xl border-gray-200 h-12 font-bold"
                    onClick={() => setSelectedManager(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
