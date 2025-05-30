/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    // swcPlugins: [["next-superjson-plugin", {}]],
  },
  images: {
    domains: [
      "res.cloudinary.com",
      "lh3.googleusercontent.com",
      "dl.dropboxusercontent.com",
      "avatar.iran.liara.run",
      "ui-avatars.com",
      "cdn0.iconfinder.com",
    ],
  },
};

module.exports = nextConfig;
