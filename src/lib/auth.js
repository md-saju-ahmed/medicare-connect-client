import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db(process.env.DB_NAME);

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "patient",
      },
      gender: {
        type: "string",
        required: false,
        defaultValue: "not specified",
      },
      address: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      bloodGroup: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      dateOfBirth: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      phone: {
        type: "string",
        required: false,
        defaultValue: null,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "active",
      },
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      strategy: "jwt",
      maxAge: 7 * 24 * 60 * 60,
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.role === "doctor") {
            await db.collection("doctors").insertOne({
              userId: user.id,
              email: user.email,
              doctorName: user.name,
              profileImage: user.image || null,
              specialization: null,
              qualifications: null,
              experience: null,
              consultationFee: null,
              hospitalName: null,
              licenseNumber: null,
              availableDays: [],
              availableSlots: [],
              verificationStatus: "pending",
              rating: 0,
              totalReviews: 0,
              createdAt: new Date(),
            });
          }
        },
      },
    },
  },

  plugins: [jwt()],
});
