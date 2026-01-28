"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Dumbbell, Activity, Calendar, LogOut, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function MemberDashboard() {
    const router = useRouter();
    const [member, setMember] = useState<any>(null);
    const [lastActivity, setLastActivity] = useState<any>(null);
    const [elapsedTime, setElapsedTime] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    const [activityHistory, setActivityHistory] = useState<any[]>([]);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const calendarScrollRef = useRef<HTMLDivElement>(null);
    const modalCalendarScrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll modal calendar when opened
    useEffect(() => {
        if (isActivityModalOpen && activityHistory.length > 0) {
            setTimeout(() => {
                if (modalCalendarScrollRef.current) {
                    modalCalendarScrollRef.current.scrollLeft = modalCalendarScrollRef.current.scrollWidth;
                }
            }, 100);
        }
    }, [isActivityModalOpen, activityHistory]);

    // Auto-scroll calendar on load
    useEffect(() => {
        if (activityHistory.length > 0 && calendarScrollRef.current) {
            setTimeout(() => {
                if (calendarScrollRef.current) {
                    calendarScrollRef.current.scrollLeft = calendarScrollRef.current.scrollWidth;
                }
            }, 500);
        }
    }, [activityHistory]);

    useEffect(() => {
        const memberId = localStorage.getItem("memberId");
        if (!memberId) {
            router.push("/auth");
            return;
        }

        async function fetchMemberData() {
            // Fetch Member Logic
            const { data, error } = await supabase
                .from("members")
                .select("*")
                .eq("id", memberId)
                .single();

            if (data) {
                if (!data.status.startsWith("Active")) {
                    // If status became inactive while viewing
                    if (data.status !== 'Active') { // Allow 'Active (In Gym)'
                        // Just warn, don't auto-logout immediately to avoid bad UX if it's just a transition
                        // But if they are truly inactive (e.g. ban), maybe.
                    }
                }
                setMember(data);

                // Fetch latest activity or open activity
                // Priority: Open session
                let { data: activity } = await supabase
                    .from('activity_logs')
                    .select('*')
                    .eq('member_id', memberId)
                    .is('check_out_time', null)
                    .maybeSingle();

                if (!activity) {
                    // If no open session, get latest history
                    const { data: latest } = await supabase
                        .from('activity_logs')
                        .select('*')
                        .eq('member_id', memberId)
                        .order('check_in_time', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    activity = latest;
                }

                // Fetch full history for calendar
                const { data: fullHistory } = await supabase
                    .from('activity_logs')
                    .select('*')
                    .eq('member_id', memberId)
                    .order('check_in_time', { ascending: false });

                if (fullHistory) setActivityHistory(fullHistory);

                setLastActivity(activity);
                setIsLoading(false);
            } else {
                localStorage.removeItem("memberId");
                router.push("/auth");
            }
        }

        fetchMemberData();

        // Realtime Subscription
        const channel = supabase
            .channel('member-dashboard')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'members', filter: `id=eq.${memberId}` },
                (payload) => {
                    setMember(payload.new);
                    // If status changed to In Gym, refetch activity to get the new log
                    if (payload.new.status === 'Active (In Gym)') {
                        setTimeout(fetchMemberData, 500); // Small delay to ensure log is created
                    } else {
                        fetchMemberData(); // Refresh to get the closed log
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router]);

    // Timer Logic
    useEffect(() => {
        if (member?.status === 'Active (In Gym)' && lastActivity && !lastActivity.check_out_time) {
            const interval = setInterval(() => {
                const start = new Date(lastActivity.check_in_time).getTime();
                const now = new Date().getTime();
                const diff = now - start;

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setElapsedTime(`${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setElapsedTime("");
        }
    }, [member, lastActivity]);

    const handleLogout = () => {
        localStorage.removeItem("memberId");
        router.push("/");
    };

    // Calculate stats
    const thisMonthLogs = activityHistory.filter(log => {
        const logDate = new Date(log.check_in_time);
        const now = new Date();
        return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
    });

    const daysVisitedThisMonth = new Set(thisMonthLogs.map(log => log.check_in_time.split('T')[0])).size;

    if (isLoading) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading Your Profile...</div>;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#cff532] selection:text-black">
            {/* Mobile-first Navigation */}
            <nav className="border-b border-white/10 bg-[#111]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="bg-[#cff532] p-1.5 md:p-2 rounded-lg shadow-[0_0_15px_rgba(207,245,50,0.3)]">
                            <Dumbbell className="h-5 w-5 md:h-6 md:w-6 text-black" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg md:text-xl tracking-wider leading-none">IRON PULSE</span>
                            <span className="text-[#cff532] text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">Member Portal</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden md:inline">Sign Out</span>
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-4 md:p-12 pb-24">
                {/* Header Section */}
                <header className="mb-8 md:mb-12 mt-4 md:mt-0 px-2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p className="text-gray-400 text-xs md:text-sm font-bold tracking-widest uppercase mb-2">Welcome Back</p>
                        <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight">
                            <span className="text-white">{member.full_name.split(' ')[0]}</span>
                            <span className="text-[#cff532]">.</span>
                        </h1>

                        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                            <div className={`w-2 h-2 rounded-full ${member.status === 'Active (In Gym)' ? 'bg-[#cff532] shadow-[0_0_10px_#cff532] animate-pulse' : 'bg-gray-500'}`} />
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Current Status</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${member.status === 'Active (In Gym)' ? 'text-[#cff532]' : 'text-white'}`}>
                                        {member.status === 'Active (In Gym)' ? 'Active (In Gym)' : member.status}
                                    </span>
                                    {member.status === 'Active (In Gym)' && (
                                        <span className="text-xs font-mono text-gray-400 border-l border-white/20 pl-2 ml-1">
                                            {elapsedTime || '0m 0s'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Digital ID Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="relative group perspective-1000"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#cff532] to-blue-600 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                        <div className="relative bg-[#111] overflow-hidden rounded-[1.75rem] border border-white/10 shadow-2xl flex flex-col md:flex-row lg:flex-col items-center p-6 md:p-8 gap-6 md:gap-8">
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#cff532]/5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[60px] -ml-12 -mb-12 pointer-events-none" />

                            {/* QR Code Section */}
                            <div className="relative z-10 bg-white p-3 rounded-2xl shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                                <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-2xl pointer-events-none" />
                                <QRCodeSVG value={member.id} size={160} className="w-full h-auto max-w-[160px]" />
                            </div>

                            {/* Member Details */}
                            <div className="flex-1 flex flex-col items-center md:items-start lg:items-center text-center md:text-left lg:text-center w-full z-10">
                                <h2 className="text-2xl font-bold text-white mb-1 group-hover:text-[#cff532] transition-colors">{member.full_name}</h2>
                                <div className="flex items-center gap-2 mb-4 justify-center md:justify-start lg:justify-center w-full">
                                    <span className="px-3 py-1 bg-[#cff532]/10 border border-[#cff532]/20 text-[#cff532] font-bold text-[10px] rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(207,245,50,0.1)]">
                                        {member.plan} Pass
                                    </span>
                                </div>

                                <div className="w-full h-px bg-white/10 mb-4" />

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <div className="bg-white/5 rounded-xl p-3 flex flex-col items-center">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Member ID</span>
                                        <span className="font-mono text-sm text-gray-300 font-bold">{member.id.slice(0, 8)}</span>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 flex flex-col items-center">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Valid Thru</span>
                                        <span className="font-mono text-sm text-gray-300 font-bold">
                                            {(() => {
                                                if (!member.created_at) return 'N/A';
                                                const start = new Date(member.created_at);
                                                const end = new Date(start);
                                                if (member.plan === 'Yearly Plan') end.setFullYear(end.getFullYear() + 1);
                                                else if (member.plan === '6-Month Plan') end.setMonth(end.getMonth() + 6);
                                                else end.setMonth(end.getMonth() + 1); // Monthly default

                                                return end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                                            })()}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-4 flex items-center gap-2 justify-center md:justify-start lg:justify-center w-full animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#cff532]" />
                                    Scan at front desk to check-in
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats & Actions Grid */}
                    <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* Activity Card - Now with Calendar */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            id="activity-map"
                            className="bg-[#111] p-6 rounded-[1.5rem] border border-white/5 hover:border-[#cff532]/30 transition-all group relative overflow-hidden flex flex-col h-full scroll-mt-24"
                        >
                            <div className="flex items-center justify-between mb-4 z-10 relative">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Activity Map</h3>
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono">LAST 365 DAYS</div>
                            </div>

                            <div className="relative z-10 flex-1 min-h-[140px]">
                                <div
                                    ref={calendarScrollRef}
                                    className="bg-[#050505] border border-white/5 rounded-xl p-4 overflow-x-auto custom-scrollbar custom-scrollbar-x h-full flex items-center"
                                >
                                    <div className="min-w-max">
                                        {/* Month Labels */}
                                        <div className="flex mb-2 text-[8px] text-gray-600 font-mono font-bold tracking-wider pl-1">
                                            {Array.from({ length: 12 }).map((_, i) => {
                                                const date = new Date();
                                                date.setMonth(date.getMonth() - (11 - i));
                                                return (
                                                    <div key={i} className="w-[44px] text-center">
                                                        {date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex gap-[2px]">
                                            {Array.from({ length: 53 }).map((_, weekIndex) => (
                                                <div key={weekIndex} className="flex flex-col gap-[2px]">
                                                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                                                        const dayOfYear = weekIndex * 7 + dayIndex;
                                                        const weeksBack = 52 - weekIndex;
                                                        const date = new Date();
                                                        date.setDate(date.getDate() - (weeksBack * 7) + (dayIndex - date.getDay()));

                                                        const dateString = date.toISOString().split('T')[0];
                                                        const dayLog = activityHistory.find(log => log.check_in_time.startsWith(dateString));

                                                        let intensity = 0;
                                                        if (dayLog) {
                                                            const mins = dayLog.duration_minutes || 0;
                                                            if (mins > 60) intensity = 3;
                                                            else if (mins > 30) intensity = 2;
                                                            else intensity = 1;
                                                        }

                                                        const colors = [
                                                            'bg-white/5',
                                                            'bg-[#cff532]/30',
                                                            'bg-[#cff532]/60',
                                                            'bg-[#cff532]'
                                                        ];

                                                        return (
                                                            <div
                                                                key={dayIndex}
                                                                title={`${new Date(dateString).toLocaleDateString()}: ${dayLog ? (dayLog.duration_minutes || 'Ongoing') + ' mins' : 'No activity'}`}
                                                                className={`w-2.5 h-2.5 rounded-[2px] ${colors[intensity]}`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Schedule Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-[#111] p-6 rounded-[1.5rem] border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute right-0 top-0 p-24 bg-blue-500/5 rounded-full blur-[60px] translate-x-10 -translate-y-10 group-hover:bg-blue-500/10 transition-colors" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">Schedule</h3>
                                <div className="flex flex-col mt-2">
                                    <div className="py-3 border-b border-white/5 last:border-0">
                                        <p className="text-white font-bold text-sm">HIIT Training</p>
                                        <p className="text-xs text-gray-500">Tomorrow • 10:00 AM</p>
                                    </div>
                                    <div className="py-2">
                                        <p className="text-white font-bold text-sm">Yoga Flow</p>
                                        <p className="text-xs text-gray-500">Fri • 08:00 AM</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Tips / Promo (New) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="col-span-1 md:col-span-2 bg-gradient-to-r from-[#cff532] to-[#bce628] rounded-[1.5rem] p-6 relative overflow-hidden"
                        >
                            <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-10 translate-y-10">
                                <Dumbbell className="w-48 h-48 text-black" />
                            </div>
                            <div className="relative z-10 text-black max-w-md">
                                <h3 className="text-2xl font-black mb-2 uppercase italic">Crush Your Goals</h3>
                                <p className="font-medium text-black/80 mb-4">You've visited the gym {daysVisitedThisMonth} days this month. Keep the streak alive!</p>
                                <button
                                    onClick={() => setIsActivityModalOpen(true)}
                                    className="bg-black text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-black/80 transition-colors cursor-pointer"
                                >
                                    View Progress
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Activity History Modal */}
                {isActivityModalOpen && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-white mb-2">ACTIVITY MAP</h2>
                                    <p className="text-gray-400">Your consistency journey over the last year</p>
                                </div>
                                <button
                                    onClick={() => setIsActivityModalOpen(false)}
                                    className="bg-white/5 hover:bg-white/10 p-3 rounded-full transition-colors text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 md:p-8 overflow-y-auto">
                                <div className="bg-[#050505] border border-white/5 rounded-2xl p-6 overflow-x-auto custom-scrollbar custom-scrollbar-x mb-8">
                                    <div className="min-w-max" ref={modalCalendarScrollRef}>
                                        {/* Month Labels */}
                                        <div className="flex mb-4 text-xs text-gray-500 font-mono font-bold tracking-wider pl-1">
                                            {Array.from({ length: 12 }).map((_, i) => {
                                                const date = new Date();
                                                date.setMonth(date.getMonth() - (11 - i));
                                                return (
                                                    <div key={i} className="w-[60px] md:w-[70px] text-center">
                                                        {date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex gap-[4px] md:gap-[5px]">
                                            {Array.from({ length: 53 }).map((_, weekIndex) => (
                                                <div key={weekIndex} className="flex flex-col gap-[4px] md:gap-[5px]">
                                                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                                                        const dayOfYear = weekIndex * 7 + dayIndex;
                                                        const weeksBack = 52 - weekIndex;
                                                        const date = new Date();
                                                        date.setDate(date.getDate() - (weeksBack * 7) + (dayIndex - date.getDay()));

                                                        const dateString = date.toISOString().split('T')[0];
                                                        const dayLog = activityHistory.find(log => log.check_in_time.startsWith(dateString));

                                                        let intensity = 0;
                                                        if (dayLog) {
                                                            const mins = dayLog.duration_minutes || 0;
                                                            if (mins > 60) intensity = 3;
                                                            else if (mins > 30) intensity = 2;
                                                            else intensity = 1;
                                                        }

                                                        const colors = [
                                                            'bg-white/5',
                                                            'bg-[#cff532]/30',
                                                            'bg-[#cff532]/60',
                                                            'bg-[#cff532]'
                                                        ];

                                                        return (
                                                            <div
                                                                key={dayIndex}
                                                                title={`${new Date(dateString).toLocaleDateString()}: ${dayLog ? (dayLog.duration_minutes || 'Ongoing') + ' mins' : 'No activity'}`}
                                                                className={`w-3 h-3 md:w-4 md:h-4 rounded-[3px] ${colors[intensity]}`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-[#cff532]" />
                                            Recent Activity
                                        </h3>
                                        <div className="space-y-4">
                                            {activityHistory.slice(0, 5).map(log => (
                                                <div key={log.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                                    <div>
                                                        <div className="text-white font-medium">{new Date(log.check_in_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                                                        <div className="text-xs text-gray-500">{new Date(log.check_in_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[#cff532] font-bold">{log.duration_minutes || 'Ongoing'} min</div>
                                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Duration</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-[#cff532]/20 to-blue-500/20 rounded-2xl p-6 border border-white/10 flex flex-col justify-center items-center text-center">
                                        <div className="w-16 h-16 bg-[#cff532] rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(207,245,50,0.3)]">
                                            <Dumbbell className="w-8 h-8 text-black" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-2">{daysVisitedThisMonth} Days</h3>
                                        <p className="text-gray-300">You're crushing it this month! Keep showing up.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
}
