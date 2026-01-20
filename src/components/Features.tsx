"use client";

import { motion } from "framer-motion";
import { Activity, Clock, Dumbbell, Zap, Trophy, Users } from "lucide-react";

const features = [
    {
        icon: Dumbbell,
        title: "Elite Equipment",
        description: "Train with the latest Hammer Strength & Eleiko equipment designed for champions."
    },
    {
        icon: Users,
        title: "Expert Trainers",
        description: "Our certified coaches will design a custom roadmap to crush your goals."
    },
    {
        icon: Clock,
        title: "24/7 Access",
        description: "Train on your schedule with round-the-clock biometric access."
    },
    {
        icon: Zap,
        title: "Recovery Zone",
        description: "Optimize your rest with our infrared saunas and cryotherapy chambers."
    },
    {
        icon: Activity,
        title: "Performance Tracking",
        description: "Track every rep and set with our integrated smart gym ecosystem."
    },
    {
        icon: Trophy,
        title: "Competitions",
        description: "Join monthly challenges and compete with the community for rewards."
    }
];

export default function Features() {
    return (
        <section id="features" className="py-24 bg-[#0a0a0a] relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#cff532]/5 to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-black text-white mb-4 uppercase italic"
                    >
                        Why Choose <span className="text-[#cff532]">Iron Pulse</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 max-w-2xl mx-auto text-lg"
                    >
                        We don't just provide machines. We provide an ecosystem for excellence.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -10 }}
                            className="group p-8 rounded-2xl bg-[#111] border border-white/5 hover:border-[#cff532]/50 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-[#cff532]/0 to-[#cff532]/0 group-hover:from-[#cff532]/5 group-hover:to-transparent transition-all duration-500" />

                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-[#1a1a1a] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#cff532] transition-colors duration-300">
                                    <feature.icon className="w-7 h-7 text-[#cff532] group-hover:text-black transition-colors duration-300" />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#cff532] transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
