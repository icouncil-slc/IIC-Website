"use client";
import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";
import LoginHistory from "@/components/LoginHistory";
import {
  Trash2,
  ChevronRight,
  Loader2,
  Mail,
  Shield,
  User,
  Users,
  LogOut,
  Edit,
  PlusCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const PermissionCard = ({ name, checked, onChange }) => (
  <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200">
    <input
      type="checkbox"
      id={name}
      name={name}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
    />
    <label
      htmlFor={name}
      className="ml-3 block text-sm font-medium text-gray-700 capitalize"
    >
      {name.replace("_", " ")}
    </label>
  </div>
);

const UserListItem = ({ user, onDelete, currentUserEmail }) => (
  <div className="flex justify-between items-center p-2 border-b last:border-b-0">
    <div className="flex flex-col">
      <span className="text-gray-800 font-medium">{user.email}</span>
      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full w-fit mt-1">
        {user.role}
      </span>
    </div>
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => toast.info("Edit user feature coming soon!")}
      >
        <Edit className="h-4 w-4" />
      </Button>
      {user.email !== currentUserEmail && (
        <Button
          variant="destructive"
          size="icon"
          onClick={() => onDelete(user.email)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  </div>
);

export default function AdminAndMemberPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("Member");
  const [memberPermissions, setMemberPermissions] = useState({
    event: false,
    collaboration: false,
    sponsor: false,
    webinars: false,
    past_events: false,
    gallery: false,
  });
  const [allUsers, setAllUsers] = useState([]);

  const requestOtp = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const { data } = await axios.post("/api/auth/request-otp", {
        email: normalizedEmail,
      });
      if (data?.success) {
        setSuccessMsg("OTP sent successfully!");
      } else {
        setError(data?.error || "Failed to send OTP.");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      setError("Please enter OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email,
        otp,
        redirect: false,
      });
      if (result.error) {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => signOut({ callbackUrl: "/" });

  const fetchAllUsers = async () => {
    try {
      const { data } = await axios.get("/api/admin");
      setAllUsers(data.users);
    } catch (err) {
      toast.error("Could not load user list.");
    }
  };

  useEffect(() => {
    const authorizedRoles = ["Admin", "Moderator"];
    if (
      status === "authenticated" &&
      authorizedRoles.includes(session?.user?.role)
    ) {
      fetchAllUsers();
    }
  }, [status, session]);

  const addMember = async () => {
    if (!memberEmail) return toast.error("Please enter a member email.");
    try {
      await axios.post("/api/admin", {
        email: memberEmail,
        permissions: memberPermissions,
        role: memberRole,
      });
      toast.success("Member updated successfully!");
      setMemberEmail("");
      setMemberPermissions({
        event: false,
        collaboration: false,
        sponsor: false,
        webinars: false,
        past_events: false,
        gallery: false,
      });
      setMemberRole("Member");
      fetchAllUsers();
    } catch {
      toast.error("Failed to add or update member.");
    }
  };

  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    setMemberPermissions((prev) => ({ ...prev, [name]: checked }));
  };

  const deleteMember = async (emailToDelete) => {
    if (window.confirm(`Are you sure you want to remove ${emailToDelete}?`)) {
      try {
        await axios.delete("/api/admin", {
          data: { memberEmail: emailToDelete },
        });
        toast.success("Member deleted successfully!");
        fetchAllUsers();
      } catch (err) {
        toast.error(err?.response?.data?.error || "Failed to delete member.");
      }
    }
  };

  const renderLoginForm = () => (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeIn}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="pl-10 w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <Button
        onClick={requestOtp}
        disabled={loading || !email}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send OTP"}
      </Button>
      {successMsg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-green-100 text-green-700 rounded-lg text-sm"
        >
          {successMsg}
        </motion.div>
      )}
      <div className="pt-4 border-t border-gray-200">
        <label
          htmlFor="otp"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          OTP Code
        </label>
        <input
          id="otp"
          type="text"
          placeholder="Enter OTP"
          className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
      </div>
      <Button
        onClick={verifyOtp}
        disabled={loading || !otp}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          "Verify & Login"
        )}
      </Button>
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-red-100 text-red-700 rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );

  const renderAdminPanel = () => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-full">
            <Shield className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
        </div>
        <Button
          onClick={handleLogout}
          variant="destructive"
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Link
            href="/add-event"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "justify-start gap-2"
            )}
          >
            <PlusCircle /> Add Event
          </Link>
          <Link
            href="/add-webinar"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "justify-start gap-2"
            )}
          >
            <PlusCircle /> Add Webinar
          </Link>
          <Link
            href="/add-gallery"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "justify-start gap-2"
            )}
          >
            <PlusCircle /> Add Gallery
          </Link>
          <Link
            href="/add-collaborate"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "justify-start gap-2"
            )}
          >
            <PlusCircle /> Add Collaboration
          </Link>
          <Link
            href="/add-sponsor"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "justify-start gap-2"
            )}
          >
            <PlusCircle /> Add Sponsor
          </Link>
          <Link
            href="/add-past-events"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "justify-start gap-2"
            )}
          >
            <PlusCircle /> Add Past Event
          </Link>
          <Link
            href="/manage-team"
            className={cn(
              buttonVariants({ variant: "default" }),
              "justify-start gap-2 bg-indigo-600 hover:bg-indigo-700 text-white col-span-2 sm:col-span-1"
            )}
          >
            {" "}
            <Users /> Manage Team
          </Link>
          <Link
            href="/manage-hero"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "justify-start gap-2"
            )}
          >
            <PlusCircle /> Hero Slider
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Add/Update Member
          </h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="memberEmail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Member Email
              </label>
              <input
                id="memberEmail"
                type="email"
                placeholder="member@example.com"
                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="memberRole"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Assign Role
              </label>
              <select
                id="memberRole"
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Member">Member</option>
                <option value="Moderator">Moderator</option>
                <option value="Editor">Editor</option>
                <option value="Analyst">Analyst</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(memberPermissions).map(([key, value]) => (
                  <PermissionCard
                    key={key}
                    name={key}
                    checked={value}
                    onChange={handlePermissionChange}
                  />
                ))}
              </div>
            </div>
            <Button
              onClick={addMember}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                "Save Member"
              )}
            </Button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Manage Users
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {allUsers.length > 0 ? (
              allUsers.map((user) => (
                <UserListItem
                  key={user._id}
                  user={user}
                  onDelete={deleteMember}
                  currentUserEmail={session.user.email}
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No users found.</p>
            )}
          </div>
        </div>
      </div>
      <LoginHistory />
    </motion.div>
  );

  const renderMemberPanel = () => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="space-y-6"
    >
      <div className="flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome back</h2>
            <p className="text-gray-600">{session.user.email}</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="destructive"
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {session.user.permissions?.event && (
          <Link
            href="/add-event"
            className={cn(buttonVariants(), "justify-between w-full")}
          >
            <span>Add Event</span>
            <ChevronRight />
          </Link>
        )}
        {session.user.permissions?.collaboration && (
          <Link
            href="/add-collaborate"
            className={cn(buttonVariants(), "justify-between w-full")}
          >
            <span>Add Collaboration</span>
            <ChevronRight />
          </Link>
        )}
        {session.user.permissions?.sponsor && (
          <Link
            href="/add-sponsor"
            className={cn(buttonVariants(), "justify-between w-full")}
          >
            <span>Add Sponsor</span>
            <ChevronRight />
          </Link>
        )}
        {session.user.permissions?.webinars && (
          <Link
            href="/add-webinar"
            className={cn(buttonVariants(), "justify-between w-full")}
          >
            <span>Add Webinar</span>
            <ChevronRight />
          </Link>
        )}
        {session.user.permissions?.gallery && (
          <Link
            href="/add-gallery"
            className={cn(buttonVariants(), "justify-between w-full")}
          >
            <span>Add Gallery</span>
            <ChevronRight />
          </Link>
        )}
        {session.user.permissions?.past_events && (
          <Link
            href="/add-past-events"
            className={cn(buttonVariants(), "justify-between w-full")}
          >
            <span>Add Past Event</span>
            <ChevronRight />
          </Link>
        )}
      </div>
      {Object.keys(session.user.permissions || {}).length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">You don't have any permissions yet</p>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">
              Admin & Member Portal
            </span>
          </h1>
          <p className="mt-3 text-gray-500">
            {status === "unauthenticated"
              ? "Sign in to access your dashboard"
              : status === "authenticated" && session?.user?.role === "Admin"
                ? "Manage members and permissions"
                : "Access your authorized features"}
          </p>
        </motion.div>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            {status === "loading" && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            )}
            {status === "unauthenticated" && renderLoginForm()}
            {status === "authenticated" &&
              (["Admin", "Moderator"].includes(session?.user?.role)
                ? renderAdminPanel()
                : renderMemberPanel())}
          </div>
        </div>
      </div>
    </div>
  );
}
