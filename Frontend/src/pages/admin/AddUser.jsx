import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const AddUser = () => {
  // AWAIS:: Need to create func for this
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleCreateUser = async (e) => {
    // Replace this section with backend functionality to create a new user

    if (password !== confirmPassword) {
      console.error("Passwords do not match");
      return;
    }
    const fullName = `${firstName} ${lastName}`;
    const newUser = {
      fullName,
      email,
      phoneNumber,
      password,
    };

    console.log("User data to be sent to backend:", newUser);

    // Send to localhost:8000/api/auth/password/register
    const response = await fetch(
      "http:///localhost:8000/api/auth/password/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      }
    );

    // Check if response is OK
    if (response.ok) {
      // Log response data
      const data = await response.json();
      console.log(data);

      // Check if user is registered successfully and navigate to dashboard
      if (data["success"] === true) {
        console.log("Success! Navigating to: ", `/admin/dashboard`);
        navigate(`/admin/dashboard`);

        // If user registration fails, show error message
        if (data["success"] === false && data["error"]) {
          alert("Server Error: " + data["error"]);
          console.log("Response: ", data["error"]);
        }
      } else {
        alert("Server Error: " + data["error"]);
        console.log("Response: ", data["error"]);
      }
    } else {
      const errorData = await response.json();
      alert("Failed to authenticate user\n" + errorData.error);
      console.log(
        "Unable to authenticate user\n" +
          response.statusText +
          "\nServer Error: " +
          errorData.error
      );
    }
  };

  return (
    <Sidebar role={"admin"}>
      {/* Main Content */}
      <div className="col-span-12">
        {/* Header Row */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Add User</h1>
          <div className="relative"></div>
        </div>

        {/* Form Section */}
        <div className="bg-slate-950 rounded-2xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              className="input input-bordered w-full rounded-2xl bg-supabase-neutral text-gray-950 p-4"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Last Name"
              className="input input-bordered w-full rounded-2xl bg-supabase-neutral text-gray-950 p-4"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              className="input input-bordered w-full rounded-2xl bg-supabase-neutral text-gray-950 p-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="Phone Number"
              className="input input-bordered w-full rounded-2xl bg-supabase-neutral text-gray-950 p-4"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="input input-bordered w-full rounded-2xl bg-supabase-neutral text-gray-950 p-4"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="input input-bordered w-full rounded-2xl bg-supabase-neutral text-gray-950 p-4"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        {/* Button Section */}
        <div className="flex justify-end space-x-4">
          <button
            className="btn bg-slate-950 text-supabase-neutral hover:bg-slate-800 p-3 rounded-lg"
            onClick={() => navigate("/admin/users")}
          >
            Cancel
          </button>
          <button
            className="btn bg-supabase-secondary hover:bg-supabase-primary p-3 rounded-lg text-supabase-neutral"
            onClick={handleCreateUser}
          >
            Create User
          </button>
        </div>
      </div>
    </Sidebar>
  );
};

export default AddUser;
