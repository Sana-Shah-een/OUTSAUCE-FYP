'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BentoCard } from '@/components/ui/bento-card';
import { apiClient } from '@/lib/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Mail, Shield, Calendar, Search, MoreVertical, Edit2, Trash2, UserPlus, CreditCard, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string;
  created_at: string;
  is_admin: boolean;
  plan?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    isAdmin: false,
    userType: 'business_owner',
    plan: 'free'
  });

  const fetchUsers = async () => {
    try {
      const response = await apiClient<UserProfile[]>('/api/admin/users');
      setUsers(response);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      toast.success("User created successfully");
      setIsCreateModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to create user");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await apiClient(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: formData.fullName,
          isAdmin: formData.isAdmin,
          userType: formData.userType
        }),
      });

      await apiClient(`/api/admin/users/${selectedUser.id}/plan`, {
        method: 'PATCH',
        body: JSON.stringify({ plan: formData.plan }),
      });

      toast.success("User updated successfully");
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await apiClient(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      toast.success("User deleted permanently");
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    (u.full_name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-brand-red/10 border border-brand-red/20">
                <Users className="h-5 w-5 text-brand-red" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-text-main sm:text-4xl">
                User Management
              </h1>
            </div>
            <p className="text-base text-text-muted">
              View and manage all registered users and platform roles.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input 
                placeholder="Search users..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-white/50 dark:bg-black/20 border-black/10 dark:border-white/10 rounded-xl focus-visible:ring-brand-red/30"
              />
            </div>
            <Button 
              onClick={() => {
                setFormData({ email: '', fullName: '', password: '', isAdmin: false, userType: 'business_owner', plan: 'free' });
                setIsCreateModalOpen(true);
              }}
              className="h-11 bg-brand-red hover:bg-brand-red/90 text-white shadow-[0_0_20px_rgba(196,30,30,0.3)] rounded-xl gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add User</span>
            </Button>
          </div>
        </div>
      </motion.div>

      <BentoCard delay={0.2} className="overflow-hidden border-none shadow-none p-0 !bg-transparent">
        <div className="rounded-[2rem] border border-black/[0.08] dark:border-white/[0.08] bg-white/[0.4] dark:bg-[#020617]/40 backdrop-blur-3xl overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-black/[0.03] dark:bg-white/[0.03]">
              <TableRow className="border-b border-black/[0.08] dark:border-white/[0.08] hover:bg-transparent">
                <TableHead className="text-text-main font-bold h-14 pl-6 uppercase text-[10px] tracking-widest">User Details</TableHead>
                <TableHead className="text-text-main font-bold h-14 uppercase text-[10px] tracking-widest">Email Address</TableHead>
                <TableHead className="text-text-main font-bold h-14 uppercase text-[10px] tracking-widest">Platform Role</TableHead>
                <TableHead className="text-text-main font-bold h-14 uppercase text-[10px] tracking-widest">Access</TableHead>
                <TableHead className="text-text-main font-bold h-14 uppercase text-[10px] tracking-widest">Join Date</TableHead>
                <TableHead className="text-text-main font-bold h-14 pr-6 uppercase text-[10px] tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <motion.tbody 
              className="[&_tr:last-child]:border-0"
              variants={container}
              initial={loading ? "hidden" : "show"}
              animate="show"
            >
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-black/[0.05] dark:border-white/[0.05]">
                    <TableCell className="pl-6"><Skeleton className="h-4 w-[140px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[180px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[60px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[90px] rounded-full" /></TableCell>
                    <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-text-muted">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredUsers.map((user) => (
                    <motion.tr 
                      key={user.id} 
                      variants={item}
                      className="group border-b border-black/[0.05] dark:border-white/[0.05] transition-all hover:bg-black/[0.03] dark:hover:bg-white/[0.03] last:border-0"
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-red to-red-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-brand-red/20 group-hover:scale-110 transition-transform">
                            {user.full_name?.charAt(0) || 'U'}
                          </div>
                          <span className="font-bold text-text-main group-hover:text-brand-red transition-colors">
                            {user.full_name || 'Anonymous User'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-text-muted group-hover:text-text-main transition-colors">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="text-sm font-medium">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-text-muted font-bold text-[10px] px-2.5">
                          {user.user_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_admin ? (
                          <div className="flex items-center gap-1.5 text-brand-red">
                            <Shield className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Admin</span>
                          </div>
                        ) : (
                          <span className="text-text-muted/40 text-xs font-bold uppercase tracking-wider">Member</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-text-muted text-sm font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-brand-red/10 hover:text-brand-red transition-colors focus-visible:outline-none">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-2 bg-white/90 dark:bg-[#020617]/90 backdrop-blur-xl border-black/10 dark:border-white/10 rounded-2xl shadow-2xl">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-text-muted px-2 py-1.5">User Actions</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => {
                                  if (!user) return;
                                  setSelectedUser(user);
                                  setFormData({
                                    email: user.email || '',
                                    fullName: user.full_name || '',
                                    password: '',
                                    isAdmin: !!user.is_admin,
                                    userType: user.user_type || 'business_owner',
                                    plan: user.plan || 'free'
                                  });
                                  setIsEditModalOpen(true);
                                }}
                                className="rounded-xl gap-2 focus:bg-brand-red/10 focus:text-brand-red cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4" />
                                Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-black/5 dark:bg-white/5 my-1" />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="rounded-xl gap-2 focus:bg-destructive/10 focus:text-destructive cursor-pointer text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </>
              )}
            </motion.tbody>
          </Table>
        </div>
      </BentoCard>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-[#020617]/95 backdrop-blur-3xl border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl max-w-md p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-text-main flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-red/10 border border-brand-red/20">
                <UserPlus className="h-5 w-5 text-brand-red" />
              </div>
              Create New User
            </DialogTitle>
            <DialogDescription className="text-text-muted mt-2">
              Manually register a new user to the Outsauce platform.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-main ml-1 uppercase tracking-wider text-[10px]">Full Name</label>
              <Input 
                required 
                placeholder="John Doe" 
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/10 rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-main ml-1 uppercase tracking-wider text-[10px]">Email Address</label>
              <Input 
                required 
                type="email"
                placeholder="user@example.com" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/10 rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-main ml-1 uppercase tracking-wider text-[10px]">Password (Optional)</label>
              <Input 
                type="password"
                placeholder="Min 8 characters" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/10 rounded-xl h-12"
              />
            </div>
          </form>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl h-12 px-6">Cancel</Button>
            <Button onClick={handleCreateUser} className="bg-brand-red hover:bg-brand-red/90 text-white rounded-xl h-12 px-8 shadow-lg shadow-brand-red/20">Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-[#020617]/95 backdrop-blur-3xl border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl max-w-md p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-text-main flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-red/10 border border-brand-red/20">
                <Edit2 className="h-5 w-5 text-brand-red" />
              </div>
              Edit User Profile
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-main ml-1 uppercase tracking-wider text-[10px]">Full Name</label>
              <Input 
                required 
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/10 rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-main ml-1 uppercase tracking-wider text-[10px]">Platform Role</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'job_seeker',  label: 'Job Seeker',  emoji: '🎯' },
                  { value: 'freelancer',  label: 'Freelancer',  emoji: '💼' },
                  { value: 'employer',    label: 'Employer',    emoji: '🏢' },
                ] as const).map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData({ ...formData, userType: value })}
                    className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                      formData.userType === value
                        ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/20'
                        : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-text-muted hover:border-brand-red/30'
                    }`}
                  >
                    <span className="text-base">{emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-main ml-1 uppercase tracking-wider text-[10px]">Subscription Plan</label>
              <div className="grid grid-cols-2 gap-2">
                {['free', 'starter', 'pro', 'enterprise'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({...formData, plan: p})}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase transition-all ${
                      formData.plan === p 
                        ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/20' 
                        : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-text-muted hover:border-brand-red/30'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              <div>
                <p className="text-sm font-bold text-text-main uppercase tracking-wider text-[10px]">Admin Access</p>
                <p className="text-xs text-text-muted">Grant full administrative privileges</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({...formData, isAdmin: !formData.isAdmin})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${formData.isAdmin ? 'bg-brand-red' : 'bg-black/20 dark:bg-white/20'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${formData.isAdmin ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </form>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} className="rounded-xl h-12 px-6 text-text-muted">Discard Changes</Button>
            <Button onClick={handleUpdateUser} className="bg-brand-red hover:bg-brand-red/90 text-white rounded-xl h-12 px-8 shadow-lg shadow-brand-red/20">Save Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-white/90 dark:bg-[#020617]/95 backdrop-blur-3xl border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl max-w-md p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-2">
              <Trash2 className="h-10 w-10 text-destructive animate-pulse" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold text-text-main">Permanent Deletion</DialogTitle>
              <DialogDescription className="text-text-muted text-base">
                Are you absolutely sure you want to delete <span className="font-bold text-text-main">{selectedUser?.email}</span>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="w-full flex flex-col gap-2 pt-4">
              <Button 
                onClick={handleDeleteUser}
                className="w-full h-12 bg-destructive hover:bg-destructive/90 text-white rounded-xl font-bold text-lg shadow-xl shadow-destructive/20"
              >
                Yes, Delete User
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full h-12 rounded-xl text-text-muted hover:bg-black/5"
              >
                Keep User Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
