"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Contact() {
    return (
        <section id="contact" className="py-24 bg-black relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-8 uppercase italic">
                            Start Your <span className="text-[#cff532]">Transformation</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-12">
                            Ready to push your limits? Visit us or drop a message. Your future self is waiting.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="bg-[#cff532]/10 p-3 rounded-lg">
                                    <MapPin className="w-6 h-6 text-[#cff532]" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-xl mb-1">Location</h3>
                                    <p className="text-gray-400">123 Iron Street, Muscle City, MC 90210</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-[#cff532]/10 p-3 rounded-lg">
                                    <Phone className="w-6 h-6 text-[#cff532]" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-xl mb-1">Phone</h3>
                                    <p className="text-gray-400">+1 (555) 123-4567</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-[#cff532]/10 p-3 rounded-lg">
                                    <Mail className="w-6 h-6 text-[#cff532]" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-xl mb-1">Email</h3>
                                    <p className="text-gray-400">join@ironpulse.com</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-[#111] p-8 rounded-3xl border border-white/10"
                    >
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-400 text-sm font-bold mb-2 uppercase">First Name</label>
                                    <input type="text" className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#cff532] transition-colors" placeholder="John" />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm font-bold mb-2 uppercase">Last Name</label>
                                    <input type="text" className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#cff532] transition-colors" placeholder="Doe" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm font-bold mb-2 uppercase">Email Address</label>
                                <input type="email" className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#cff532] transition-colors" placeholder="john@example.com" />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm font-bold mb-2 uppercase">Goal</label>
                                <select className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#cff532] transition-colors appearance-none cursor-pointer">
                                    <option>Hypertrophy (Muscle Gain)</option>
                                    <option>Strength & Power</option>
                                    <option>Fat Loss</option>
                                    <option>General Fitness</option>
                                </select>
                            </div>

                            <button className="w-full bg-[#cff532] text-black font-bold uppercase tracking-wider py-4 rounded-lg hover:bg-[#bce628] transition-all hover:scale-[1.02] active:scale-[0.98]">
                                Join The Waitlist
                            </button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
