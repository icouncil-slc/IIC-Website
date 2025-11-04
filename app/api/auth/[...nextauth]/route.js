import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import Otp from "@/models/Otp";
import User from "@/models/User";
import LoginHistory from "@/models/LoginHistory";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const authOptions = {
  // 1. Providers
  providers: [
    CredentialsProvider({
      name: "Email and OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        await dbConnect();
        const { email, otp } = credentials;

        if (!email) throw new Error("Email not provided.");

        // Phase 1: Send OTP
        if (!otp) {
          const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
          const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
          await Otp.findOneAndUpdate(
            { email },
            { email, otp: generatedOtp, expiresAt: tenMinutesFromNow },
            { upsert: true, new: true }
          );

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your IIC Login OTP Code",
            text: `Your OTP code is: ${generatedOtp}. It will expire in 10 minutes.`,
          });
          
          throw new Error("OTP_SENT");
        }

        // Phase 2: Verify OTP and Authorize User
        if (otp) {
          const otpRecord = await Otp.findOne({ email });
          if (!otpRecord || otpRecord.otp !== otp || new Date() > otpRecord.expiresAt) {
            throw new Error("Invalid or expired OTP");
          }
          await Otp.deleteOne({ email });

          const user = await User.findOne({ email });
          if (!user) {
            throw new Error("You are not authorized. Please contact an admin.");
          }

          if (user.email === process.env.ADMIN_EMAIL && user.role !== 'Admin') {
            user.role = 'Admin';
            await user.save();
          }

          return { 
            id: user._id, 
            email: user.email, 
            role: user.role, 
            permissions: user.permissions 
          };
        }
        return null;
      },
    }),
  ],

  // 2. Session Configuration
  session: {
    strategy: "jwt",
    maxAge: 3 * 60 * 60, // 3 hours
  },

  // 3. Callbacks (FIXED - Ab inefficient database call nahi karega)
  callbacks: {
    async jwt({ token, user }) {
      // Yeh sirf initial sign-in par run hoga
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      // Token se data session mein daal dega
      session.user.role = token.role;
      session.user.permissions = token.permissions;
      return session;
    }
  },

  // 4. Events (FIXED - Ab IP address/header bug nahi aayega)
  events: {
    async signIn(message) {
      try {
        const loginRecord = new LoginHistory({
          email: message.user.email,
        });
        await loginRecord.save();
        console.log("LOGIN RECORDED for:", message.user.email);
      } catch (error) {
        console.error("Failed to record login history:", error);
      }
    }
  },

  // 5. General Settings
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/admin",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
