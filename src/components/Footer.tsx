import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-black border-t border-white/10 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <span className="text-2xl font-bold text-white mb-6 block">IRON PULSE</span>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Forging elite athletes and transforming lives through premium fitness experiences.
                        </p>
                        <div className="flex space-x-4">
                            {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                                <a key={i} href="#" className="text-gray-400 hover:text-[#cff532] transition-colors">
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Programs</h4>
                        <ul className="space-y-3">
                            {['Strength', 'Cardio', 'HIIT', 'Yoga', 'CrossFit'].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="text-gray-400 hover:text-[#cff532] text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Company</h4>
                        <ul className="space-y-3">
                            {['About Us', 'Careers', 'Blog', 'Press', 'Contact'].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="text-gray-400 hover:text-[#cff532] text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-wider">Newsletter</h4>
                        <p className="text-gray-400 text-sm mb-4">Subscribe for training tips and exclusive offers.</p>
                        <div className="flex">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-l-md focus:outline-none focus:border-[#cff532] w-full text-sm"
                            />
                            <button className="bg-[#cff532] text-black px-4 py-2 rounded-r-md font-bold hover:bg-[#bce628] transition-colors">
                                GO
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-xs text-center md:text-left">
                        &copy; {new Date().getFullYear()} Iron Pulse Fitness. All rights reserved.
                    </p>
                    <div className="flex space-x-6 text-gray-500 text-xs">
                        <a href="#" className="hover:text-white">Privacy Policy</a>
                        <a href="#" className="hover:text-white">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
