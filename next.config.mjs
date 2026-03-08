/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
    images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drive.google.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: 'https',
        hostname: 'files.edgestore.dev',
        port: '',
        pathname: '/**',
=======
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
>>>>>>> 26a0218 (Fixed chatbot & hero slider)
      },
    ],
  },
};

<<<<<<< HEAD
export default nextConfig;
=======
export default nextConfig;
>>>>>>> 26a0218 (Fixed chatbot & hero slider)
