import DoctorDetailsPage from "@/features/doctors/DoctorDetailsPage";

async function getDoctorById(id) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/doctors/${id}`,
      {
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const doctor = await getDoctorById(id);

  if (!doctor) {
    return {
      title: "Doctor Not Found | MediCare Connect",
    };
  }

  return {
    title: `${doctor.doctorName} - ${doctor.specialization} | MediCare Connect`,
    description: `Book an appointment with ${doctor.doctorName}, ${doctor.specialization} at ${doctor.hospitalName}.`,
    openGraph: {
      title: `${doctor.doctorName} | MediCare Connect`,
      images: [
        {
          url: doctor.profileImage,
          alt: doctor.doctorName,
        },
      ],
    },
  };
}

export default function Page() {
  return <DoctorDetailsPage />;
}
