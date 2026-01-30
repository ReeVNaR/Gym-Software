"use client";

import { motion } from "framer-motion";
import { Users, DollarSign, Activity, Settings, LogOut, Dumbbell, Menu, X, Save, Lock, Globe, Bell, ChevronRight, Shield, ScanLine, Calendar, IndianRupee, Trash2, Trophy } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingMember, setEditingMember] = useState<any>(null);
    const [prices, setPrices] = useState({
        monthly: 3000,
        sixMonth: 12000,
        yearly: 20000
    });

    const [generalSettings, setGeneralSettings] = useState({
        gymName: "Starshift Gym",
        email: "admin@starshift.com",
        phone: "+1 (555) 000-0000",
        address: "123 Fitness Blvd, Muscle City, CA"
    });
    const [lastScannedMs, setLastScannedMs] = useState(0);
    const [activeSessions, setActiveSessions] = useState<Record<string, string>>({}); // memberId -> check_in_time
    const [elapsedTimes, setElapsedTimes] = useState<Record<string, string>>({});

    // Member Details View State
    const [viewingMember, setViewingMember] = useState<any>(null);
    const [viewingMemberLogs, setViewingMemberLogs] = useState<any[]>([]);
    const [viewingStats, setViewingStats] = useState({ totalVisits: 0, totalMinutes: 0 });

    const calendarScrollRef = useRef<HTMLDivElement>(null);

    // Payments State
    const [managingPaymentsFor, setManagingPaymentsFor] = useState<any>(null);
    const [memberPayments, setMemberPayments] = useState<any[]>([]);
    const [newPaymentAmount, setNewPaymentAmount] = useState("");
    const [newPaymentMethod, setNewPaymentMethod] = useState("Cash");

    // Fetch payments when managing a member
    useEffect(() => {
        if (managingPaymentsFor) {
            fetchPayments(managingPaymentsFor.id);
        } else {
            setMemberPayments([]);
            setNewPaymentAmount("");
            setNewPaymentMethod("Cash");
        }
    }, [managingPaymentsFor]);

    async function fetchPayments(memberId: string) {
        const { data } = await supabase
            .from('payments')
            .select('*')
            .eq('member_id', memberId)
            .order('payment_date', { ascending: false });
        if (data) setMemberPayments(data);
    }

    async function handleAddPayment() {
        if (!managingPaymentsFor || !newPaymentAmount) return;

        try {
            const { error } = await supabase.from('payments').insert({
                member_id: managingPaymentsFor.id,
                amount: parseFloat(newPaymentAmount),
                payment_method: newPaymentMethod,
                payment_date: new Date().toISOString()
            });
            if (error) throw error;



            // Automatically reduce due amount (allow negative for credit)
            const currentDue = managingPaymentsFor.due_amount || 0;
            const newDue = currentDue - parseFloat(newPaymentAmount);

            const { error: updateError } = await supabase.from('members').update({ due_amount: newDue }).eq('id', managingPaymentsFor.id);

            if (updateError) {
                console.error("Error updating due amount:", updateError);
            } else {
                // Update local state to reflect change immediately
                setMembers(prev => prev.map((m: any) => m.id === managingPaymentsFor.id ? { ...m, due_amount: newDue } : m));
                setManagingPaymentsFor((prev: any) => ({ ...prev, due_amount: newDue }));
            }

            // Refresh
            fetchPayments(managingPaymentsFor.id);
            setNewPaymentAmount("");
        } catch (e) {
            console.error(e);
            alert("Failed to record payment");
        }
    }

    async function handleDeletePayment(paymentId: string) {
        if (!confirm("Are you sure you want to delete this payment?")) return;

        const paymentToDelete = memberPayments.find(p => p.id === paymentId);
        if (!paymentToDelete) return;

        try {
            const { error } = await supabase.from('payments').delete().eq('id', paymentId);
            if (error) throw error;

            // Revert due amount
            if (managingPaymentsFor) {
                const currentDue = managingPaymentsFor.due_amount || 0;
                const newDue = currentDue + paymentToDelete.amount;

                await supabase.from('members').update({ due_amount: newDue }).eq('id', managingPaymentsFor.id);

                setMembers(prev => prev.map((m: any) => m.id === managingPaymentsFor.id ? { ...m, due_amount: newDue } : m));
                setManagingPaymentsFor((prev: any) => ({ ...prev, due_amount: newDue }));

                fetchPayments(managingPaymentsFor.id);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to delete payment");
        }
    }

    // Auto-scroll calendar to end when modal opens
    useEffect(() => {
        if (viewingMember && calendarScrollRef.current) {
            setTimeout(() => {
                if (calendarScrollRef.current) {
                    calendarScrollRef.current.scrollLeft = calendarScrollRef.current.scrollWidth;
                }
            }, 100);
        }
    }, [viewingMember]);

    // Scanner Effect
    useEffect(() => {
        let scanner: Html5Qrcode | null = null;

        if (activeTab === 'Scan') {
            // small delay to ensure DOM is ready
            const timer = setTimeout(async () => {
                scanner = new Html5Qrcode("reader");

                try {
                    await scanner.start(
                        { facingMode: "environment" },
                        {
                            fps: 15,
                            qrbox: { width: 300, height: 300 }
                        },
                        async (decodedText) => {
                            // Use function ref or similar if lastScannedMs is state, 
                            // but since we re-run effect on lastScannedMs change, 
                            // capturing the closure variable 'now' should be careful.
                            // Actually, simpler to just use a ref for debouncing if we wanted to avoid re-renders of the effect.
                            // BUT, for now, we will rely on a simple check.

                            const now = Date.now();
                            // We need to read the potentially stale state or use a Ref. 
                            // Since the effect re-runs on lastScannedMs, it restarts the camera, which is bad.
                            // Let's use a localStorage or a global variable or a Ref for debounce timestamp to prevent camera validation flickering.

                            const lastScan = parseInt(sessionStorage.getItem('lastScanned') || '0');
                            if (now - lastScan < 3000) return;

                            sessionStorage.setItem('lastScanned', now.toString());
                            await handleScan(decodedText);
                        },
                        (errorMessage) => {
                            // ignore
                        }
                    );
                } catch (err) {
                    console.error("Error starting scanner", err);
                }
            }, 100);

            return () => {
                clearTimeout(timer);
                if (scanner && scanner.isScanning) {
                    scanner.stop().then(() => {
                        scanner?.clear();
                    }).catch(err => console.error("Failed to stop scanner", err));
                }
            };
        }
    }, [activeTab]);

    async function handleScan(memberId: string) {
        // Find member
        const { data: member, error } = await supabase.from('members').select('*').eq('id', memberId).single();

        if (error || !member) {
            alert("Member not found!");
            return;
        }

        const isCheckedIn = member.status === 'Active (In Gym)';
        const newStatus = isCheckedIn ? 'Active' : 'Active (In Gym)';
        const message = isCheckedIn ? `${member.full_name} checked OUT.` : `${member.full_name} checked IN!`;

        try {
            // For non-active members (e.g. pending/inactive), warn admin
            if (!member.status.startsWith('Active')) {
                if (!confirm(`Member status is ${member.status}. Allow check-in anyway?`)) return;
            }

            const { error: updateError } = await supabase
                .from('members')
                .update({ status: newStatus })
                .eq('id', memberId);

            if (updateError) throw updateError;

            // Log Activity
            if (isCheckedIn) {
                // CHECK OUT LOGIC
                // Find the open session
                const { data: openLog } = await supabase
                    .from('activity_logs')
                    .select('*')
                    .eq('member_id', memberId)
                    .is('check_out_time', null)
                    .order('check_in_time', { ascending: false })
                    .limit(1)
                    .single();

                if (openLog) {
                    const checkInTime = new Date(openLog.check_in_time).getTime();
                    const checkOutTime = new Date().getTime();
                    const durationMinutes = Math.round((checkOutTime - checkInTime) / 1000 / 60);

                    await supabase
                        .from('activity_logs')
                        .update({
                            check_out_time: new Date().toISOString(),
                            duration_minutes: durationMinutes
                        })
                        .eq('id', openLog.id);

                    alert(`${member.full_name} checked OUT.\nDuration: ${durationMinutes} mins\nXP Gained: ${durationMinutes} XP`);
                } else {
                    // Fallback if no open log found
                    alert(`${member.full_name} checked OUT.`);
                }
            } else {
                // CHECK IN LOGIC
                // Auto-close any previous open sessions to ensure no overlapping "ongoing" sessions in history
                const { data: staleLogs } = await supabase
                    .from('activity_logs')
                    .select('*')
                    .eq('member_id', memberId)
                    .is('check_out_time', null);

                if (staleLogs && staleLogs.length > 0) {
                    for (const log of staleLogs) {
                        const checkInTime = new Date(log.check_in_time).getTime();
                        const now = new Date().getTime();
                        const durationMinutes = Math.round((now - checkInTime) / 1000 / 60);

                        await supabase
                            .from('activity_logs')
                            .update({
                                check_out_time: new Date().toISOString(),
                                duration_minutes: durationMinutes
                            })
                            .eq('id', log.id);
                    }
                }

                // Create new session
                await supabase
                    .from('activity_logs')
                    .insert({
                        member_id: memberId,
                        check_in_time: new Date().toISOString()
                    });
                alert(`${member.full_name} checked IN!`);
            }

            // State will update via realtime subscription
        } catch (e) {
            console.error(e);
            alert("Failed to update status");
        }
    }

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

    // Fetch Active Sessions for Timers
    useEffect(() => {
        if (members.length > 0) {
            const fetchSessions = async () => {
                const { data } = await supabase
                    .from('activity_logs')
                    .select('member_id, check_in_time')
                    .is('check_out_time', null);

                if (data) {
                    const sessionMap: Record<string, string> = {};
                    data.forEach(log => {
                        sessionMap[log.member_id] = log.check_in_time;
                    });
                    setActiveSessions(sessionMap);
                }
            };
            fetchSessions();
        }
    }, [members, activeTab]);

    // Timer Interval
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const newTimes: Record<string, string> = {};

            Object.entries(activeSessions).forEach(([memberId, startTime]) => {
                const start = new Date(startTime).getTime();
                const diff = now - start;

                if (diff > 0) {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    newTimes[memberId] = `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`;
                }
            });
            setElapsedTimes(newTimes);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeSessions]);

    // Admin Leaderboard Fetch
    useEffect(() => {
        if (activeTab === 'Leaderboard') {
            async function fetchLeaderboard() {
                setLoadingLeaderboard(true);
                try {
                    // Reuse members state if available, or fetch
                    let allMembers = members;
                    if (members.length === 0) {
                        const { data, error } = await supabase.from('members').select('id, full_name, plan, status');
                        if (error) throw error;
                        allMembers = data || [];
                    }

                    // Get all logs
                    const { data: allLogs, error: logsError } = await supabase
                        .from('activity_logs')
                        .select('member_id, duration_minutes');

                    if (logsError) throw logsError;

                    // Calculate XP
                    const xpMap: Record<string, number> = {};
                    allLogs?.forEach(log => {
                        if (log.duration_minutes) {
                            xpMap[log.member_id] = (xpMap[log.member_id] || 0) + log.duration_minutes;
                        }
                    });

                    // Combine and Sort
                    const sortedLeaderboard = allMembers
                        .map(m => ({
                            ...m,
                            xp: xpMap[m.id] || 0
                        }))
                        .sort((a: any, b: any) => b.xp - a.xp);

                    setLeaderboard(sortedLeaderboard);
                } catch (e) {
                    console.error("Error fetching leaderboard", e);
                } finally {
                    setLoadingLeaderboard(false);
                }
            }
            fetchLeaderboard();
        }
    }, [activeTab, members]);

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

    async function handleViewMember(member: any) {
        setViewingMember(member);
        const { data: logs, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('member_id', member.id)
            .order('check_in_time', { ascending: false });

        if (logs) {
            setViewingMemberLogs(logs);
            // Calculate stats
            const totalVisits = logs.length;
            const totalMinutes = logs.reduce((acc, log) => acc + (log.duration_minutes || 0), 0);
            setViewingStats({ totalVisits, totalMinutes });
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
                    status: editingMember.status,
                    due_amount: editingMember.due_amount
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
    const activeMembers = members.filter(m => m.status.startsWith('Active')).length;
    const inGymMembers = members.filter(m => m.status === 'Active (In Gym)').length;
    const pendingMembers = members.filter(m => m.status === 'Pending');
    const pendingCount = pendingMembers.length;

    // Estimate Revenue
    const calculateRevenue = () => {
        return members.reduce((acc, member) => {
            let price = 0;
            switch (member.plan) {
                case 'Yearly Plan': price = prices.yearly; break;
                case '6-Month Plan': price = prices.sixMonth; break;
                case 'Monthly Plan': price = prices.monthly; break;
                default: price = 0;
            }
            return acc + price;
        }, 0);
    };
    const monthlyRevenue = calculateRevenue();

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you'd save to Supabase here
        alert("Settings saved successfully!");
    };

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
                        { name: 'Scan', icon: ScanLine },
                        { name: 'Members', icon: Users },
                        { name: 'Leaderboard', icon: Trophy },
                        { name: 'Revenue', icon: IndianRupee },
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
                                { label: 'Active Members', value: activeMembers.toString(), change: 'Total Valid', icon: Activity },
                                { label: 'Currently In Gym', value: inGymMembers.toString(), change: 'Live', icon: Dumbbell },
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

                        {/* Currently In Gym */}
                        <div className="bg-[#111] rounded-2xl border border-white/5 p-6">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#cff532] animate-pulse"></span>
                                Currently In Gym
                            </h2>
                            <div className="space-y-4">
                                {members.filter(m => m.status === 'Active (In Gym)').map((user, i) => (
                                    <div key={user.id || i} className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-black/40 rounded-xl border border-white/5 group hover:border-[#cff532]/30 transition-colors">
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#cff532] to-[#bce628] flex items-center justify-center text-black font-bold">
                                                {user.full_name ? user.full_name.charAt(0) : '?'}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold flex items-center gap-2">
                                                    {user.full_name}
                                                    {elapsedTimes[user.id] && (
                                                        <span className="text-xs font-mono font-normal text-[#cff532] bg-[#cff532]/10 px-2 py-0.5 rounded-full border border-[#cff532]/20">
                                                            {elapsedTimes[user.id]}
                                                        </span>
                                                    )}
                                                </h4>
                                                <p className="text-gray-500 text-sm">{user.plan}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0">
                                            <button
                                                onClick={() => quickApprove(user.id, user.plan)} // Re-using quickApprove to toggle status indirectly? No, creating new function better but let's just make it a status badge for now.
                                                className="px-3 py-1 rounded-full text-xs font-bold bg-[#cff532]/20 text-[#cff532] border border-[#cff532]/20"
                                            >
                                                Checked In
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {members.filter(m => m.status === 'Active (In Gym)').length === 0 && (
                                    <div className="text-gray-500 text-center py-8 flex flex-col items-center">
                                        <Dumbbell className="w-8 h-8 text-gray-700 mb-2" />
                                        <p>The gym is currently empty.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Scan Tab */}
                {activeTab === 'Scan' && (
                    <div className="flex flex-col items-center justify-center animate-fade-in space-y-8">
                        <div className="bg-[#111] p-8 rounded-3xl border border-white/10 w-full max-w-2xl text-center">
                            <h2 className="text-3xl font-black text-white mb-2">SCAN MEMBER QR</h2>
                            <p className="text-gray-400 mb-8">Point camera at the member's digital ID card</p>

                            <div className="overflow-hidden rounded-2xl border-2 border-[#cff532]/30 shadow-[0_0_50px_rgba(207,245,50,0.1)] bg-black">
                                <div id="reader" className="w-full"></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                            <div className="bg-[#111] p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#cff532]/20 flex items-center justify-center text-[#cff532]">
                                    <ScanLine className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-white">{inGymMembers}</div>
                                    <div className="text-xs text-gray-400 uppercase tracking-widest">Currently In Gym</div>
                                </div>
                            </div>
                            <div className="bg-[#111] p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-white">{totalMembers}</div>
                                    <div className="text-xs text-gray-400 uppercase tracking-widest">Total Members</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leaderboard Tab */}
                {activeTab === 'Leaderboard' && (
                    <div className="bg-[#111] rounded-2xl border border-white/5 p-6">
                        <div className="flex flex-col items-center justify-center mb-8">
                            <div className="bg-[#cff532]/10 p-4 rounded-full mb-4">
                                <Trophy className="w-10 h-10 text-[#cff532]" />
                            </div>
                            <h2 className="text-2xl font-black text-white text-center">Global Leaderboard</h2>
                            <p className="text-gray-400 text-center">Top Performing Members by XP (Workout Duration)</p>
                        </div>

                        {loadingLeaderboard ? (
                            <div className="text-center py-12 text-gray-500">Calculating Rankings...</div>
                        ) : (
                            <div className="space-y-4 max-w-4xl mx-auto">
                                {leaderboard.map((user, index) => {
                                    const rank = index + 1;
                                    return (
                                        <div key={user.id} className={`group flex flex-col md:flex-row items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] ${rank === 1 ? 'bg-gradient-to-r from-[#cff532]/20 to-transparent border-[#cff532]/30' : rank <= 3 ? 'bg-white/5 border-white/10' : 'bg-black/40 border-white/5'}`}>

                                            {/* Rank Badge */}
                                            <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 flex-shrink-0">
                                                {rank <= 3 ? (
                                                    <div className={`relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full font-black text-lg md:text-xl shadow-lg
                                                        ${rank === 1 ? 'bg-[#cff532] text-black shadow-[#cff532]/40' :
                                                            rank === 2 ? 'bg-gray-300 text-black shadow-gray-300/40' :
                                                                'bg-amber-600 text-white shadow-amber-600/40'}`}>
                                                        {rank}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 font-bold text-xl">#{rank}</span>
                                                )}
                                            </div>

                                            {/* User Info */}
                                            <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
                                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg">
                                                    {user.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold text-lg ${rank === 1 ? 'text-[#cff532]' : 'text-white'}`}>
                                                        {user.full_name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                                        <span>{user.plan}</span>
                                                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                                        <span className={user.status === 'Active (In Gym)' ? 'text-[#cff532]' : ''}>{user.status}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* XP Stats */}
                                            <div className="flex items-center justify-between w-full md:w-auto gap-8 md:px-8 mt-2 md:mt-0 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                                                <div className="text-center">
                                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Level</div>
                                                    <div className="text-white font-mono font-bold text-lg">{Math.floor(user.xp / 60) + 1}</div>
                                                </div>
                                                <div className="text-right min-w-[100px]">
                                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total XP</div>
                                                    <div className="text-[#cff532] font-mono font-black text-2xl">{user.xp.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
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
                            <>
                                {/* Mobile Cards View */}
                                <div className="md:hidden space-y-4">
                                    {filteredMembers.map((member) => (
                                        <div key={member.id} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 flex flex-col gap-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#cff532] font-bold">
                                                        {member.full_name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white text-lg">{member.full_name}</div>
                                                        <div className="text-xs text-gray-500">{member.email}</div>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${member.status.startsWith('Active') ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {member.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Plan</div>
                                                    <div className="text-gray-300 font-bold text-sm">{member.plan}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Due Amount</div>
                                                    <div className={`font-mono font-bold text-sm ${member.due_amount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                        {member.due_amount > 0 ? `₹${member.due_amount}` : 'Paid'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-4">
                                                <button
                                                    onClick={() => handleViewMember(member)}
                                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 rounded-lg transition-colors border border-white/5"
                                                >
                                                    History
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setManagingPaymentsFor(member); }}
                                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 rounded-lg transition-colors border border-white/5"
                                                >
                                                    Payments
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingMember(member); }}
                                                    className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white p-2 rounded-lg transition-colors border border-white/5"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteMember(member.id); }}
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-lg transition-colors border border-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/10 text-gray-400 text-sm uppercase">
                                                <th className="pb-4">Name</th>
                                                <th className="pb-4">Plan</th>
                                                <th className="pb-4">Status</th>
                                                <th className="pb-4">Due (₹)</th>
                                                <th className="pb-4">Joined</th>
                                                <th className="pb-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredMembers.map((member) => (
                                                <tr key={member.id} className="group hover:bg-white/5 transition-colors">
                                                    <td className="py-4 cursor-pointer" onClick={() => handleViewMember(member)}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#cff532] font-bold">
                                                                {member.full_name?.[0] || '?'}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white group-hover:text-[#cff532] transition-colors">{member.full_name}</div>
                                                                <div className="text-xs text-gray-500">{member.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-gray-300">{member.plan}</td>
                                                    <td className="py-4">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${member.status.startsWith('Active') ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                            {member.status}
                                                        </span>
                                                    </td>
                                                    <td className={`py-4 font-mono font-bold ${member.due_amount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                        {member.due_amount > 0 ? `₹${member.due_amount}` : 'Paid'}
                                                    </td>
                                                    <td className="py-4 text-gray-400 text-sm">
                                                        {new Date(member.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <button
                                                            onClick={() => handleViewMember(member)}
                                                            className="text-gray-400 hover:text-white mr-3 text-sm"
                                                        >
                                                            History
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setManagingPaymentsFor(member); }}
                                                            className="text-gray-400 hover:text-white mr-3 text-sm"
                                                        >
                                                            Payments
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingMember(member); }}
                                                            className="text-gray-400 hover:text-white mr-3 text-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteMember(member.id); }}
                                                            className="text-red-500 hover:text-red-400 text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                No members found.
                            </div>
                        )}

                        {/* View Member Modal */}
                        {viewingMember && (
                            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
                                >
                                    {/* Header */}
                                    <div className="p-6 border-b border-white/10 flex items-start justify-between bg-[#161616]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#cff532] to-[#bce628] flex items-center justify-center text-black text-2xl font-bold">
                                                {viewingMember.full_name?.[0] || '?'}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white">{viewingMember.full_name}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <span>{viewingMember.plan} Member</span>
                                                    <span>•</span>
                                                    <span className={viewingMember.status.startsWith('Active') ? 'text-green-400' : 'text-yellow-400'}>{viewingMember.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setViewingMember(null)}
                                            className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="p-6 overflow-y-auto">
                                        {/* Stats Row */}
                                        <div className="grid grid-cols-3 gap-4 mb-8">
                                            <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                                                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Visits</span>
                                                <div className="text-2xl font-black text-white mt-1">{viewingStats.totalVisits}</div>
                                            </div>
                                            <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                                                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Time</span>
                                                <div className="text-2xl font-black text-white mt-1">{(viewingStats.totalMinutes / 60).toFixed(1)} <span className="text-sm text-gray-500 font-normal">hrs</span></div>
                                            </div>
                                            <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                                                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Last Visit</span>
                                                <div className="text-lg font-bold text-white mt-1">
                                                    {viewingMemberLogs[0] ? new Date(viewingMemberLogs[0].check_in_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activity Calendar */}
                                        <div className="mb-8">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-white font-bold flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-[#cff532]" />
                                                    Activity Map
                                                </h4>
                                                <div className="text-[10px] text-gray-500 font-mono">
                                                    LAST 365 DAYS
                                                </div>
                                            </div>
                                            <div
                                                ref={calendarScrollRef}
                                                className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5 rounded-2xl p-5 overflow-x-auto custom-scrollbar custom-scrollbar-x"
                                            >
                                                <div className="min-w-max">
                                                    {/* Month Labels */}
                                                    <div className="flex mb-2 text-[10px] text-gray-500 font-mono font-bold tracking-wider pl-1">
                                                        {Array.from({ length: 12 }).map((_, i) => {
                                                            const date = new Date();
                                                            date.setMonth(date.getMonth() - (11 - i));
                                                            return (
                                                                <div key={i} className="w-[56px] text-center text-gray-600">
                                                                    {date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="flex gap-[3px]">
                                                        {Array.from({ length: 53 }).map((_, weekIndex) => (
                                                            <div key={weekIndex} className="flex flex-col gap-[3px]">
                                                                {Array.from({ length: 7 }).map((_, dayIndex) => {
                                                                    const dayOfYear = weekIndex * 7 + dayIndex;
                                                                    const date = new Date();
                                                                    date.setDate(date.getDate() - (365 - dayOfYear));

                                                                    const dateString = date.toISOString().split('T')[0];
                                                                    const dayLog = viewingMemberLogs.find(log => log.check_in_time.startsWith(dateString));

                                                                    // Activity Level: 0 (None), 1 (Light), 2 (Medium), 3 (Heavy)
                                                                    let intensity = 0;
                                                                    if (dayLog) {
                                                                        const mins = dayLog.duration_minutes || 0;
                                                                        if (mins > 60) intensity = 3;      // Brightest (> 1hr)
                                                                        else if (mins > 30) intensity = 2; // Medium
                                                                        else intensity = 1;                // Light
                                                                    }

                                                                    const colors = [
                                                                        'bg-[#1a1a1a]',   // 0
                                                                        'bg-[#cff532]/30', // 1
                                                                        'bg-[#cff532]/60', // 2
                                                                        'bg-[#cff532]'     // 3
                                                                    ];

                                                                    return (
                                                                        <div
                                                                            key={dayIndex}
                                                                            className={`w-3 h-3 rounded-sm ${colors[intensity]}`}
                                                                            title={`${dateString}: ${dayLog ? (dayLog.duration_minutes || 'Ongoing') + ' mins' : 'No activity'}`}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mt-3 px-1">
                                                    <span className="text-[10px] text-gray-500 font-mono">CONSISTENCY SCORE: <span className="text-[#cff532]">Top 10%</span></span>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                        <span>Rest</span>
                                                        <div className="w-3 h-3 rounded-[3px] bg-white/5" />
                                                        <div className="w-3 h-3 rounded-[3px] bg-[#cff532]/30" />
                                                        <div className="w-3 h-3 rounded-[3px] bg-[#cff532]/60" />
                                                        <div className="w-3 h-3 rounded-sm bg-[#cff532]" />
                                                        <span>Crushed It</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* History Table */}
                                        <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-[#cff532]" />
                                            Check-in History
                                        </h4>

                                        <div className="bg-black/40 border border-white/5 rounded-xl overflow-hidden">
                                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                                <table className="w-full text-left text-sm relative">
                                                    <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-xs sticky top-0 z-10 shadow-lg">
                                                        <tr>
                                                            <th className="px-4 py-3 bg-[#1a1a1a]">Date</th>
                                                            <th className="px-4 py-3 bg-[#1a1a1a]">Check In</th>
                                                            <th className="px-4 py-3 bg-[#1a1a1a]">Duration</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {viewingMemberLogs.map((log) => (
                                                            <tr key={log.id} className="hover:bg-white/5">
                                                                <td className="px-4 py-3 text-white font-medium">
                                                                    {new Date(log.check_in_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-400">
                                                                    {new Date(log.check_in_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-400">
                                                                    {log.duration_minutes ? (
                                                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#cff532]/10 text-[#cff532] text-xs font-bold">
                                                                            <Dumbbell className="w-3 h-3" />
                                                                            {log.duration_minutes} min
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-yellow-500 text-xs italic">Ongoing</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {viewingMemberLogs.length === 0 && (
                                                            <tr>
                                                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">No activity logs found.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
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
                                                onChange={(e) => {
                                                    const newPlan = e.target.value;
                                                    let newDue = editingMember.due_amount;
                                                    // Auto-update due amount based on plan price
                                                    if (newPlan === 'Monthly Plan') newDue = 3000;
                                                    else if (newPlan === '6-Month Plan') newDue = 12000;
                                                    else if (newPlan === 'Yearly Plan') newDue = 20000;

                                                    setEditingMember({ ...editingMember, plan: newPlan, due_amount: newDue });
                                                }}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#cff532]"
                                            >
                                                <option value="Monthly Plan">Monthly Plan</option>
                                                <option value="6-Month Plan">6-Month Plan</option>
                                                <option value="Yearly Plan">Yearly Plan</option>
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
                                                <option value="Active (In Gym)">Active (In Gym)</option>
                                                <option value="Inactive">Inactive</option>
                                                <option value="Pending">Pending</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Due Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={editingMember.due_amount || 0}
                                                onChange={(e) => setEditingMember({ ...editingMember, due_amount: parseFloat(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#cff532]"
                                            />
                                        </div>
                                        <div className="pt-4 border-t border-white/10 mt-6">


                                        </div>

                                        <button type="submit" className="w-full bg-[#cff532] text-black font-bold py-3 rounded-xl mt-6 hover:bg-[#bce628] transition-colors">
                                            Save Changes
                                        </button>
                                    </form>
                                </motion.div>
                            </div>
                        )}

                        {/* Payments Management Modal */}
                        {managingPaymentsFor && (
                            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-lg relative flex flex-col max-h-[85vh]"
                                >
                                    <button
                                        onClick={() => setManagingPaymentsFor(null)}
                                        className="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    <h3 className="text-xl font-bold text-white mb-1">Manage Payments</h3>
                                    <p className="text-sm text-gray-400 mb-6">For {managingPaymentsFor.full_name}</p>

                                    {/* Add Payment Form */}
                                    <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/10">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Record New Payment</h4>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Amount (₹)"
                                                    value={newPaymentAmount}
                                                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#cff532]"
                                                />
                                                <select
                                                    value={newPaymentMethod}
                                                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#cff532]"
                                                >
                                                    <option value="Cash">Cash</option>
                                                    <option value="UPI">UPI</option>
                                                    <option value="Card">Card</option>
                                                    <option value="Bank Transfer">Bank Transfer</option>
                                                </select>
                                            </div>
                                            <button
                                                onClick={handleAddPayment}
                                                disabled={!newPaymentAmount}
                                                className="w-full bg-[#cff532] text-black font-bold py-2 rounded-lg hover:bg-[#bce628] transition-colors disabled:opacity-50"
                                            >
                                                Add Payment
                                            </button>
                                        </div>
                                    </div>

                                    {/* History List */}
                                    <div>
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Payment History</h4>
                                        <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-[150px]">
                                            {memberPayments.length > 0 ? (
                                                memberPayments.map((payment) => (
                                                    <div key={payment.id} className="flex justify-between items-center text-sm bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                                        <div>
                                                            <div className="text-white font-bold">₹{payment.amount.toLocaleString()}</div>
                                                            <div className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleDateString()} • {new Date(payment.payment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="px-2 py-1 rounded bg-white/10 text-xs font-mono text-gray-300 border border-white/5">
                                                                {payment.payment_method || 'Cash'}
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeletePayment(payment.id)}
                                                                className="text-gray-500 hover:text-red-500 transition-colors p-1"
                                                                title="Delete Payment"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-gray-500 text-sm text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                                                    No payments found.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </div>
                )}


                {/* Revenue View */}
                {activeTab === 'Revenue' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
                                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Monthly Revenue</h3>
                                <p className="text-3xl font-black text-white">₹{monthlyRevenue.toLocaleString()}</p>
                                <span className="text-green-400 text-sm font-bold flex items-center gap-1 mt-2">
                                    <Activity className="w-4 h-4" />
                                    +12% from last month
                                </span>
                            </div>
                            <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
                                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Projected Annual</h3>
                                <p className="text-3xl font-black text-white">₹{(monthlyRevenue * 12).toLocaleString()}</p>
                            </div>
                            <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
                                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Average Revenue Per User</h3>
                                <p className="text-3xl font-black text-white">₹{activeMembers > 0 ? (monthlyRevenue / activeMembers).toFixed(2) : '0'}</p>
                            </div>
                        </div>

                        {/* Revenue Breakdown */}
                        <div className="bg-[#111] rounded-2xl border border-white/5 p-6 md:p-8">
                            <h2 className="text-xl font-bold text-white mb-6">Revenue Breakdown</h2>
                            <div className="space-y-4">
                                {['Yearly Plan', '6-Month Plan', 'Monthly Plan'].map(plan => {
                                    const count = members.filter(m => m.plan === plan && m.status.startsWith('Active')).length;
                                    let price = 0;
                                    switch (plan) {
                                        case 'Yearly Plan': price = prices.yearly; break;
                                        case '6-Month Plan': price = prices.sixMonth; break;
                                        case 'Monthly Plan': price = prices.monthly; break;
                                    }
                                    const revenue = count * price;
                                    const percentage = monthlyRevenue > 0 ? (revenue / monthlyRevenue) * 100 : 0;

                                    return (
                                        <div key={plan} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-white font-bold">{plan}</span>
                                                <span className="text-gray-400">₹{revenue.toLocaleString()} ({count} members)</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#cff532]"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings View */}
                {activeTab === 'Settings' && (
                    <div className="max-w-4xl space-y-8 animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">System Settings</h2>
                                <p className="text-gray-400">Manage your gym's configuration and preferences.</p>
                            </div>
                            <button
                                onClick={handleSaveSettings}
                                className="bg-[#cff532] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#bce628] transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#cff532]/20"
                            >
                                <Save className="w-5 h-5" />
                                Save Changes
                            </button>
                        </div>

                        {/* General Settings */}
                        <section className="bg-[#111] rounded-3xl border border-white/5 overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-white/5 flex items-center gap-3">
                                <div className="p-3 bg-blue-500/10 rounded-xl">
                                    <Globe className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">General Information</h3>
                                    <p className="text-sm text-gray-400">Basic details about your gym facility</p>
                                </div>
                            </div>
                            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Gym Name</label>
                                    <input
                                        type="text"
                                        value={generalSettings.gymName}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, gymName: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#cff532] transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Support Email</label>
                                    <input
                                        type="email"
                                        value={generalSettings.email}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#cff532] transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={generalSettings.phone}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#cff532] transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Address</label>
                                    <input
                                        type="text"
                                        value={generalSettings.address}
                                        onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#cff532] transition-colors"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Membership Pricing */}
                        <section className="bg-[#111] rounded-3xl border border-white/5 overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-white/5 flex items-center gap-3">
                                <div className="p-3 bg-green-500/10 rounded-xl">
                                    <IndianRupee className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Membership Pricing</h3>
                                    <p className="text-sm text-gray-400">Manage monthly subscription costs</p>
                                </div>
                            </div>
                            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Monthly Plan (₹)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={prices.monthly}
                                            onChange={(e) => setPrices({ ...prices, monthly: Number(e.target.value) })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#cff532] transition-colors"
                                        />
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">6-Month Plan (₹)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={prices.sixMonth}
                                            onChange={(e) => setPrices({ ...prices, sixMonth: Number(e.target.value) })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#cff532] transition-colors"
                                        />
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Yearly Plan (₹)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={prices.yearly}
                                            onChange={(e) => setPrices({ ...prices, yearly: Number(e.target.value) })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#cff532] transition-colors"
                                        />
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Security */}
                        <section className="bg-[#111] rounded-3xl border border-white/5 overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-white/5 flex items-center gap-3">
                                <div className="p-3 bg-red-500/10 rounded-xl">
                                    <Shield className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Security & Access</h3>
                                    <p className="text-sm text-gray-400">Manage passwords and admin access</p>
                                </div>
                            </div>
                            <div className="p-6 md:p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Current Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#cff532] transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">New Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#cff532] transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <Bell className="w-5 h-5 text-yellow-500" />
                                        <span className="text-white font-medium">Email Notifications for New Signups</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" defaultChecked className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#cff532]"></div>
                                    </label>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
