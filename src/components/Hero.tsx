"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
    return (
        <section id="home" className="relative h-screen w-full overflow-hidden flex items-center justify-center">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2670&auto=format&fit=crop')",
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                <div className="absolute inset-0 bg-black/40" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-3xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <span className="text-[#cff532] font-bold tracking-[0.2em] uppercase text-sm md:text-base mb-4 block">
                            Welcome to the Future of Fitness
                        </span>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight mb-6">
                            REDEFINE <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#cff532] to-white">
                                YOUR LIMITS
                            </span>
                        </h1>
                        <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-xl leading-relaxed">
                            Experience state-of-the-art equipment, elite personal training, and a community
                            that pushes you further. Your evolution starts here.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <button className="group bg-[#cff532] text-black px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#bce628] transition-all hover:scale-105">
                            Start Your Journey
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="group border border-white/30 hover:border-[#cff532] text-white hover:text-[#cff532] px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 backdrop-blur-sm transition-all hover:bg-white/5">
                            <Play className="fill-current w-4 h-4" />
                            Watch Video
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <span className="text-white/50 text-xs tracking-widest uppercase">Scroll</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-[#cff532] to-transparent" />
            </motion.div>
        </section>
    );
}
