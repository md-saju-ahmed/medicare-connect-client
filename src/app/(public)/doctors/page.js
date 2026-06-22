import DoctorsPage from "@/features/doctors/DoctorsPage";

export const metadata = {
  title: "Find Doctors | MediCare Connect",
  description:
    "Find experienced doctors across multiple specialties, view profiles, check availability, and book appointments with trusted healthcare professionals on MediCare Connect.",
  keywords: [
    "find doctors",
    "book doctor appointment",
    "online doctor consultation",
    "healthcare",
    "MediCare Connect",
  ],
};

export default function Page() {
  return <DoctorsPage />;
}
