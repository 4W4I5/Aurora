import React, { useState, useEffect } from "react";
import { Check, Loader2, X, Edit, SquareUserRound } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import sampleQR from "../../assets/sample-QR.png";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [errors, setErrors] = useState({});
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

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://127.0.0.1:8000/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: localStorage.getItem("access_token") }),
        });
        const data = await response.json();
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
  }, []);

  // Function to save blockchain keys to localStorage
  const saveBlockchainKeysToLocalStorage = () => {
    localStorage.setItem("blockchain_address", profile.blockchain_address);
    localStorage.setItem("publickey", profile.publickey);
    localStorage.setItem("privatekey", profile.privatekey);
    alert("Blockchain keys saved to localStorage!");
  };

  return (
    <Sidebar role={"user"}>
      {/* QR Modal */}
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
                      setErrors({});
                    }}
                    disabled={isLoading}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    className="btn bg-supabase-primary/75 hover:bg-supabase-primary text-supabase-base-100 p-2 rounded-2xl px-4"
                    onClick={() => setEditingPersonal(false)}
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
                      value={profile.username}
                      onChange={(e) =>
                        setProfile({ ...profile, username: e.target.value })
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
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
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
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
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

          {/* Blockchain Keys Card */}
          <div className="bg-supabase-base-100 rounded-2xl shadow-md p-6">
            <div className="flex gap-2">
              <h2 className="text-xl font-bold text-white">Blockchain Keys</h2>
            </div>
            <div className="mt-6">
              <div className="grid grid-cols-3 gap-y-4 items-center">
                {/* Blockchain Address */}
                <p className="font-semibold">Blockchain Address:</p>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={profile.blockchain_address}
                    disabled
                    className="input input-bordered w-full"
                  />
                </div>

                {/* Public Key */}
                <p className="font-semibold">Public Key:</p>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={profile.publickey}
                    disabled
                    className="input input-bordered w-full"
                  />
                </div>

                {/* Private Key */}
                <p className="font-semibold">Private Key:</p>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={profile.privatekey}
                    disabled
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              {/* Button to Save to LocalStorage */}
              <button
                className="btn bg-supabase-primary/75 hover:bg-supabase-primary text-supabase-base-100 p-2 rounded-2xl mt-6"
                onClick={saveBlockchainKeysToLocalStorage}
              >
                Save Blockchain Keys to LocalStorage
              </button>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default UserProfile;
