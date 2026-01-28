"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

const plans = [
    {
        name: "Monthly Plan",
        price: "₹3000",
        period: "/mo",
        features: [
            "Access to gym floor",
            "Locker room access",
            "Free WiFi",
            "Open 6am - 10pm"
        ],
        highlight: false,
        color: "bg-white/5",
        buttonColor: "bg-white text-black hover:bg-gray-200"
    },
    {
        name: "6-Month Plan",
        price: "₹12000",
        period: "/6mo",
        features: [
            "All Monthly benefits",
            "24/7 Gym Access",
            "Sauna & Recovery Zone",
            "Free Guest Pass (2/mo)",
            "Nutritional Guidance"
        ],
        highlight: true,
        color: "bg-[#1a1a1a] border-[#cff532]",
        buttonColor: "bg-[#cff532] text-black hover:bg-[#bce628]"
    },
    {
        name: "Yearly Plan",
        price: "₹20000",
        period: "/yr",
        features: [
            "All 6-Month benefits",
            "Personal Training (2 Sessions)",
            "Custom Workout Plan",
            "Priority Support",
            "Merch Pack Included"
        ],
        highlight: false,
        color: "bg-white/5",
        buttonColor: "bg-white text-black hover:bg-gray-200"
    }
];

export default function Membership() {
    const router = useRouter();
    return (
        <section id="pricing" className="py-24 bg-[#050505] relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-black text-white mb-4 uppercase italic"
                    >
                        Choose Your <span className="text-[#cff532]">Impact</span>
                    </motion.h2>
                    <p className="text-gray-400 text-lg">No contracts. Cancel anytime.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative p-8 rounded-3xl ${plan.highlight ? 'border-2 border-[#cff532] bg-[#111] shadow-[0_0_50px_-12px_rgba(207,245,50,0.3)] scale-105 z-10' : 'border border-white/10 bg-white/5'}`}
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#cff532] text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                            <div className="flex items-baseline mb-6">
                                <span className="text-4xl font-black text-white">{plan.price}</span>
                                {plan.period !== "" && <span className="text-gray-400 ml-1">{plan.period}</span>}
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start">
                                        <Check className={`w-5 h-5 mr-3 shrink-0 ${plan.highlight ? 'text-[#cff532]' : 'text-gray-500'}`} />
                                        <span className="text-gray-300 text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => router.push(`/auth?plan=${encodeURIComponent(plan.name)}`)}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-wide transition-all ${plan.buttonColor}`}
                            >
                                Select Plan
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
