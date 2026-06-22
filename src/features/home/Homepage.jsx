"use client";
import Hero from "./components/Hero";
import FeaturedDoctors from "./components/FeaturedDoctors";
import Specialization from "./components/Specialization";
import PlatformStats from "./components/PlatformStats";
import WhyChooseUs from "./components/WhyChooseUs";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <FeaturedDoctors />
      <Specialization />
      <PlatformStats />
      <WhyChooseUs />
    </main>
  );
}
