import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "../ui/dialog";
import { Users, UserPlus, Ban, AlertTriangle, Shield, RefreshCw, FileText, Check, Eye, Clock, Bell, Trash2 } from "lucide-react";
import { Mail } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import SystemAdminLoader from "../components/SystemAdminLoader";
import api from "../../services/api";
import ModerationHistoryView from "../components/ModerationHistoryView";

export function UserManagement() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "campers";
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "" });
  const [updating, setUpdating] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [banReason, setBanReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [actionModal, setActionModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userWarnings, setUserWarnings] = useState([]);
  const [loadingWarnings, setLoadingWarnings] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [createForm, setCreateForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", role: "", password: "", sendEmail: false
  });
  const [creating, setCreating] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.data ?? []);
    } catch (err) {
      console.error(err);
      toast.error(t("Failed to fetch users"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const campers = users.filter(u => u.role === 'camper' && u.status !== 'soft_deleted');
  const managers = users.filter(u => (u.role === 'manager' || u.role === 'camp_manager') && u.status !== 'soft_deleted');
  const appeals = users.filter(u => u.hasAppeal && u.status !== 'soft_deleted');
  const archived = users.filter(u => u.status === 'soft_deleted');

  const totalCampersCount = campers.length;
  const totalManagersCount = managers.length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;
  const bannedCount = users.filter(u => u.status === 'banned').length;

  const filterUsers = (list) => {
    return list.filter(u => {
      const matchesSearch = !searchQuery ||
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const updateStatus = async (id, status, reason = "") => {
    try {
      await api.patch(`/admin/users/${id}/status`, { status, reason });
      toast.success(`${t("User status updated to")} ${t(status)}`);
      fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t("Failed to update status"));
    }
  };

  const handleUpdateUser = async () => {
    if (!editForm.name || !editForm.email) {
      toast.error(t("Name and Email are required"));
      return;
    }
    setUpdating(true);
    try {
      await api.patch(`/admin/users/${editingUser._id || editingUser.id}`, editForm);
      toast.success(t("User details updated successfully"));
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || t("Failed to update user"));
    } finally {
      setUpdating(false);
    }
  };

  const openManageDialog = async (user) => {
    setSelectedUser(user);
    setLoadingWarnings(true);
    setLoadingBookings(true);
    try {
      const res = await api.get(`/admin/users/${user._id || user.id}/warnings`);
      setUserWarnings(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch warnings", err);
    } finally {
      setLoadingWarnings(false);
    }
    try {
      const res = await api.get(`/admin/users/${user._id || user.id}/bookings`);
      setUserBookings(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const openEditDialog = (user, e) => {
    e.stopPropagation();
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || ""
    });
  };

  const handleBanUser = (user) => {
    setBanReason("");
    setActionModal({ type: "ban", user });
  };
  const handleSuspendUser = (user) => {
    setSuspendReason("");
    setActionModal({ type: "suspend", user });
  };
  const handleForceDelete = (user) => {
    setActionModal({ type: "forceDelete", user });
  };
  const handleUnblockUser = (id) => updateStatus(id, "active");

  const confirmAction = async () => {
    if (!actionModal) return;
    const { type, user } = actionModal;
    const id = user._id || user.id;
    if (type === "forceDelete") {
      try {
        await api.delete(`/admin/users/${id}/force-delete`);
        toast.success(t("Account permanently deleted and anonymized."));
        fetchUsers();
        setSelectedUser(null);
      } catch (err) {
        toast.error(err.response?.data?.message || t("Failed to force delete account"));
      }
    } else if (type === "ban") {
      if (!banReason.trim()) { toast.error(t("Please provide a reason for the ban")); return; }
      updateStatus(id, "banned", banReason);
    } else {
      if (!suspendReason.trim()) { toast.error(t("Please provide a reason for the suspension")); return; }
      updateStatus(id, "suspended", suspendReason);
    }
    setActionModal(null);
  };

  const handleSendWarning = async (id) => {
    if (!warningMessage.trim()) { toast.error(t("Please enter a warning message")); return; }
    try {
      await api.post(`/admin/users/${id}/warn`, { message: warningMessage });
      toast.success(t("Warning sent to user"));
      setWarningMessage("");
    } catch {
      toast.error(t("Failed to send warning"));
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.role || !createForm.password) {
      toast.error(t("Please fill in all required fields"));
      return;
    }
    setCreating(true);
    try {
      await api.post('/admin/users', {
        name: `${createForm.firstName} ${createForm.lastName}`,
        email: createForm.email,
        phone: createForm.phone,
        role: createForm.role,
        password: createForm.password,
        sendWelcomeEmail: createForm.sendEmail,
      });
      toast.success(t("User account created successfully"));
      setCreateForm({ firstName: "", lastName: "", email: "", phone: "", role: "", password: "", sendEmail: false });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || t("Failed to create user"));
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeRole = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: 'camper' });
      toast.success(t("Manager role revoked"));
      fetchUsers();
    } catch {
      toast.error(t("Failed to revoke role"));
    }
  };

  if (loading) {
    return <SystemAdminLoader text={t("Fetching System Users...")} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('User Management')}</h1>
          <p className="text-gray-500 mt-1">{t('Manage all user accounts across the platform')}</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          {t('Refresh')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("Total Campers"), value: totalCampersCount, accent: "#3b82f6", bg: "#eff6ff", icon: Users },
          { label: t("Camp Managers"), value: totalManagersCount, accent: "#10b981", bg: "#f0fdf4", icon: Shield },
          { label: t("Suspended"),     value: suspendedCount,     accent: "#f59e0b", bg: "#fffbeb", icon: AlertTriangle },
          { label: t("Banned"),        value: bannedCount,        accent: "#ef4444", bg: "#fff1f2", icon: Ban },
        ].map(({ label, value, accent, bg, icon: Icon }) => (
          <div key={label}
            className="rounded-2xl border p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group"
            style={{ background: bg, borderColor: accent + "30" }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm group-hover:scale-110 transition-transform">
              <Icon className="w-6 h-6" style={{ color: accent }} />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900 leading-tight">{value}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100/50 p-1 rounded-xl">
          <TabsTrigger value="campers" className="cursor-pointer rounded-lg px-6 py-2 font-bold">{t('Camper Accounts')}</TabsTrigger>
          <TabsTrigger value="managers" className="cursor-pointer rounded-lg px-6 py-2 font-bold">{t('Camp Managers')}</TabsTrigger>
          <TabsTrigger value="appeals" className="cursor-pointer rounded-lg px-6 py-2 relative font-bold">
            {t('Pending Appeals')}
            {appeals.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse font-black">
                {appeals.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived" className="cursor-pointer rounded-lg px-6 py-2 font-bold">{t('Archived')}</TabsTrigger>
          <TabsTrigger value="create" className="cursor-pointer rounded-lg px-6 py-2 font-bold">{t('Create User')}</TabsTrigger>
        </TabsList>

        <TabsContent value="campers" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('Camper Accounts')}</h2>
                <p className="text-sm text-gray-500 font-medium">{t('Manage customer accounts and moderation')}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder={t('Search users...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 bg-gray-50 border-gray-200"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-gray-50 border-gray-200 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">{t('All Status')}</SelectItem>
                    <SelectItem value="active">{t('Active')}</SelectItem>
                    <SelectItem value="suspended">{t('Suspended')}</SelectItem>
                    <SelectItem value="banned">{t('Banned')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filterUsers(campers).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="p-6 bg-gray-50 rounded-full mb-6">
                  <Users className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{t('No campers found')}</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto font-medium">{t('Try adjusting your search or filters to find what you\'re looking for.')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-bold">{t('User ID')}</TableHead>
                      <TableHead className="font-bold">{t('Name')}</TableHead>
                      <TableHead className="font-bold">{t('Email')}</TableHead>
                      <TableHead className="font-bold">{t('Phone')}</TableHead>
                      <TableHead className="font-bold">{t('Joined')}</TableHead>
                      <TableHead className="font-bold">{t('Status')}</TableHead>
                      <TableHead className="text-right font-bold">{t('Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterUsers(campers).map((user) => (
                      <TableRow 
                        key={user._id || user.id} 
                        className="group hover:bg-gray-50/50 cursor-pointer transition-colors"
                        onClick={() => openManageDialog(user)}
                      >
                        <TableCell className="font-mono text-[10px] text-gray-400 font-bold uppercase tracking-widest">{(user._id || user.id)?.slice(-8)}</TableCell>
                        <TableCell className="font-bold text-gray-900">{user.name}</TableCell>
                        <TableCell className="text-gray-600 font-medium">{user.email}</TableCell>
                        <TableCell className="text-gray-600 font-medium">{user.phone || "—"}</TableCell>
                        <TableCell className="text-gray-500 font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>
                          <Badge 
                            className="capitalize font-bold"
                            variant={
                              user.status === "active" ? "default" :
                                user.status === "suspended" ? "secondary" : "destructive"
                            }
                          >
                            {t(user.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => openEditDialog(user, e)}
                              className="text-blue-600 border-blue-100 hover:bg-blue-50 font-bold shadow-sm"
                            >
                              {t('Edit')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-600 border-gray-100 hover:bg-gray-50 font-bold shadow-sm"
                            >
                              {t('Manage')}
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

        <TabsContent value="managers" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('Camp Managers')}</h2>
                <p className="text-sm text-gray-500 font-medium">{t('Manage camp owner and operator accounts')}</p>
              </div>
              <Input
                placeholder={t('Search managers...')}
                className="w-full md:w-64 bg-gray-50 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {filterUsers(managers).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="p-6 bg-gray-50 rounded-full mb-6">
                  <Shield className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{t('No camp managers found')}</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto font-medium">{t('Managers who registered will appear here after approval.')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-bold">{t('User ID')}</TableHead>
                      <TableHead className="font-bold">{t('Name')}</TableHead>
                      <TableHead className="font-bold">{t('Email')}</TableHead>
                      <TableHead className="font-bold">{t('Phone')}</TableHead>
                      <TableHead className="font-bold">{t('Joined')}</TableHead>
                      <TableHead className="font-bold">{t('Status')}</TableHead>
                      <TableHead className="text-right font-bold">{t('Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterUsers(managers).map((manager) => (
                      <TableRow 
                        key={manager._id || manager.id} 
                        className="group hover:bg-gray-50/50 cursor-pointer transition-colors"
                        onClick={() => openManageDialog(manager)}
                      >
                        <TableCell className="font-mono text-[10px] text-gray-400 font-bold uppercase tracking-widest">{(manager._id || manager.id)?.slice(-8)}</TableCell>
                        <TableCell className="font-bold text-gray-900">{manager.name}</TableCell>
                        <TableCell className="text-gray-600 font-medium">{manager.email}</TableCell>
                        <TableCell className="text-gray-600 font-medium">{manager.phone || "—"}</TableCell>
                        <TableCell className="text-gray-500 font-medium">{manager.createdAt ? new Date(manager.createdAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>
                          <Badge 
                            className="capitalize font-bold"
                            variant={manager.status === "active" ? "default" : "secondary"}
                          >
                            {t(manager.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => openEditDialog(manager, e)}
                              className="text-blue-600 border-blue-100 hover:bg-blue-50 font-bold shadow-sm"
                            >
                              {t('Edit')}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-gray-600 border-gray-100 hover:bg-gray-50 font-bold shadow-sm"
                            >
                              {t('Manage')}
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

        <TabsContent value="archived" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('Archived Users')}</h2>
                <p className="text-sm text-gray-500 font-medium">{t('Soft-deleted accounts (anonymized for compliance)')}</p>
              </div>
              <Input
                placeholder={t('Search archives...')}
                className="w-full md:w-64 bg-gray-50 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {filterUsers(archived).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="p-6 bg-gray-50 rounded-full mb-6">
                  <Trash2 className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{t('No archived accounts')}</h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-bold">{t('User ID')}</TableHead>
                      <TableHead className="font-bold">{t('Name')}</TableHead>
                      <TableHead className="font-bold">{t('Deleted At')}</TableHead>
                      <TableHead className="font-bold">{t('Role')}</TableHead>
                      <TableHead className="text-right font-bold">{t('Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterUsers(archived).map((u) => (
                      <TableRow 
                        key={u._id || u.id} 
                        className="group hover:bg-gray-50/50 cursor-pointer transition-colors"
                        onClick={() => openManageDialog(u)}
                      >
                        <TableCell className="font-mono text-[10px] text-gray-400 font-bold uppercase tracking-widest">{(u._id || u.id)?.slice(-8)}</TableCell>
                        <TableCell className="font-bold text-gray-900">{u.name}</TableCell>
                        <TableCell className="text-gray-500 font-medium">{u.deletedAt ? new Date(u.deletedAt).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="capitalize text-gray-600 font-medium">{t(u.role?.replace('_', ' '))}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-gray-600 border-gray-100 hover:bg-gray-50 font-bold shadow-sm"
                          >
                            {t('View Record')}
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

        <TabsContent value="create" className="space-y-6">
          <div className="rounded-2xl p-8 bg-white border border-gray-200 shadow-sm max-w-4xl mx-auto overflow-hidden">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-blue-50 rounded-2xl shadow-inner">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">{t('Create New User Account')}</h2>
                <p className="text-gray-500 font-medium">{t('Add a new user manually with specific roles and permissions')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('First Name *')}</Label>
                    <Input
                      id="firstName"
                      placeholder="e.g. Abebe"
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm(f => ({ ...f, firstName: e.target.value }))}
                      className="bg-gray-50/50 border-gray-200 focus:bg-white transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('Last Name *')}</Label>
                    <Input
                      id="lastName"
                      placeholder="e.g. Kebede"
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm(f => ({ ...f, lastName: e.target.value }))}
                      className="bg-gray-50/50 border-gray-200 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('Email Address *')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                    className="bg-gray-50/50 border-gray-200 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('Phone Number')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+251-9XX-XXXXXX"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                    className="bg-gray-50/50 border-gray-200 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('User Role *')}</Label>
                  <Select
                    value={createForm.role}
                    onValueChange={(v) => setCreateForm(f => ({ ...f, role: v }))}
                  >
                    <SelectTrigger id="role" className="bg-gray-50/50 border-gray-200 focus:bg-white transition-all font-medium">
                      <SelectValue placeholder={t('Select role')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="camper">{t('Camper (Customer)')}</SelectItem>
                      <SelectItem value="camp_manager">{t('Camp Manager')}</SelectItem>
                      <SelectItem value="admin">{t('Administrator')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('Initial Password *')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('At least 8 characters')}
                    value={createForm.password}
                    onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    className="bg-gray-50/50 border-gray-200 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    className="w-5 h-5 rounded-lg border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer shadow-sm"
                    checked={createForm.sendEmail}
                    onChange={(e) => setCreateForm(f => ({ ...f, sendEmail: e.target.checked }))}
                  />
                  <Label htmlFor="sendEmail" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                    {t('Send welcome email with login credentials')}
                  </Label>
                </div>
              </div>
            </div>

            <div className="mt-12 flex justify-end gap-4 border-t border-gray-100 pt-10">
              <Button
                variant="outline"
                onClick={() => setCreateForm({ firstName: "", lastName: "", email: "", phone: "", role: "", password: "", sendEmail: false })}
                className="px-8 font-bold border-gray-200"
              >
                {t('Clear Form')}
              </Button>
              <Button
                onClick={handleCreateUser}
                size="lg"
                className="px-10 font-black shadow-lg"
                disabled={creating}
              >
                {creating ? t("Creating...") : t("Create User Account")}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appeals" className="space-y-6">
          <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-7 h-7 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">{t('User Appeals Review')}</h2>
                <p className="text-sm text-gray-500 font-medium">{t('Review and act on restriction appeals from users')}</p>
              </div>
            </div>

            {appeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                  <Check className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{t('No pending appeals')}</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto font-medium">{t('All user appeals have been reviewed and addressed.')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appeals.map(user => (
                  <div key={user._id || user.id} className="p-6 border border-gray-100 rounded-2xl bg-white hover:border-orange-200 transition-all shadow-sm group">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-xl font-black text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                          {user.name?.charAt(0) || user.fullName?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 text-lg">{user.name || user.fullName}</h4>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-gray-200">
                              {t(user.role?.replace('_', ' '))}
                            </Badge>
                            <Badge className={`font-bold ${user.status === 'banned' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                              {t(user.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-green-50 text-green-700 border-green-100 hover:bg-green-100 font-bold px-5"
                          onClick={() => updateStatus(user._id || user.id, 'active')}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {t('Accept Appeal')}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100 font-bold px-5"
                          onClick={() => openManageDialog(user)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {t('Review & Update')}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 p-5 bg-gray-50/80 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        {t('Appeal Message')}
                      </p>
                      <p className="text-sm text-gray-800 leading-relaxed italic font-medium">
                        &ldquo;{user.appealMessage}&rdquo;
                      </p>
                    </div>

                    {user.banReason && (
                      <div className="mt-4 px-5 py-2.5 bg-red-50/50 rounded-xl text-xs text-red-600 font-bold border border-red-50 flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        <span className="opacity-70 uppercase tracking-wider">{t('Current Ban Reason:')}</span>
                        <span className="text-red-800">{user.banReason}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-white border-gray-100 shadow-2xl max-w-2xl p-0 overflow-hidden rounded-[2rem]">
          <DialogDescription className="sr-only">Manage user status, roles, and warnings.</DialogDescription>
          {selectedUser && (
            <>
              <DialogHeader className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-3xl font-black backdrop-blur-md border border-white/20 shadow-xl">
                    {selectedUser.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <DialogTitle className="text-3xl font-black text-white tracking-tight">{selectedUser.name}</DialogTitle>
                    <div className="flex items-center gap-2 text-gray-400 font-bold text-sm">
                      <Mail className="w-4 h-4" />
                      {selectedUser.email}
                    </div>
                  </div>
                  <div className="ml-auto flex flex-col items-end gap-2">
                    <Badge variant={selectedUser.status === "active" ? "default" : "destructive"} className={selectedUser.status === "active" ? "bg-green-500 hover:bg-green-600 font-black px-4 py-1.5 shadow-lg text-white" : "bg-red-500 hover:bg-red-600 font-black px-4 py-1.5 shadow-lg text-white"}>
                      {t(selectedUser.status)}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-8 space-y-10 max-h-[65vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('Phone Number')}</Label>
                    <p className="text-gray-900 font-bold text-lg">{selectedUser.phone || t("Not provided")}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('Account Role')}</Label>
                    <p className="text-gray-900 font-bold text-lg capitalize">{t(selectedUser.role?.replace('_', ' '))}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('Registration Date')}</Label>
                    <p className="text-gray-900 font-bold text-lg">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : t("Unknown")}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('Warning Count')}</Label>
                    <p className="text-gray-900 font-bold text-lg">{selectedUser.warningCount || 0} {t('Warnings')}</p>
                  </div>
                </div>

                {(selectedUser.role === 'manager' || selectedUser.role === 'camp_manager') && (
                  <div className="space-y-6 pt-10 border-t border-gray-100">
                    <h4 className="font-black text-gray-900 flex items-center gap-3 text-sm uppercase tracking-widest">
                      <Shield className="w-5 h-5 text-blue-600" />
                      {t('Manager Verification')}
                    </h4>
                    <div className="bg-blue-50/40 p-8 rounded-[2rem] border border-blue-100 shadow-inner space-y-6">
                      {selectedUser.businessName && (
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 block">{t('Business Name')}</Label>
                          <p className="text-lg font-black text-gray-900">{selectedUser.businessName}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Business License')}</Label>
                          {selectedUser.license ? (
                            <Button 
                              variant="outline" 
                              className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-100 bg-white font-bold h-12 shadow-sm rounded-xl"
                              onClick={() => window.open(selectedUser.license, '_blank')}
                            >
                              <FileText className="w-4 h-4 mr-3" /> {t('View License')}
                            </Button>
                          ) : (
                            <div className="p-3 border-2 border-dashed border-blue-200 rounded-xl text-[10px] font-bold text-blue-300 text-center uppercase tracking-widest flex items-center justify-center h-12">{t('No license uploaded')}</div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Government ID')}</Label>
                          {selectedUser.govId ? (
                            <Button 
                              variant="outline" 
                              className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-100 bg-white font-bold h-12 shadow-sm rounded-xl"
                              onClick={() => window.open(selectedUser.govId, '_blank')}
                            >
                              <Shield className="w-4 h-4 mr-3" /> {t('View Gov ID')}
                            </Button>
                          ) : (
                            <div className="p-3 border-2 border-dashed border-blue-200 rounded-xl text-[10px] font-bold text-blue-300 text-center uppercase tracking-widest flex items-center justify-center h-12">{t('No ID uploaded')}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6 pt-10 border-t border-gray-100">
                  <h4 className="font-black text-gray-900 flex items-center gap-3 text-sm uppercase tracking-widest">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    {t('Moderation History & Tracking')}
                  </h4>

                  <div className="bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-800 p-2">
                    <div className="p-5 flex items-center gap-3 border-b border-gray-800">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">{t('Decision Timeline')}</span>
                    </div>
                    <ModerationHistoryView userId={selectedUser._id || selectedUser.id} isAdmin={true} />
                  </div>
                </div>

                <div className="space-y-6 pt-10 border-t border-gray-100">
                  <h4 className="font-black text-gray-900 flex items-center gap-3 text-sm uppercase tracking-widest">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    {t('Booking & Payment History')}
                  </h4>
                  <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                    {loadingBookings ? (
                      <div className="flex justify-center py-10"><RefreshCw className="animate-spin w-8 h-8 text-gray-300" /></div>
                    ) : userBookings.length > 0 ? (
                      <div className="space-y-3">
                        {userBookings.map(b => (
                          <div key={b._id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm hover:border-indigo-200 transition-colors">
                            <div className="flex-1">
                              <p className="text-sm text-gray-800 font-bold">{b.campId?.name || t('Unknown Camp')}</p>
                              <p className="text-[10px] text-gray-400 mt-1 font-medium">{new Date(b.createdAt).toLocaleDateString()} • {b.reservationCode}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-gray-900">${b.totalAmount}</p>
                              <Badge variant="outline" className="mt-1 text-[10px] font-bold">
                                {t(b.status)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-10 italic font-medium">{t('No booking records for this user.')}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-6 pt-10 border-t border-gray-100">
                  <h4 className="font-black text-gray-900 flex items-center gap-3 text-sm uppercase tracking-widest">
                    <Bell className="w-5 h-5 text-yellow-500" />
                    {t('Warnings & Alerts')}
                  </h4>

                  {selectedUser.hasAppeal && (
                    <div className="bg-orange-50 p-8 rounded-[2rem] border-2 border-orange-200 animate-pulse mb-8 shadow-inner">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                          <FileText className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">{t('Active User Appeal')}</p>
                          <h4 className="text-lg font-black text-gray-900 leading-tight">{t('Justification for Restoration')}</h4>
                        </div>
                      </div>
                      <div className="bg-white/90 p-5 rounded-2xl border border-orange-100 shadow-sm">
                        <p className="text-gray-800 leading-relaxed italic font-medium">
                          &ldquo;{selectedUser.appealMessage}&rdquo;
                        </p>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <Button 
                          className="flex-1 bg-gray-900 hover:bg-black text-white font-black h-12 shadow-lg rounded-xl"
                          onClick={() => handleUnblockUser(selectedUser._id || selectedUser.id)}
                        >
                          {t('Accept Appeal & Unban')}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 space-y-8">
                    {loadingWarnings ? (
                      <div className="flex justify-center py-10"><RefreshCw className="animate-spin w-8 h-8 text-gray-300" /></div>
                    ) : userWarnings.length > 0 ? (
                      <div className="space-y-3">
                        {userWarnings.map(w => (
                          <div key={w._id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex-1">
                              <p className="text-sm text-gray-800 font-bold line-clamp-1">{w.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1 font-medium">{new Date(w.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-6">
                              {w.isRead ? (
                                <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 font-bold px-3">
                                  <Check className="w-3 h-3 mr-1" /> {t('Received')}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-gray-200 font-bold px-3">
                                  {t('Sent')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-10 italic font-medium">{t('No warning history for this user.')}</p>
                    )}

                    <div className="pt-8 border-t border-gray-200">
                      <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">{t('Send Official Warning')}</Label>
                      <Textarea
                        value={warningMessage}
                        onChange={(e) => setWarningMessage(e.target.value)}
                        placeholder={t("Detail the infraction... this will be sent to the user's dashboard.")}
                        className="bg-white border-gray-200 min-h-[120px] rounded-2xl p-5 text-sm font-medium resize-none shadow-inner"
                      />
                      <Button
                        variant="secondary"
                        size="lg"
                        className="mt-4 w-full bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 font-black h-12 shadow-sm rounded-xl"
                        onClick={async () => {
                          await handleSendWarning(selectedUser._id || selectedUser.id);
                          const res = await api.get(`/admin/users/${selectedUser._id || selectedUser.id}/warnings`);
                          setUserWarnings(res.data.data || []);
                        }}
                      >
                        {t('Send Warning Message')}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      {selectedUser.status === "active" || selectedUser.status === "pending" ? (
                        <>
                          <Button
                            variant="outline"
                            className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 font-black h-12 rounded-xl shadow-sm"
                            onClick={() => handleSuspendUser(selectedUser)}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            {t('Suspend Account')}
                          </Button>
                          <Button
                            variant="destructive"
                            className="w-full font-black h-12 rounded-xl shadow-lg"
                            onClick={() => handleBanUser(selectedUser)}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            {t('Permanently Ban')}
                          </Button>
                        </>
                      ) : selectedUser.status === "soft_deleted" ? (
                        <div className="col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                          <p className="text-sm font-bold text-gray-500">{t('Account is permanently archived/soft-deleted and cannot be restored from here.')}</p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full border-green-200 text-green-700 hover:bg-green-50 col-span-2 font-black h-14 rounded-2xl shadow-md text-lg"
                          onClick={() => handleUnblockUser(selectedUser._id || selectedUser.id)}
                        >
                          {t('Restore Account Access')}
                        </Button>
                      )}
                    </div>
                    
                    {/* Add Force Delete for banned/suspended/restricted */}
                    {(selectedUser.status === "banned" || selectedUser.status === "suspended" || selectedUser.status === "restricted") && (
                      <div className="pt-4 border-t border-red-100 mt-4">
                        <Button
                          variant="destructive"
                          className="w-full bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 font-black h-12 rounded-xl shadow-sm"
                          onClick={() => handleForceDelete(selectedUser)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('Force Delete Account')}
                        </Button>
                      </div>
                    )}

                    {selectedUser.banReason && (
                      <div className="p-6 bg-red-50 border border-red-100 rounded-2xl mt-6 shadow-inner">
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-2">{t('Restriction Reason on Record')}</p>
                        <p className="text-sm text-red-800 font-bold leading-relaxed italic">&ldquo;{selectedUser.banReason}&rdquo;</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50 border-t flex justify-end">
                <Button variant="ghost" onClick={() => setSelectedUser(null)} className="font-bold px-8">{t('Close Window')}</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!actionModal} onOpenChange={() => setActionModal(null)}>
        <DialogContent className="bg-white border-gray-100 shadow-2xl max-w-md p-0 overflow-hidden rounded-[2.5rem]">
          <DialogDescription className="sr-only">Confirm action with reason.</DialogDescription>
          {actionModal && (
            <>
              <DialogHeader className={`p-8 border-b ${actionModal.type === 'ban' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'} relative`}>
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${actionModal.type === 'forceDelete' ? 'bg-red-200' : actionModal.type === 'ban' ? 'bg-red-100' : 'bg-orange-100'}`}>
                    {actionModal.type === 'forceDelete' ? (
                      <Trash2 className="w-7 h-7 text-red-700" />
                    ) : (
                      <Ban className={`w-7 h-7 ${actionModal.type === 'ban' ? 'text-red-600' : 'text-orange-600'}`} />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
                      {actionModal.type === 'forceDelete' ? t('Force Delete Account') : actionModal.type === 'ban' ? t('Permanently Ban User') : t('Suspend Account')}
                    </DialogTitle>
                    <p className="text-sm font-bold text-gray-500 opacity-70">{actionModal.user?.name}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="p-8 space-y-8">
                <div className={`p-5 rounded-2xl border text-sm font-medium leading-relaxed ${actionModal.type === 'forceDelete' ? 'bg-red-50 border-red-200 text-red-800' : actionModal.type === 'ban' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
                  {actionModal.type === 'forceDelete'
                    ? t('Force deleting this account will permanently soft-delete it, anonymize personal information, and cascade this status to any associated camps. This action cannot be undone.')
                    : actionModal.type === 'ban'
                    ? t('A permanent ban will block this user from all platform access. This reason will be shown to the user and logged in the event history.')
                    : t('A suspension temporarily restricts this user. They will see a notice on their dashboard with this reason and can submit an appeal.')}
                </div>
                {actionModal.type !== 'forceDelete' && (
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Reason *')}</Label>
                    <Textarea
                      value={actionModal.type === 'ban' ? banReason : suspendReason}
                      onChange={e => actionModal.type === 'ban' ? setBanReason(e.target.value) : setSuspendReason(e.target.value)}
                      placeholder={actionModal.type === 'ban' ? t('e.g. Repeated violations of community guidelines, fraudulent activity...') : t('e.g. Pending review of reported incident...')}
                      className="min-h-[140px] rounded-2xl p-5 text-sm font-medium resize-none shadow-inner border-gray-200"
                    />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight italic">{t('This reason is required and will be stored in the audit log.')}</p>
                  </div>
                )}
              </div>
              <div className="p-6 bg-gray-50 border-t flex justify-end gap-3 px-8 pb-8">
                <Button variant="ghost" onClick={() => setActionModal(null)} className="font-bold px-6">{t('Cancel')}</Button>
                <Button
                  variant={actionModal.type === 'ban' || actionModal.type === 'forceDelete' ? 'destructive' : 'default'}
                  className={`${actionModal.type !== 'ban' && actionModal.type !== 'forceDelete' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''} font-black px-8 shadow-lg h-12 rounded-xl`}
                  onClick={confirmAction}
                >
                  {t('Confirm')} {actionModal.type === 'forceDelete' ? t('Deletion') : actionModal.type === 'ban' ? t('Permanent Ban') : t('Suspension')}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="bg-white border-gray-100 shadow-2xl max-w-lg p-0 overflow-hidden rounded-[2.5rem]">
          <DialogDescription className="sr-only">Edit user profile details.</DialogDescription>
          {editingUser && (
            <>
              <DialogHeader className="p-8 border-b bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">{t('Edit User Profile')}</DialogTitle>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('Modify user account information')}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="editName" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Full Name')}</Label>
                  <Input 
                    id="editName"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="h-12 rounded-xl font-bold bg-gray-50 border-gray-200 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmail" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Email Address')}</Label>
                  <Input 
                    id="editEmail"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="h-12 rounded-xl font-bold bg-gray-50 border-gray-200 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPhone" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Phone Number')}</Label>
                  <Input 
                    id="editPhone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="h-12 rounded-xl font-bold bg-gray-50 border-gray-200 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editRole" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Account Role')}</Label>
                  <Select 
                    value={editForm.role}
                    onValueChange={(v) => setEditForm(prev => ({ ...prev, role: v }))}
                  >
                    <SelectTrigger id="editRole" className="h-12 rounded-xl font-bold bg-gray-50 border-gray-200 focus:bg-white transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="camper">{t('Camper')}</SelectItem>
                      <SelectItem value="camp_manager">{t('Camp Manager')}</SelectItem>
                      <SelectItem value="admin">{t('Administrator')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t flex justify-end gap-3 px-8 pb-8">
                <Button variant="ghost" onClick={() => setEditingUser(null)} className="font-bold px-6">{t('Cancel')}</Button>
                <Button 
                  onClick={handleUpdateUser}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700 font-black px-10 h-12 shadow-lg rounded-xl"
                >
                  {updating ? t("Saving...") : t("Save Changes")}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
