"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

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
                        <Link href="/auth" className="group bg-[#cff532] text-black px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#bce628] transition-all hover:scale-105 w-fit">
                            Start Your Journey
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>
            </div>


        </section >
    );
}
