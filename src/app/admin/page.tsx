"use client";

import { motion } from "framer-motion";
import { Users, DollarSign, Activity, Settings, LogOut, Dumbbell, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


export default function AdminDashboard() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Admin Check
    useEffect(() => {
        const isAdmin = localStorage.getItem("isAdmin");
        if (!isAdmin) {
            router.push("/auth");
        } else {
            setIsLoading(false);
        }
    }, [router]);
    const [members, setMembers] = useState<any[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingMember, setEditingMember] = useState<any>(null);

    // Fetch members when switching to Members tab
    useEffect(() => {
        let channel: any;

        if (activeTab === 'Members' || activeTab === 'Dashboard') {
            fetchMembers();

            // Realtime subscription
            channel = supabase
                .channel('members-realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, (payload) => {
                    console.log('Realtime change:', payload);

                    if (payload.eventType === 'INSERT') {
                        setMembers((prev) => [payload.new, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setMembers((prev) => prev.map((member) => member.id === payload.new.id ? payload.new : member));
                    } else if (payload.eventType === 'DELETE') {
                        setMembers((prev) => prev.filter((member) => member.id !== payload.old.id));
                    }
                })
                .subscribe();
        }

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [activeTab]);

    async function fetchMembers() {
        setIsLoadingMembers(true);
        try {
            const { data, error } = await supabase.from('members').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
            alert('Failed to fetch members. Please check your connection.');
        } finally {
            setIsLoadingMembers(false);
        }
    }

    async function deleteMember(id: string) {
        if (!confirm("Are you sure you want to delete this member?")) return;

        try {
            const { error } = await supabase.from('members').delete().eq('id', id);
            if (error) throw error;
            // Optimistic update
            setMembers(members.filter(m => m.id !== id));
        } catch (error) {
            console.error('Error deleting member:', error);
            alert('Failed to delete member');
        }
    }

    async function updateMember(e: React.FormEvent) {
        e.preventDefault();
        if (!editingMember) return;

        try {
            const { error } = await supabase
                .from('members')
                .update({
                    full_name: editingMember.full_name,
                    email: editingMember.email,
                    plan: editingMember.plan,
                    status: editingMember.status
                })
                .eq('id', editingMember.id);

            if (error) throw error;

            // Optimistic update
            setMembers(members.map(m => m.id === editingMember.id ? editingMember : m));
            setEditingMember(null);
        } catch (error) {
            console.error('Error updating member:', error);
            alert('Failed to update member');
        }
    }

    // Filter members
    const filteredMembers = members.filter(member =>
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Stats
    // Calculate Stats
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'Active').length;
    const pendingMembers = members.filter(m => m.status === 'Pending');
    const pendingCount = pendingMembers.length;

    // Estimate Revenue
    const calculateRevenue = () => {
        return members.reduce((acc, member) => {
            let price = 0;
            switch (member.plan) {
                case 'Elite': price = 100; break;
                case 'Pro Athlete': price = 75; break;
                case 'Basic': price = 40; break;
                case 'Day Pass': price = 20; break;
                default: price = 0;
            }
            // Only count revenue for Active members? or all? Let's say all for "Monthly Revenue Potential"
            return acc + price;
        }, 0);
    };
    const monthlyRevenue = calculateRevenue();

    const recentSignups = members.slice(0, 5); // display first 5


    const handleLogout = () => {
        localStorage.removeItem("isAdmin");
        router.push("/");
    };

    const quickApprove = async (id: string, currentPlan: string) => {
        try {
            await supabase.from('members').update({ status: 'Active' }).eq('id', id);
            // Realtime will handle the state update
        } catch (e) {
            console.error(e);
            alert("Failed to approve");
        }
    };

    if (isLoading) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex">
            {/* Sidebar */}
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111] border-r border-white/10 flex flex-col p-6 transition-transform duration-300 md:translate-x-0 md:static ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-2">
                        <div className="bg-[#cff532] p-2 rounded-full">
                            <Dumbbell className="h-5 w-5 text-black" />
                        </div>
                        <span className="font-bold text-lg tracking-wider text-white">ADMIN</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden text-gray-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 space-y-2">
                    {[
                        { name: 'Dashboard', icon: Activity },
                        { name: 'Members', icon: Users },
                        { name: 'Revenue', icon: DollarSign },
                        { name: 'Settings', icon: Settings },
                    ].map((item) => (
                        <button
                            key={item.name}
                            onClick={() => {
                                setActiveTab(item.name);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === item.name ? 'bg-[#cff532] text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </button>
                    ))}
                </nav>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 transition-colors mt-auto"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                <header className="flex justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{activeTab}</h1>
                            <p className="text-sm md:text-base text-gray-400">Welcome back, Admin.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">
                            AD
                        </div>
                    </div>
                </header>

                {/* Dashboard View */}
                {activeTab === 'Dashboard' && (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {[
                                { label: 'Total Members', value: totalMembers.toString(), change: '+2 new', icon: Users },
                                { label: 'Pending Approvals', value: pendingCount.toString(), change: pendingCount > 0 ? 'Action Needed' : 'All Clear', icon: Activity },
                                { label: 'Active Members', value: activeMembers.toString(), change: 'Now', icon: Activity },
                            ].map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-[#111] p-6 rounded-2xl border border-white/5"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-[#cff532]/10 rounded-xl">
                                            <stat.icon className="w-6 h-6 text-[#cff532]" />
                                        </div>
                                        <span className="text-green-400 text-sm font-bold bg-green-400/10 px-2 py-1 rounded-lg">
                                            {stat.change}
                                        </span>
                                    </div>
                                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">{stat.label}</h3>
                                    <p className="text-3xl font-black text-white">{stat.value}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pending Approvals Section - Only if there are pending members */}
                        {pendingCount > 0 && (
                            <div className="bg-[#cff532]/10 rounded-2xl border border-[#cff532]/30 p-6 mb-8">
                                <h2 className="text-xl font-bold text-[#cff532] mb-6 flex items-center gap-2">
                                    <Activity className="w-5 h-5" />
                                    Pending Approvals
                                </h2>
                                <div className="space-y-4">
                                    {pendingMembers.map((user) => (
                                        <div key={user.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-black/40 rounded-xl border border-[#cff532]/20">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[#cff532] flex items-center justify-center text-black font-bold">
                                                    {user.full_name ? user.full_name.charAt(0) : '?'}
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold">{user.full_name}</h4>
                                                    <p className="text-gray-400 text-sm">{user.plan} • {user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                                                <button
                                                    onClick={() => quickApprove(user.id, user.plan)}
                                                    className="bg-[#cff532] text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#bce628] transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => setEditingMember(user)} // Open edit modal
                                                    className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors"
                                                >
                                                    Edit Plan
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Activity */}
                        <div className="bg-[#111] rounded-2xl border border-white/5 p-6">
                            <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
                            <div className="space-y-4">
                                {recentSignups.map((user, i) => (
                                    <div key={user.id || i} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-black/40 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#cff532] to-[#bce628] flex items-center justify-center text-black font-bold">
                                                {user.full_name ? user.full_name.charAt(0) : '?'}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold">{user.full_name}</h4>
                                                <p className="text-gray-500 text-sm">{user.plan}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm w-full md:w-auto justify-between md:justify-start mt-2 md:mt-0">
                                            <span className="text-gray-400">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                {user.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {recentSignups.length === 0 && (
                                    <div className="text-gray-500 text-center py-4">No recent activity.</div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Members View */}
                {activeTab === 'Members' && (
                    <div className="bg-[#111] rounded-2xl border border-white/5 p-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full md:w-64 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#cff532]"
                            />
                            <button className="w-full md:w-auto bg-[#cff532] text-black px-4 py-2 rounded-xl font-bold hover:bg-[#bce628] transition-colors">
                                Add Member
                            </button>
                        </div>

                        {isLoadingMembers ? (
                            <div className="text-center py-10 text-gray-400">Loading members...</div>
                        ) : filteredMembers.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/10 text-gray-400 text-sm uppercase">
                                            <th className="pb-4">Name</th>
                                            <th className="pb-4">Plan</th>
                                            <th className="pb-4">Status</th>
                                            <th className="pb-4">Joined</th>
                                            <th className="pb-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredMembers.map((member) => (
                                            <tr key={member.id} className="group hover:bg-white/5 transition-colors">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#cff532] font-bold">
                                                            {member.full_name?.[0] || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white">{member.full_name}</div>
                                                            <div className="text-xs text-gray-500">{member.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-gray-300">{member.plan}</td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${member.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                        {member.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-gray-400 text-sm">
                                                    {new Date(member.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <button
                                                        onClick={() => setEditingMember(member)}
                                                        className="text-gray-400 hover:text-white mr-3"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteMember(member.id)}
                                                        className="text-red-500 hover:text-red-400"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                No members found.
                            </div>
                        )}

                        {/* Edit Modal */}
                        {editingMember && (
                            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md relative"
                                >
                                    <button
                                        onClick={() => setEditingMember(null)}
                                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-xl font-bold text-white mb-6">Edit Member</h3>
                                    <form onSubmit={updateMember} className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={editingMember.full_name}
                                                onChange={(e) => setEditingMember({ ...editingMember, full_name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#cff532]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={editingMember.email}
                                                onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#cff532]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Plan</label>
                                            <select
                                                value={editingMember.plan}
                                                onChange={(e) => setEditingMember({ ...editingMember, plan: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#cff532]"
                                            >
                                                <option value="Basic">Basic</option>
                                                <option value="Pro Athlete">Pro Athlete</option>
                                                <option value="Elite">Elite</option>
                                                <option value="Day Pass">Day Pass</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Status</label>
                                            <select
                                                value={editingMember.status}
                                                onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#cff532]"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                                <option value="Pending">Pending</option>
                                            </select>
                                        </div>
                                        <div className="pt-4 border-t border-white/10 mt-6">
                                            <h4 className="font-bold text-white mb-3">Payment History</h4>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                <div className="flex justify-between text-sm text-gray-400 bg-white/5 p-2 rounded">
                                                    <span>Dec 19, 2025</span>
                                                    <span className="text-white">$49.99</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-gray-400 bg-white/5 p-2 rounded">
                                                    <span>Nov 19, 2025</span>
                                                    <span className="text-white">$49.99</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-gray-400 bg-white/5 p-2 rounded">
                                                    <span>Oct 19, 2025</span>
                                                    <span className="text-white">$49.99</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button type="submit" className="w-full bg-[#cff532] text-black font-bold py-3 rounded-xl mt-6 hover:bg-[#bce628] transition-colors">
                                            Save Changes
                                        </button>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
