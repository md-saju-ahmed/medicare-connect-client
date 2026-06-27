"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import Container from "../../../components/shared/Container";
import SectionTitle from "../../../components/shared/SectionTitle";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const Testimonials = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const fetchReviews = async () => {
      try {
        if (!ignore) {
          setLoading(true);
          setError(null);
        }

        const response = await fetch(`${API_URL}/api/reviews?limit=3`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const reviewsData = data.reviews || data.data || data || [];

        if (!Array.isArray(reviewsData)) {
          if (!ignore) {
            setReviews([]);
            setLoading(false);
          }
          return;
        }

        const limitedReviews = reviewsData.slice(0, 3);

        const enrichedReviews = await Promise.all(
          limitedReviews.map(async (review) => {
            try {
              let patientId = "";
              if (review.patientId && typeof review.patientId === "object") {
                patientId = review.patientId.$oid || review.patientId._id || "";
              } else {
                patientId = review.patientId || "";
              }

              let patient = null;

              if (patientId) {
                try {
                  const patientRes = await fetch(
                    `${API_URL}/api/users/${patientId}`,
                  );
                  if (patientRes.ok) {
                    const patientData = await patientRes.json();
                    patient =
                      patientData.user || patientData.data || patientData;
                  }
                } catch (err) {
                  console.warn(`Error fetching patient ${patientId}:`, err);
                }
              }

              let createdDate = review.createdAt;
              if (review.createdAt && typeof review.createdAt === "object") {
                createdDate = review.createdAt.$date || review.createdAt;
              }

              const finalPatientName =
                patient?.name ||
                patient?.fullName ||
                (typeof review.patientId === "object" &&
                  (review.patientId?.name || review.patientId?.fullName)) ||
                "Patient";

              const finalPatientImage =
                patient?.image ||
                patient?.avatar ||
                (typeof review.patientId === "object" &&
                  (review.patientId?.image || review.patientId?.avatar)) ||
                null;

              return {
                _id:
                  review._id?.$oid || review._id || `review-${Math.random()}`,
                patientName: finalPatientName,
                patientImage: finalPatientImage,
                rating: review.rating || 5,
                comment:
                  review.reviewText ||
                  review.comment ||
                  review.text ||
                  review.review ||
                  "No comment provided",
                createdAt: createdDate || new Date().toISOString(),
              };
            } catch (err) {
              return {
                _id:
                  review._id?.$oid || review._id || `review-${Math.random()}`,
                rating: review.rating || 5,
                comment:
                  review.reviewText || review.comment || "No comment provided",
                createdAt:
                  review.createdAt?.$date ||
                  review.createdAt ||
                  new Date().toISOString(),
              };
            }
          }),
        );

        if (!ignore) {
          setReviews(enrichedReviews);
        }
      } catch (err) {
        if (!ignore) {
          setError("Failed to load reviews. Please try again later.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      ignore = true;
    };
  }, []);

  const renderStars = (rating) => {
    const safeRating = Math.max(0, Math.min(5, Math.round(rating || 0)));
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < safeRating
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Recently";
      return format(date, "MMMM d, yyyy");
    } catch {
      return "Recently";
    }
  };

  return (
    <section className="py-20 bg-muted/30">
      <Container>
        <SectionTitle
          title="What Our Patients Say"
          description="Real experiences from our valued patients"
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-8 space-y-4 shadow-xs"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">{error}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Reviews Yet
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review, index) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-xs hover:shadow-sm transition-all duration-300 relative"
              >
                <div className="absolute top-4 right-4 text-primary/10">
                  <Quote className="w-12 h-12" />
                </div>

                <div className="flex gap-1 mb-4">
                  {renderStars(review.rating)}
                </div>

                <p className="text-muted-foreground mb-6 line-clamp-4 min-h-20 italic">
                  &quot;{review.comment}&quot;
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 bg-primary/20">
                    {review.patientImage ? (
                      <Image
                        src={review.patientImage}
                        alt={review.patientName}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            review.patientName || "Patient",
                          )}&background=364f37&color=fff`;
                        }}
                      />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-white text-sm">
                        {(review.patientName || "P")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {review.patientName}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};

export default Testimonials;
