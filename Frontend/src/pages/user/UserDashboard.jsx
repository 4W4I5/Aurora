import React, { useEffect } from "react";
import Sidebar from "../../components/Sidebar";

const Applications = () => {
  const verifyJWT = async () => {
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
  };

  useEffect(() => {
    verifyJWT();
  });
  return (
    <Sidebar role={"user"}>
      {/* Main Content */}
      <div className="col-span-12">
        {/* Header Row */}
        <div className="flex justify-between items-center mb-6"></div>
      </div>
      <div className="flex justify-center">
        <h1 className="text-3xl font-bold text-white">Welcome! User</h1>
      </div>
    </Sidebar>
  );
};

export default Applications;
