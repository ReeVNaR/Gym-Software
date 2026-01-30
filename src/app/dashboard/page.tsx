"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Dumbbell, Activity, Calendar, LogOut, X, Home, Trophy, User } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function MemberDashboard() {
    const router = useRouter();
    const [member, setMember] = useState<any>(null);
    const [lastActivity, setLastActivity] = useState<any>(null);
    const [elapsedTime, setElapsedTime] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

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

    // Leaderboard Data Fetch
    useEffect(() => {
        if (activeTab === 'leaderboard') {
            async function fetchLeaderboard() {
                setLoadingLeaderboard(true);
                try {
                    // Get all members
                    const { data: allMembers, error: membersError } = await supabase
                        .from('members')
                        .select('id, full_name');

                    if (membersError) throw membersError;

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
                        .sort((a, b) => b.xp - a.xp)
                        .slice(0, 10); // Top 10

                    setLeaderboard(sortedLeaderboard);
                } catch (e) {
                    console.error("Error fetching leaderboard", e);
                } finally {
                    setLoadingLeaderboard(false);
                }
            }
            fetchLeaderboard();
        }
    }, [activeTab]);

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
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#cff532] selection:text-black pb-24">
            {/* Brand Header */}
            <header className="border-b border-white/10 bg-[#111]/80 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-center relative">
                    <div className="flex items-center gap-2">
                        <div className="bg-[#cff532] p-1.5 rounded-lg shadow-[0_0_15px_rgba(207,245,50,0.3)]">
                            <Dumbbell className="h-5 w-5 text-black" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg tracking-wider leading-none">IRON PULSE</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 pt-6 space-y-6">

                {/* HOME TAB */}
                {activeTab === 'home' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Welcome & Status */}
                        <div>
                            <h1 className="text-2xl font-black mb-4">
                                Hello, <span className="text-[#cff532]">{member.full_name.split(' ')[0]}</span>
                            </h1>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${member.status === 'Active (In Gym)' ? 'bg-[#cff532] shadow-[0_0_10px_#cff532] animate-pulse' : 'bg-gray-500'}`} />
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Status</div>
                                        <div className={`font-bold ${member.status === 'Active (In Gym)' ? 'text-[#cff532]' : 'text-white'}`}>
                                            {member.status === 'Active (In Gym)' ? 'Checked In' : 'Checked Out'}
                                        </div>
                                    </div>
                                </div>
                                {member.status === 'Active (In Gym)' && (
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Duration</div>
                                        <div className="font-mono text-[#cff532] font-bold">{elapsedTime || '0m 0s'}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* QR Code Card */}
                        <div className="relative group perspective-1000">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#cff532] to-blue-600 rounded-[2rem] blur opacity-30 transition duration-1000" />
                            <div className="relative bg-[#111] overflow-hidden rounded-[1.75rem] border border-white/10 shadow-2xl flex flex-col items-center p-8 gap-6">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#cff532]/10 rounded-full blur-[40px] pointer-events-none" />

                                <div className="bg-white p-3 rounded-2xl shadow-lg">
                                    <QRCodeSVG value={member.id} size={200} className="w-full h-auto max-w-[200px]" />
                                </div>

                                <p className="text-xs text-gray-500 flex items-center gap-2 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#cff532]" />
                                    Scan at reception
                                </p>
                            </div>
                        </div>

                        {/* Recent Stat */}
                        <div className="bg-gradient-to-r from-[#cff532] to-[#bce628] rounded-2xl p-5 text-black relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <div className="text-xs font-black uppercase opacity-60 mb-1">Monthly Streak</div>
                                    <div className="text-3xl font-black">{daysVisitedThisMonth} Days</div>
                                </div>
                                <Activity className="w-8 h-8 opacity-80" />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* SCHEDULE TAB */}
                {activeTab === 'schedule' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <h2 className="text-xl font-bold mb-4">Class Schedule</h2>

                        {/* Day Selector (Visual Only) */}
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 custom-scrollbar-x hidden-scrollbar">
                            {Array.from({ length: 7 }).map((_, i) => {
                                const d = new Date();
                                d.setDate(d.getDate() + i);
                                const isToday = i === 0;
                                return (
                                    <div key={i} className={`flex-shrink-0 w-14 h-20 rounded-xl flex flex-col items-center justify-center gap-1 border ${isToday ? 'bg-[#cff532] text-black border-[#cff532]' : 'bg-[#111] border-white/10 text-gray-400'}`}>
                                        <span className="text-xs font-bold">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                        <span className={`text-xl font-black ${isToday ? 'text-black' : 'text-white'}`}>{d.getDate()}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="space-y-3">
                            {[
                                { time: '09:00 AM', name: 'Morning HIIT', trainer: 'Sarah C.', duration: '45m', type: 'Cardio' },
                                { time: '05:30 PM', name: 'Power Yoga', trainer: 'Mike R.', duration: '60m', type: 'Flexibility' },
                                { time: '07:00 PM', name: 'CrossFit Pro', trainer: 'Alex T.', duration: '50m', type: 'Strength' },
                            ].map((session, i) => (
                                <div key={i} className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center gap-4">
                                    <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-white/10 pr-4">
                                        <span className="text-white font-bold text-sm whitespace-nowrap">{session.time}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold">{session.name}</h3>
                                        <p className="text-xs text-gray-400">{session.trainer} • {session.duration}</p>
                                    </div>
                                    <button className="bg-white/10 text-white p-2 rounded-lg hover:bg-[#cff532] hover:text-black transition-colors">
                                        <Calendar className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* LEADERBOARD TAB */}
                {activeTab === 'leaderboard' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="text-center mb-6">
                            <Trophy className="w-12 h-12 text-[#cff532] mx-auto mb-2" />
                            <h2 className="text-2xl font-black text-white">Top Performers</h2>
                            <p className="text-gray-400 text-sm">Most consistant members this month</p>
                        </div>

                        <div className="space-y-4">
                            {loadingLeaderboard ? (
                                <div className="text-center text-gray-500 py-10">Loading rankings...</div>
                            ) : leaderboard.map((user, index) => {
                                const rank = index + 1;
                                const isCurrentUser = user.id === member.id;
                                return (
                                    <div key={user.id} className={`relative flex items-center gap-4 p-4 rounded-2xl border ${rank === 1 ? 'bg-gradient-to-r from-[#cff532]/20 to-transparent border-[#cff532]/30' : isCurrentUser ? 'bg-white/10 border-white/20' : 'bg-[#111] border-white/5'}`}>
                                        <div className={`w-8 h-8 flex items-center justify-center font-black italic text-lg ${rank === 1 ? 'text-[#cff532]' : 'text-gray-500'}`}>
                                            #{rank}
                                        </div>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-black ${rank === 1 ? 'bg-[#cff532]' : 'bg-gray-700 text-white'}`}>
                                            {user.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex-1">
                                            <div className={`font-bold ${rank === 1 ? 'text-[#cff532]' : 'text-white'}`}>
                                                {user.full_name} {isCurrentUser && '(You)'}
                                            </div>
                                            <div className="text-xs text-gray-500">Level {Math.floor(user.xp / 60) + 1} Member</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[#cff532] font-mono font-bold text-lg">{user.xp} XP</div>
                                            <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Total Score</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="p-4 bg-[#111] rounded-xl border border-white/10 mt-8 text-center">
                            <p className="text-gray-400 text-sm">
                                You have earned <span className="text-[#cff532] font-bold">{leaderboard.find(u => u.id === member.id)?.xp || 0} XP</span> total
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ACCOUNT TAB */}
                {activeTab === 'account' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Profile Header */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#cff532] to-blue-500 flex items-center justify-center text-black font-black text-2xl">
                                {member.full_name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{member.full_name}</h2>
                                <p className="text-sm text-gray-400">{member.email}</p>
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#111] p-4 rounded-xl border border-white/5">
                                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Plan</div>
                                <div className="text-[#cff532] font-bold">{member.plan}</div>
                            </div>
                            <div className="bg-[#111] p-4 rounded-xl border border-white/5">
                                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Join Date</div>
                                <div className="text-white font-bold">{new Date(member.created_at).toLocaleDateString()}</div>
                            </div>
                        </div>

                        {/* Activity Map (Moved here) */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-white">Activity Map</h3>
                                <span className="text-xs text-gray-500">Last 365 Days</span>
                            </div>
                            <div
                                ref={calendarScrollRef}
                                className="bg-[#050505] border border-white/5 rounded-xl p-4 overflow-x-auto custom-scrollbar custom-scrollbar-x flex"
                            >
                                <div className="min-w-max">
                                    <div className="flex gap-[3px]">
                                        {Array.from({ length: 53 }).map((_, weekIndex) => (
                                            <div key={weekIndex} className="flex flex-col gap-[3px]">
                                                {Array.from({ length: 7 }).map((_, dayIndex) => {
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
                                                            className={`w-2.5 h-2.5 rounded-[1px] ${colors[intensity]}`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 p-4 rounded-xl font-bold hover:bg-red-500/20 transition-colors mt-8"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </motion.div>
                )}

            </main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#050505]/80 backdrop-blur-xl border-t border-white/10 z-50 pb-6 pt-2">
                <div className="flex justify-between items-center px-6 max-w-md mx-auto">
                    {[
                        { id: 'home', icon: Home, label: 'Home' },
                        { id: 'schedule', icon: Calendar, label: 'Schedule' },
                        { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
                        { id: 'account', icon: User, label: 'My Acc.' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-300 ${activeTab === tab.id ? 'text-[#cff532] scale-105' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'fill-current' : ''}`} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
