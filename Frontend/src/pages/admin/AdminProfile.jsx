import {
  Check,
  Edit,
  KeyRound,
  Loader2,
  SquareUserRound,
  X,
} from "lucide-react";
import React, { useState } from "react";
import sampleQR from "../../assets/sample-QR.png";
import Sidebar from "../../components/Sidebar";

const AdminProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingAuth, setEditingAuth] = useState(false);
  const [errors, setErrors] = useState({});

  const [profile, setProfile] = useState({
    firstName: "Test",
    lastName: "User",
    email: "Test.User@Aurora.com",
    phone: "+92-333-333-3333",
    passwordSet: true,
    twoFactorAuth: false,
  });

  const [editForm, setEditForm] = useState({ ...profile });
  const [authForm, setAuthForm] = useState({
    newPassword: "",
    confirmPassword: "",
    twoFactorAuth: profile.twoFactorAuth,
  });

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
    <Sidebar role={"admin"}>
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
                {/* First Name */}
                <p className="font-semibold">First name:</p>
                <div className="col-span-2">
                  {editingPersonal ? (
                    <>
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            firstName: e.target.value,
                          })
                        }
                        className="input input-bordered w-full"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm">
                          {errors.firstName}
                        </p>
                      )}
                    </>
                  ) : (
                    <p>{profile.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <p className="font-semibold">Last name:</p>
                <div className="col-span-2">
                  {editingPersonal ? (
                    <>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, lastName: e.target.value })
                        }
                        className="input input-bordered w-full"
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm">
                          {errors.lastName}
                        </p>
                      )}
                    </>
                  ) : (
                    <p>{profile.lastName}</p>
                  )}
                </div>

                {/* Email */}
                <p className="font-semibold">Email:</p>
                <div className="col-span-2">
                  {editingPersonal ? (
                    <>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="input input-bordered w-full"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm">{errors.email}</p>
                      )}
                    </>
                  ) : (
                    <p>{profile.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <p className="font-semibold">Phone No.:</p>
                <div className="col-span-2">
                  {editingPersonal ? (
                    <>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                        className="input input-bordered w-full"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm">{errors.phone}</p>
                      )}
                    </>
                  ) : (
                    <p>{profile.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Authentication Card */}
          <div className="bg-supabase-base-100 rounded-2xl shadow-md p-6 relative">
            <div className="absolute top-4 right-4">
              {editingAuth ? (
                <div className="space-x-2">
                  <button
                    className="btn bg-gray-500 hover:bg-gray-600 text-supabase-base-100 p-2 rounded-2xl px-4"
                    onClick={() => {
                      setEditingAuth(false);
                      setAuthForm({
                        newPassword: "",
                        confirmPassword: "",
                        twoFactorAuth: profile.twoFactorAuth,
                      });
                      setErrors({});
                    }}
                    disabled={isLoading}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    className="btn bg-supabase-primary/75 hover:bg-supabase-primary text-supabase-base-100 p-2 rounded-2xl px-4"
                    onClick={handleSaveAuth}
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
                  onClick={() => setEditingAuth(true)}
                >
                  <Edit size={16} />
                  Edit
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <KeyRound size={32} className="text-supabase-primary" />
              <h2 className="text-xl font-bold text-white">Authentication</h2>
            </div>
            <div className="mt-6">
              <div className="grid grid-cols-3 gap-y-4 items-center">
                {/* Password */}
                <p className="font-semibold">Password:</p>
                <div className="col-span-2">
                  {editingAuth ? (
                    <>
                      <input
                        type="password"
                        placeholder="New Password"
                        value={authForm.newPassword}
                        onChange={(e) =>
                          setAuthForm({
                            ...authForm,
                            newPassword: e.target.value,
                          })
                        }
                        className="input input-bordered w-full"
                      />
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        value={authForm.confirmPassword}
                        onChange={(e) =>
                          setAuthForm({
                            ...authForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="input input-bordered w-full mt-2"
                      />
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.password}
                        </p>
                      )}
                    </>
                  ) : (
                    <p>{profile.passwordSet ? "Set" : "Not Set"}</p>
                  )}
                </div>

                {/* 2-Factor Auth */}
                <p className="font-semibold">2-Factor Auth:</p>
                <div className="col-span-2">
                  {editingAuth ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={authForm.twoFactorAuth}
                        onChange={(e) => {
                          setAuthForm({
                            ...authForm,
                            twoFactorAuth: e.target.checked,
                          });
                          if (e.target.checked)
                            document.getElementById("qr-modal").showModal();
                        }}
                        className="checkbox checkbox-primary"
                      />
                      <span>Enable 2-Factor Authentication</span>
                    </div>
                  ) : (
                    <p>{profile.twoFactorAuth ? "Enabled" : "Disabled"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default AdminProfile;
