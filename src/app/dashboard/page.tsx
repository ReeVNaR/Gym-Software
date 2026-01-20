"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Dumbbell, Activity, Calendar, LogOut } from "lucide-react";

export default function MemberDashboard() {
    const router = useRouter();
    const [member, setMember] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const memberId = localStorage.getItem("memberId");

        async function checkSession() {
            if (!memberId) {
                router.push("/auth");
                return;
            }

            // Real validation would verify a session token, 
            // but for this demo we double check the ID against Supabase
            const { data, error } = await supabase
                .from("members")
                .select("*")
                .eq("id", memberId)
                .single();

            if (data) {
                if (data.status !== "Active") {
                    alert("Your account is no longer active.");
                    localStorage.removeItem("memberId");
                    router.push("/auth");
                } else {
                    setMember(data);
                    setIsLoading(false);
                }
            } else {
                localStorage.removeItem("memberId");
                router.push("/auth");
            }
        }

        checkSession();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("memberId");
        router.push("/");
    };

    if (isLoading) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading Your Profile...</div>;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <nav className="border-b border-white/10 bg-[#111]">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-[#cff532] p-2 rounded-full">
                            <Dumbbell className="h-6 w-6 text-black" />
                        </div>
                        <span className="font-bold text-xl tracking-wider">IRON PULSE <span className="text-[#cff532] text-xs align-top">MEMBER</span></span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-6 md:p-12">
                <header className="mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black mb-4"
                    >
                        WELCOME BACK, <span className="text-[#cff532] uppercase">{member.full_name.split(' ')[0]}</span>
                    </motion.h1>
                    <p className="text-gray-400 text-lg">Your {member.plan} plan is active. Ready to crash it today?</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* ID Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-8 rounded-3xl border border-white/10 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-32 bg-[#cff532]/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-[#cff532] flex items-center justify-center text-4xl font-black text-black mb-4 shadow-[0_0_20px_rgba(207,245,50,0.3)]">
                                {member.full_name[0]}
                            </div>
                            <h2 className="text-2xl font-bold mb-1">{member.full_name}</h2>
                            <div className="px-3 py-1 bg-[#cff532]/20 text-[#cff532] font-bold text-xs rounded-full uppercase tracking-wider mb-6">
                                {member.plan} Member
                            </div>
                            <div className="text-sm text-gray-500 font-mono tracking-widest uppercase">ID: {member.id.slice(0, 8)}</div>
                        </div>
                    </motion.div>

                    {/* Status Actions */}
                    <div className="space-y-6">
                        <div className="bg-[#111] p-6 rounded-2xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-[#cff532]/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Today's Schedule</h3>
                                    <p className="text-gray-400 text-sm">You have no classes booked.</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#111] p-6 rounded-2xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-[#cff532]/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Activity Log</h3>
                                    <p className="text-gray-400 text-sm">Last visit: 2 days ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
