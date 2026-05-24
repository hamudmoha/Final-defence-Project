import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tent, AlertCircle, CheckCircle, Ban, FileText, User, MapPin, Calendar, ShieldCheck, XCircle, Info, Star, ShoppingBag, AlertTriangle, Trash2, Eye, Download, CheckSquare, XSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "../ui/utils";

const pendingCamps = [
  { id: "CAMP-2024-089", name: "Awash National Park Camp", manager: "Meseret Alem", location: "Awash, Afar", submitted: "2026-04-12", status: "pending" },
  { id: "CAMP-2024-088", name: "Harar Heritage Camp", manager: "Yassin Mohammed", location: "Harar", submitted: "2026-04-11", status: "pending" },
  { id: "CAMP-2024-087", name: "Danakil Adventure Base", manager: "Hanna Tesfaye", location: "Danakil, Afar", submitted: "2026-04-10", status: "pending" },
];

const activeCamps = [
  { id: "CAMP-2024-045", name: "Simien Mountain Camp", manager: "Ahmed Hassan", location: "Simien Mountains", rating: 4.8, bookings: 234, status: "active" },
  { id: "CAMP-2024-023", name: "Bale Safari Lodge", manager: "Marta Tadesse", location: "Bale Mountains", rating: 4.6, bookings: 189, status: "active" },
  { id: "CAMP-2024-012", name: "Lalibela View", manager: "Samuel Bekele", location: "Lalibela", rating: 4.9, bookings: 312, status: "active" },
  { id: "CAMP-2024-008", name: "Omo Valley Camp", manager: "David Girma", location: "Omo Valley", rating: 4.5, bookings: 156, status: "blocked" },
];

const kycQueue = [
  { id: "KYC-445", manager: "Meseret Alem", campName: "Awash National Park Camp", document: "Business License", submitted: "2026-04-12", status: "pending" },
  { id: "KYC-444", manager: "Yassin Mohammed", campName: "Harar Heritage Camp", document: "Tax Certificate", submitted: "2026-04-11", status: "pending" },
  { id: "KYC-443", manager: "Hanna Tesfaye", campName: "Danakil Adventure Base", document: "ID Verification", submitted: "2026-04-10", status: "pending" },
];

