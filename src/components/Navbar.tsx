"use client";

import { motion } from "framer-motion";
import { Dumbbell, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    return (
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-black/80 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center justify-between w-full max-w-5xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
                {/* Logo */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="bg-[#cff532] p-2 rounded-full flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-black fill-current" />
                    </div>
                    <span className="font-bold text-lg tracking-wider text-white hidden sm:block">IRON PULSE</span>
                </div>

                {/* Desktop Links - Floating Center */}
                <div className="hidden md:flex items-center space-x-1 bg-white/5 rounded-full px-1.5 py-1.5">
                    {['Home', 'Programs', 'Trainers', 'Pricing', 'Contact'].map((item) => (
                        <button
                            key={item}
                            onClick={() => {
                                const element = document.getElementById(item.toLowerCase());
                                element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="hover:bg-white/10 hover:text-white transition-all duration-300 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-gray-400 cursor-pointer"
                        >
                            {item}
                        </button>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <div className="hidden md:block">
                        <button
                            onClick={() => router.push('/auth')}
                            className="bg-[#cff532] text-black px-6 py-2.5 rounded-full font-bold hover:bg-[#bce628] transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(207,245,50,0.2)] cursor-pointer"
                        >
                            Join Now
                        </button>
                    </div>

                    <div className="md:hidden pr-2">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-white hover:text-[#cff532] transition-colors"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile menu dropdown */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute top-24 left-4 right-4 bg-[#111] border border-white/10 rounded-3xl p-4 shadow-2xl z-40 md:hidden"
                >
                    <div className="flex flex-col space-y-2">
                        {['Home', 'Programs', 'Trainers', 'Pricing', 'Contact'].map((item) => (
                            <button
                                key={item}
                                onClick={() => {
                                    setIsOpen(false);
                                    const element = document.getElementById(item.toLowerCase());
                                    element?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="text-gray-300 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl transition-all font-bold uppercase tracking-wide flex items-center justify-between text-sm w-full text-left"
                            >
                                {item}
                            </button>
                        ))}
                        <button
                            className="w-full mt-2 bg-[#cff532] text-black px-6 py-4 rounded-xl font-bold uppercase tracking-wide"
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/auth');
                            }}
                        >
                            Join Now
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
