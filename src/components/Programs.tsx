"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const programs = [
    {
        title: "Hypertrophy",
        image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2670&auto=format&fit=crop",
        description: "Scientifically designed specifically to maximize muscle growth."
    },
    {
        title: "Strength & Power",
        image: "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?q=80&w=2670&auto=format&fit=crop",
        description: "Build raw strength with our powerlifting and strongman focus tracks."
    },
    {
        title: "High Octane HIIT",
        image: "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?q=80&w=2525&auto=format&fit=crop",
        description: "Burn fat and improve endurance in our high-intensity interval sessions."
    },
    {
        title: "Mobility & Flow",
        image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=2670&auto=format&fit=crop",
        description: "Enhance recovery and flexibility to prevent injury and improve performance."
    }
];

export default function Programs() {
    return (
        <section id="programs" className="py-24 bg-black relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic">
                            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#cff532] to-white">Programs</span>
                        </h2>
                        <p className="text-gray-400 mt-4 max-w-lg">
                            Designed by world-class athletes to deliver specific results. Choose your path.
                        </p>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="text-white flex items-center gap-2 hover:text-[#cff532] transition-colors group"
                    >
                        View All Programs <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {programs.map((program, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer"
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                style={{ backgroundImage: `url(${program.image})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                            <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                <h3 className="text-2xl font-bold text-white mb-2 uppercase italic">{program.title}</h3>
                                <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300">
                                    <p className="text-gray-300 text-sm mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                        {program.description}
                                    </p>
                                    <span className="text-[#cff532] text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                        Start Training <ArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