export function CampManagement() {
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  const handleApproveCamp = (id) => {
    toast.success(`Camp ${id} approved and published`);
  };

  const handleRejectCamp = (id) => {
    if (rejectionReason) {
      toast.success(`Camp ${id} rejected with reason: ${rejectionReason}`);
      setRejectionReason("");
    } else {
      toast.error("Please provide a rejection reason");
    }
  };

  const handleBlockCamp = (id) => {
    toast.success(`Camp ${id} temporarily blocked`);
  };

  const handleBanCamp = (id) => {
    toast.success(`Camp ${id} permanently banned`);
  };

  const handleSendWarning = (id) => {
    if (warningMessage) {
      toast.success(`Warning sent to camp ${id}`);
      setWarningMessage("");
    }
  };

  const handleApproveKYC = (id) => {
    toast.success(`KYC document ${id} approved`);
  };

  const handleRejectKYC = (id) => {
    toast.success(`KYC document ${id} rejected`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Camp Management</h1>
        <p className="text-gray-500 mt-1">Approve, monitor, and manage all camps on the platform</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Active Camps", value: "78", icon: Tent, color: "emerald", desc: "Approved and live" },
          { label: "Pending Approval", value: "12", icon: AlertCircle, color: "orange", desc: "Awaiting review" },
          { label: "KYC Pending", value: "8", icon: FileText, color: "blue", desc: "Documents to verify" },
          { label: "Blocked/Banned", value: "3", icon: Ban, color: "red", desc: "Violating policies" }
        ].map((stat, i) => (
          <Card key={i} className="p-6 bg-white/40 backdrop-blur-sm border-white/60 shadow-sm transition-all hover:bg-white/60 group">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                      stat.color === 'orange' ? "bg-orange-50 text-orange-600" :
                        stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                          "bg-red-50 text-red-600"
                  )}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-slate-600">{stat.label}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                  <p className="text-xs text-slate-400 font-medium">{stat.desc}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-slate-100/50 p-1 rounded-full border border-slate-200 w-fit">
          <TabsTrigger value="pending" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm px-6">Pending Approvals</TabsTrigger>
          <TabsTrigger value="active" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm px-6">Active Camps</TabsTrigger>
          <TabsTrigger value="kyc" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm px-6">KYC Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-8">
          <Card className="bg-slate-50/50 border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 flex items-center gap-3 border-b border-slate-100 bg-white/40">
              <div className="p-2 bg-orange-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 leading-tight">Camp Registration Approvals</h2>
                <p className="text-xs text-slate-500 font-medium">Review and approve new camp submissions</p>
              </div>
            </div>

            <div className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest pl-6">Camp ID</TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Name</TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Manager</TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Location</TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Submitted</TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                    <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white/20">
                  {pendingCamps.map((camp) => (
                    <TableRow key={camp.id} className="border-slate-50 hover:bg-white/60 transition-colors">
                      <TableCell className="py-4 pl-6 font-mono text-xs font-bold text-slate-400">{camp.id}</TableCell>
                      <TableCell className="py-4 font-bold text-slate-800">{camp.name}</TableCell>
                      <TableCell className="py-4 text-slate-600 font-medium">{camp.manager}</TableCell>
                      <TableCell className="py-4 text-slate-500">{camp.location}</TableCell>
                      <TableCell className="py-4 text-slate-500 font-medium font-mono text-xs">{camp.submitted}</TableCell>
                      <TableCell className="py-4 text-center">
                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">{camp.status}</Badge>
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg px-4 shadow-sm h-8"
                              onClick={() => setSelectedCamp(camp)}
                            >
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl">
                            <DialogHeader className="border-b border-slate-100 pb-4">
                              <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">Review Camp Registration</DialogTitle>
                            </DialogHeader>
                            <div className="py-8 space-y-8">
                              <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Camp Identity</Label>
                                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-lg font-bold text-slate-800 leading-tight">{camp.name}</p>
                                    <p className="text-xs font-mono text-slate-400 mt-1">{camp.id}</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Location Detail</Label>
                                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="font-bold text-slate-700">{camp.location}</p>
                                    <p className="text-xs text-slate-400 mt-1">Ethiopia, Africa</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4 pt-4 border-t border-slate-100">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Decision Feedback</Label>
                                <Textarea
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Provide a detailed reason for rejection..."
                                  className="min-h-[120px] bg-slate-50 border-slate-100 focus:bg-white transition-all rounded-xl resize-none"
                                />
                              </div>

                              <div className="flex gap-4 pt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => handleRejectCamp(camp.id)}
                                  className="flex-1 h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 font-black tracking-tight"
                                >
                                  Reject Camp
                                </Button>
                                <Button
                                  onClick={() => handleApproveCamp(camp.id)}
                                  className="flex-[1.5] h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-tight shadow-lg shadow-emerald-200"
                                >
                                  Approve & Publish
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-8">
          <Card className="bg-slate-50/50 border-slate-100 shadow-sm overflow-hidden mb-6">
            <div className="p-6 flex items-center justify-between border-b border-slate-100 bg-white/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Tent className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 leading-tight">Active Camps</h2>
                  <p className="text-xs text-slate-500 font-medium">Monitor and manage live camps</p>
                </div>
              </div>
              <div className="relative max-w-xs w-full">
                <Input placeholder="Search camps..." className="pl-9 bg-white border-slate-200 rounded-xl h-9 text-sm" />
                <Star className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest pl-6">Camp ID</TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Name</TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Manager</TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-center">Rating</TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-center">Bookings</TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white/20">
                {activeCamps.map((camp) => (
                  <TableRow key={camp.id} className="border-slate-50 hover:bg-white/60 transition-colors">
                    <TableCell className="py-4 pl-6 font-mono text-xs font-bold text-slate-400">{camp.id}</TableCell>
                    <TableCell className="py-4 font-bold text-slate-800">{camp.name}</TableCell>
                    <TableCell className="py-4 text-slate-600 font-medium">{camp.manager}</TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-slate-700">{camp.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center font-bold text-slate-600 font-mono text-sm">{camp.bookings}</TableCell>
                    <TableCell className="py-4 text-center">
                      <Badge className={cn(
                        "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider border-none",
                        camp.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      )}>
                        {camp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg px-4 shadow-sm h-8"
                          >
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl">
                          <DialogHeader className="border-b border-slate-100 pb-4">
                            <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">Manage Camp: {camp.name}</DialogTitle>
                          </DialogHeader>
                          <div className="py-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <Card className="p-4 bg-slate-50 border-slate-100 flex flex-col items-center justify-center gap-1 shadow-none">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <p className="text-xl font-black text-slate-800 tracking-tight">{camp.rating} ★</p>
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Rating</p>
                              </Card>
                              <Card className="p-4 bg-slate-50 border-slate-100 flex flex-col items-center justify-center gap-1 shadow-none">
                                <ShoppingBag className="w-5 h-5 text-blue-500" />
                                <p className="text-xl font-black text-slate-800 tracking-tight">{camp.bookings}</p>
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Bookings</p>
                              </Card>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Issue Formal Warning</Label>
                              <Textarea
                                value={warningMessage}
                                onChange={(e) => setWarningMessage(e.target.value)}
                                placeholder="Formal warning message..."
                                className="min-h-[100px] bg-slate-50 border-slate-100 focus:bg-white transition-all rounded-xl resize-none"
                              />
                              <Button
                                variant="outline"
                                className="w-full h-10 border-slate-200 text-slate-600 font-black tracking-tight rounded-xl"
                                onClick={() => handleSendWarning(camp.id)}
                              >
                                Send Warning Notice
                              </Button>
                            </div>

                            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                              <Button
                                variant="outline"
                                className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-600 font-black tracking-tight"
                                onClick={() => handleBlockCamp(camp.id)}
                              >
                                Block Access
                              </Button>
                              <Button
                                variant="destructive"
                                className="h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black tracking-tight"
                                onClick={() => handleBanCamp(camp.id)}
                              >
                                Permanent Ban
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 bg-white shadow-sm border-slate-100 rounded-2x border-l-4 border-l-yellow-400 relative overflow-hidden">
              <div className="absolute right-[-10px] top-[-10px] opacity-5">
                <AlertCircle size={100} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-yellow-50 text-yellow-700 border-none rounded-full text-[10px] font-black tracking-widest uppercase">Warning Sent</Badge>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">April 14, 2026</span>
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">Omo Valley Camp</p>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">False amenities listed (WiFi not available in remote zones).</p>
            </Card>
            <Card className="p-5 bg-white shadow-sm border-slate-100 rounded-2x border-l-4 border-l-red-500 relative overflow-hidden">
              <div className="absolute right-[-10px] top-[-10px] opacity-5">
                <Ban size={100} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-red-50 text-red-700 border-none rounded-full text-[10px] font-black tracking-widest uppercase">Camp Blocked</Badge>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">April 12, 2026</span>
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">Lake Tana Camp</p>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">Multiple customer complaints regarding facility hygiene.</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kyc" className="mt-8">
          <Card className="bg-slate-50/50 border-slate-100 shadow-sm overflow-hidden mb-8">
            <div className="p-6 flex items-center gap-3 border-b border-slate-100 bg-white/40">
              <div className="p-2 bg-blue-50 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 leading-tight">KYC Document Verification</h2>
                <p className="text-xs text-slate-500 font-medium">Review and approve camp manager documents</p>
              </div>
            </div>

            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest pl-6">KYC ID</TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Manager</TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Camp Name</TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Document Type</TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">Submitted</TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                  <TableHead className="py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white/20">
                {kycQueue.map((kyc) => (
                  <TableRow key={kyc.id} className="border-slate-50 hover:bg-white/60 transition-colors">
                    <TableCell className="py-4 pl-6 font-mono text-xs font-bold text-slate-400">{kyc.id}</TableCell>
                    <TableCell className="py-4 font-bold text-slate-800">{kyc.manager}</TableCell>
                    <TableCell className="py-4 text-slate-600 font-medium">{kyc.campName}</TableCell>
                    <TableCell className="py-4 text-slate-600 font-medium">{kyc.document}</TableCell>
                    <TableCell className="py-4 text-slate-500 font-mono text-xs font-bold">{kyc.submitted}</TableCell>
                    <TableCell className="py-4 text-center">
                      <Badge className="bg-slate-100 text-slate-600 border-none rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">{kyc.status}</Badge>
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px] font-bold uppercase tracking-tight rounded-lg border-slate-200"
                          onClick={() => toast.info("Viewing document: " + kyc.document)}
                        >
                          View Doc
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-[10px] font-bold uppercase tracking-tight rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleApproveKYC(kyc.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px] font-bold uppercase tracking-tight rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleRejectKYC(kyc.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl max-w-md">
            <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Required Documents</h3>
            <div className="space-y-4">
              {[
                { name: "Business License", status: "Required", color: "emerald" },
                { name: "Tax Identification Certificate", status: "Required", color: "emerald" },
                { name: "Manager ID Verification", status: "Required", color: "emerald" },
                { name: "Property Ownership/Lease Agreement", status: "Optional", color: "slate" }
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <FileText className={cn("w-4 h-4", doc.status === "Required" ? "text-emerald-500" : "text-slate-400")} />
                    <span className="text-sm font-bold text-slate-700">{doc.name}</span>
                  </div>
                  <Badge className={cn(
                    "rounded-full text-[9px] font-black uppercase border-none px-3 py-1",
                    doc.color === 'emerald' ? "bg-emerald-100/80 text-emerald-700" : "bg-slate-200 text-slate-500"
                  )}>
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
export default CampManagement;
