"use client";

import { motion } from "framer-motion";
import { Instagram, Twitter } from "lucide-react";

const trainers = [
    {
        name: "Alex Sterling",
        role: "Strength Coach",
        image: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=2574&auto=format&fit=crop",
    },
    {
        name: "Sarah Connors",
        role: "HIIT Specialist",
        image: "https://images.unsplash.com/photo-1611672585731-fa10603fb8e0?q=80&w=2574&auto=format&fit=crop",
    },
    {
        name: "Marcus Thorne",
        role: "Bodybuilding Pro",
        image: "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?q=80&w=2574&auto=format&fit=crop",
    },
    {
        name: "Elena Rodriguez",
        role: "Mobility Expert",
        image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=2574&auto=format&fit=crop",
    }
];

export default function Trainers() {
    return (
        <section id="trainers" className="py-24 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-black text-white mb-4 uppercase italic"
                    >
                        Meet The <span className="text-[#cff532]">Elite</span>
                    </motion.h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Train with the best in the industry.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {trainers.map((trainer, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative overflow-hidden rounded-xl bg-[#111] aspect-[3/4]"
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                style={{ backgroundImage: `url(${trainer.image})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

                            <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="text-2xl font-bold text-white uppercase italic mb-1">{trainer.name}</h3>
                                <p className="text-[#cff532] font-medium mb-4">{trainer.role}</p>

                                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                    <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-[#cff532] hover:text-black transition-colors text-white">
                                        <Instagram className="w-5 h-5" />
                                    </a>
                                    <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-[#cff532] hover:text-black transition-colors text-white">
                                        <Twitter className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
