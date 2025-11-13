"use client";

import { getUser } from "@/lib/auth";
import {
    InformationCircleIcon,
    UserCircleIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    facebook: false,
    twitter: false,
    instagram: false,
    google: false,
  });

  useEffect(() => {
    // Load user data
    const user = getUser();
    if (user) {
      setUsername(user.name || "");
      setEmail(user.email || "");
      setAboutMe("I am " + (user.name || "User") + " and I am dedicated UI/UX Designer from Sofia, Bulgaria.");
    }
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSocialLink = (platform: keyof typeof socialLinks) => {
    setSocialLinks((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password && password !== repeatPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Replace with your actual API endpoint
      // const response = await fetch('/api/profile/update', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username, email, password, aboutMe }),
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify({ 
          name: username, 
          email,
          aboutMe 
        }));
      }
      
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile. Please try again.");
      console.error('Profile update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
              PROFILE
            </h1>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Section */}
            <div className="lg:col-span-1 space-y-6">
              {/* Avatar Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Avatar picture
                </label>
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Avatar"
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                        <UserCircleIcon className="w-20 h-20 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium text-sm">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    Upload Picture
                  </label>
                </div>
              </div>

              {/* Social Media Integration */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Social Media
                </label>
                <div className="space-y-3">
                  {/* Facebook */}
                  <button
                    type="button"
                    onClick={() => handleSocialLink("facebook")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                      socialLinks.facebook
                        ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                        : "border-gray-300 hover:border-gray-400 text-gray-900 font-medium"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="text-sm font-medium">Add Facebook</span>
                  </button>

                  {/* Twitter */}
                  <button
                    type="button"
                    onClick={() => handleSocialLink("twitter")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                      socialLinks.twitter
                        ? "border-blue-400 bg-blue-50 text-blue-900 font-semibold"
                        : "border-gray-300 hover:border-gray-400 text-gray-900 font-medium"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span className="text-sm font-medium">Add Twitter</span>
                  </button>

                  {/* Instagram */}
                  <button
                    type="button"
                    onClick={() => handleSocialLink("instagram")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                      socialLinks.instagram
                        ? "border-pink-500 bg-pink-50 text-pink-900 font-semibold"
                        : "border-gray-300 hover:border-gray-400 text-gray-900 font-medium"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="text-sm font-medium">Add Instagram</span>
                  </button>

                  {/* Google+ */}
                  <button
                    type="button"
                    onClick={() => handleSocialLink("google")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                      socialLinks.google
                        ? "border-red-500 bg-red-50 text-red-900 font-semibold"
                        : "border-gray-300 hover:border-gray-400 text-gray-900 font-medium"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.635 10.909v2.619h4.335c-.173 1.125-1.31 3.295-4.331 3.295-2.604 0-4.731-2.16-4.731-4.823 0-2.662 2.122-4.822 4.728-4.822 2.483 0 3.866 1.807 4.488 2.687l3.024-2.909c-1.835-1.757-4.22-2.82-7.512-2.82C3.412 4.365 0 7.785 0 12s3.414 7.635 7.635 7.635c4.41 0 7.332-3.098 7.332-7.461 0-.501-.053-.885-.12-1.265H7.635zm16.365 0h-3.305V7.09h-3.315v3.818h-3.304v3.315h3.304v3.818h3.315v-3.818H24"/>
                    </svg>
                    <span className="text-sm font-medium">Add Google+</span>
                  </button>
                </div>
              </div>

              {/* About Me Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  About Me:
                </label>
                <textarea
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Username:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter username"
                  />
                  <InformationCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  E-mail:
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email"
                  />
                  <InformationCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Password:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password (leave blank to keep current)"
                  />
                  <InformationCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>
              </div>

              {/* Repeat Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Repeat Password:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Repeat new password"
                  />
                  <InformationCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>
              </div>

              {/* Update Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full py-3 px-6 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Updating..." : "Update Information"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

