import Contact from "@/components/Contact";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Membership from "@/components/Membership";
import Navbar from "@/components/Navbar";
import Programs from "@/components/Programs";
import Trainers from "@/components/Trainers";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <Hero />
      <Features />
      <Programs />
      <Trainers />
      <Membership />
      <Contact />
      <Footer />
    </main>
  );
}
