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
  // 1. Providers: Defines how users can log in.
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

          // This ensures the main admin always has the 'Admin' role in the database.
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
    maxAge: 3 * 60 * 60, // Session expires in 3 hours
  },

  // 3. Callbacks: Customize the session token and behavior.
  callbacks: {
    // This JWT callback keeps the token's permissions up-to-date on every request.
    async jwt({ token, user }) {
      // On initial sign-in, add the user's role and permissions to the token.
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
      }
      
      // On subsequent requests, re-fetch the user from the DB to get the latest data.
      const dbUser = await User.findOne({ email: token.email });
      if (dbUser) {
        token.role = dbUser.role;
        token.permissions = dbUser.permissions;
      }
      
      return token;
    },
    // This session callback makes the role and permissions available on the client side.
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.permissions = token.permissions;
      }
      return session;
    }
  },

  // 4. Events: Actions that happen on successful authentication events.
  events: {
    // This is the best place to record login history as it has access to the request object.
    async signIn(message) {
      try {
        const ip = message.req.headers["x-forwarded-for"] || message.req.socket.remoteAddress;
        const userAgent = message.req.headers["user-agent"];

        const loginRecord = new LoginHistory({
          email: message.user.email,
          ipAddress: ip,
          userAgent: userAgent,
        });
        await loginRecord.save();
        console.log("LOGIN RECORDED with IP for:", message.user.email);
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