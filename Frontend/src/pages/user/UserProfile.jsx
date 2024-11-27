import { Check, Edit, Loader2, SquareUserRound, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import sampleQR from "../../assets/sample-QR.png";
import Sidebar from "../../components/Sidebar";

const UserProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingAuth, setEditingAuth] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Initializing profile state as empty, it will be populated by fetched data
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    phone: "",
    publickey: "",
    privatekey: "",
    blockchain_address: "",
    role: "",
    did: "",
    isPWLess: false,
    isOnline: false,
  });

  const [editForm, setEditForm] = useState({ ...profile });
  const [authForm, setAuthForm] = useState({
    newPassword: "",
    confirmPassword: "",
    twoFactorAuth: profile.twoFactorAuth,
  });

  // Fetch user data from FastAPI's /api/users/me route
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);

      // JWT token verification
      const token = localStorage.getItem("access_token");
      console.log(token);

      try {
        const response = await fetch("http://127.0.0.1:8000/verify-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) {
          throw new Error("Failed to verify token");
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        localStorage.removeItem("token");
        // Redirect to login page or show a message to the user
        navigate("/");
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();
        console.log(data);
        setProfile({
          username: data.username,
          email: data.email,
          phone: data.phone,
          publickey: data.public_key,
          privatekey: data.private_key,
          blockchain_address: data.blockchain_address,
          role: data.role,
          did: data.did,
          isPWLess: data.isPWLess,
          isOnline: data.isOnline,
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  // Validation functions
  const validatePersonal = () => {
    const errors = {};
    if (!editForm.firstName) errors.firstName = "First name is required";
    if (!editForm.lastName) errors.lastName = "Last name is required";
    if (!editForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email))
      errors.email = "Valid email is required";
    if (!editForm.phone || !/^\+?[\d\s-]+$/.test(editForm.phone))
      errors.phone = "Valid phone number is required";
    return errors;
  };

  const validateAuth = () => {
    const errors = {};
    if (authForm.newPassword !== authForm.confirmPassword)
      errors.password = "Passwords do not match";
    if (authForm.newPassword && authForm.newPassword.length < 8)
      errors.password = "Password must be at least 8 characters";
    return errors;
  };

  // Save handlers with dummy API calls
  const handleSavePersonal = async () => {
    const validationErrors = validatePersonal();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProfile(editForm);
      setEditingPersonal(false);
      setErrors({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAuth = async () => {
    const validationErrors = validateAuth();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProfile((prev) => ({
        ...prev,
        passwordSet: authForm.newPassword ? true : prev.passwordSet,
        twoFactorAuth: authForm.twoFactorAuth,
      }));
      setEditingAuth(false);
      setAuthForm({
        newPassword: "",
        confirmPassword: "",
        twoFactorAuth: authForm.twoFactorAuth,
      });
      setErrors({});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sidebar role={"user"}>
      <dialog id="qr-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Connect with your mobile app</h3>
          <p className="py-4">
            Scan this code with the Aurora mobile app on your phone to enable
            2-Factor Authentication.
          </p>
          <img src={sampleQR} alt="QR Code" className="w-48 h-48 mx-auto" />
          <div className="modal-action">
            <button
              className="btn"
              onClick={() => document.getElementById("qr-modal").close()}
            >
              Done
            </button>
          </div>
        </div>
      </dialog>

      <div className="col-span-12">
        {/* Header Row */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
        </div>

        {/* Cards Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Personal Information Card */}
          <div className="bg-supabase-base-100 rounded-2xl shadow-md p-6 relative">
            <div className="absolute top-4 right-4">
              {editingPersonal ? (
                <div className="space-x-2">
                  <button
                    className="btn bg-gray-500 hover:bg-gray-600 text-supabase-base-100 p-2 rounded-2xl px-4"
                    onClick={() => {
                      setEditingPersonal(false);
                      setEditForm({ ...profile });
                      setErrors({});
                    }}
                    disabled={isLoading}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    className="btn bg-supabase-primary/75 hover:bg-supabase-primary text-supabase-base-100 p-2 rounded-2xl px-4"
                    onClick={handleSavePersonal}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Check size={16} />
                    )}
                    Save
                  </button>
                </div>
              ) : (
                <button
                  className="btn bg-supabase-primary/75 hover:bg-supabase-primary text-supabase-base-100 p-2 rounded-2xl px-4"
                  onClick={() => setEditingPersonal(true)}
                >
                  <Edit size={16} />
                  Edit
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <SquareUserRound size={32} className="text-supabase-primary" />
              <h2 className="text-xl font-bold text-white">
                Personal Information
              </h2>
            </div>
            <div className="mt-6">
              <div className="grid grid-cols-3 gap-y-4 items-center">
                {/* Name */}
                <p className="font-semibold">Username:</p>
                <div className="col-span-2">
                  {editingPersonal ? (
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          username: e.target.value,
                        })
                      }
                      className="input input-bordered w-full"
                    />
                  ) : (
                    <p className="break-words">
                      {profile.username || "Not provided"}
                    </p>
                  )}
                </div>

                {/* Email */}
                <p className="font-semibold">Email:</p>
                <div className="col-span-2">
                  {editingPersonal ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="input input-bordered w-full"
                    />
                  ) : (
                    <p className="break-words">{profile.email}</p>
                  )}
                </div>

                {/* Phone */}
                <p className="font-semibold">Phone:</p>
                <div className="col-span-2">
                  {editingPersonal ? (
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      className="input input-bordered w-full"
                    />
                  ) : (
                    <p className="break-words">{profile.phone}</p>
                  )}
                </div>

                {/* Blockchain Address */}
                <p className="font-semibold">Blockchain Address:</p>
                <div className="col-span-2 text-wrap">
                  <p className="break-words">{profile.blockchain_address}</p>
                </div>

                {/* Public Key */}
                <p className="font-semibold">Public Key:</p>
                <div className="col-span-2">
                  <p className="break-words">{profile.publickey}</p>
                </div>

                {/* Private Key */}
                <p className="font-semibold">Private Key:</p>
                <div className="col-span-2">
                  <p className="break-words">{profile.privatekey}</p>
                </div>

                {/* Role */}
                <p className="font-semibold">Role:</p>
                <div className="col-span-2">
                  <p className="break-words">{profile.role}</p>
                </div>

                {/* DID */}
                <p className="font-semibold">DID:</p>
                <div className="col-span-2">
                  <p className="break-words">{profile.did}</p>
                </div>

                {/* Is Passwordless */}
                <p className="font-semibold">Passwordless:</p>
                <div className="col-span-2">
                  <p className="break-words">
                    {profile.isPWLess ? "Yes" : "No"}
                  </p>
                </div>

                {/* Is Online */}
                <p className="font-semibold">Online Status:</p>
                <div className="col-span-2">
                  <p className="break-words">
                    {profile.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default UserProfile;
