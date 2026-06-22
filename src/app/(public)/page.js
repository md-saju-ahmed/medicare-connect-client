import FeaturedDoctors from "@/components/home/FeaturedDoctors";
import Hero from "@/components/home/Hero";
import PlatformStats from "@/components/home/PlatformStats";
import Specialization from "@/components/home/Specialization";
import WhyChooseUs from "@/components/home/WhyChooseUs";

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedDoctors />
      <Specialization />
      <PlatformStats />
      <WhyChooseUs />
    </>
  );
}
