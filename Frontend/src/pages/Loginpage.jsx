import { animated } from "@react-spring/web";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";

// List of allowed colors for the shapes
const colorPalette = [
  "#00d969", // Primary color
  "#009648", // Secondary color
  "#076034", // Accent color
  "#06753d", // Base-200 color
  "#004D29", // Base-300 color
  "#5F6368", // Slate-900 color
  "#4A4E51", // Slate-950 color
];

const LoginPage = ({ role }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [step, setStep] = useState(1); // 1: email/password, 2: passwordless login
  const [sliding, setSliding] = useState(false);
  const [message, setMessage] = useState("");
  const [shapes, setShapes] = useState([]);
  const [signedMessage, setSignedMessage] = useState(""); // To store the signed message
  const shapeCount = 100; // Define the number of shapes to generate
  const navigate = useNavigate();

  const handleNextStep = async (e) => {
    e.preventDefault();
    setSliding(true);

    setTimeout(() => {
      setStep(2);
      setSliding(false);
    }, 300);
  };

  // Request the challenge from the server
  const requestChallenge = async () => {
    setSignedMessage(""); // Clear the signed message when requesting a new challenge
    setStatus(""); // Clear the status message
    try {
      // Get the JWT token from localStorage
      const token = localStorage.getItem("access_token");
      const addr = sessionStorage.getItem("blockchain_address");

      if (!token) {
        setStatus("No authentication token found.");
        return;
      }

      if (!addr) {
        setStatus("No blockchain address found.");
        return;
      }

      // Construct the URL with query parameters
      const url = new URL("http://127.0.0.1:8000/api/auth/PKI/challenge");
      url.searchParams.append("address", addr); // Add blockchain address as a query parameter

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          contentType: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.message); // Set the received challenge message
      } else {
        setStatus("Failed to get challenge.");
      }
    } catch (error) {
      console.error("Error fetching challenge:", error);
      setStatus("Failed to get challenge.");
    }
  };

  // Sign the received challenge message using the private key
  const signChallenge = async () => {
    if (!message) {
      setStatus("Please fetch a challenge first!");
      return;
    }

    try {
      // Retrieve the private key from localStorage
      const privateKey = sessionStorage.getItem("privatekey");
      const blockchainAddress = sessionStorage.getItem("blockchain_address");

      if (!privateKey || !blockchainAddress) {
        setStatus("Private key or blockchain address not found!");
        return;
      }

      // Create a Wallet instance using the private key from sessionStorage
      const wallet = new ethers.Wallet(privateKey);

      // Sign the message as is, no need to hash it again
      const signature = await wallet.signMessage(message);

      if (!signature) {
        setStatus("Failed to sign the message.");
        return;
      }

      // Set the signed message to display it on the UI
      setSignedMessage(signature);

      // Prepare the data to be sent to the server
      const requestData = {
        address: blockchainAddress, // Ensure the address is correctly retrieved
        message: message, // Send the raw message, not hashed
        signature: signature,
      };
      console.log("Request data:", requestData);

      // Send the signed message to the backend for verification
      const verifyRes = await fetch("http://127.0.0.1:8000/api/auth/PKI/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await verifyRes.json();
      console.log("Verification response:", data);
      setStatus(data.authenticated ? "Login Successful!" : "Login Failed!");

      if (data.authenticated) {
        const role = localStorage.getItem("role");
        navigate(`/${role}/dashboard`); // Redirect to dashboard if authenticated
      }
    } catch (error) {
      console.error("Error signing the challenge:", error);
      setStatus("Failed to sign the challenge.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const URL = "http://127.0.0.1:8000/token";

    const user = {
      email: email,
      password: password,
    };

    if (email) {
      const domain = email.split("@")[1];
      if (domain !== "admin.com" && domain !== "user.com") {
        alert(
          "Invalid email domain, please use either @admin.com or @user.com"
        );
        return;
      }
    }

    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Response data:", data);

      if (data["access_token"]) {
        // Assuming the server sends the JWT token in the response,
        localStorage.setItem("access_token", data["access_token"]);
        localStorage.setItem("role", data["role"]);
        console.log("JWT Token:", localStorage.getItem("access_token")); // Log the JWT token
        navigate(`/${data["role"]}/dashboard`);
      } else {
        alert("Authentication failed: " + data["error"]);
      }
    } else {
      const errorData = await response.json();
      alert("Failed to authenticate user\n" + errorData.error);
      // Check if the response status is 401 (Unauthorized)
      if (response.status === 401) {
        localStorage.removeItem("access_token"); // Clear the token if expired
        navigate("/"); // Redirect to login page
      }
    }
  };

  // Generate shapes with random sizes, positions, and colors
  useEffect(() => {
    const generateShapes = () => {
      let shapesArray = [];
      for (let i = 0; i < shapeCount; i++) {
        const randomSize = Math.random() * 8 + 2; // Random size between 2px and 10px
        const randomX = Math.random() * window.innerWidth;
        const randomY = Math.random() * window.innerHeight;

        // Randomly select a color from the predefined color palette
        const randomColor =
          colorPalette[Math.floor(Math.random() * colorPalette.length)];

        shapesArray.push({
          id: i,
          x: randomX,
          y: randomY,
          size: randomSize,
          color: randomColor,
          // Reduce vx and vy for slower movement
          vx: Math.random() * 0.5 - 0.25, // Slower random horizontal speed
          vy: Math.random() * 0.5 - 0.25, // Slower random vertical speed
        });
      }
      setShapes(shapesArray);
    };

    generateShapes(); // Initialize shapes when component mounts
  }, [shapeCount]); // Regenerate shapes when shapeCount changes

  // Handle shape movement and collision detection
  useEffect(() => {
    const intervalId = setInterval(() => {
      setShapes((prevShapes) => {
        const updatedShapes = prevShapes.map((shape) => {
          // Update position
          const newX = shape.x + shape.vx;
          const newY = shape.y + shape.vy;

          // Bounce off the edges
          if (newX < 0 || newX > window.innerWidth) shape.vx = -shape.vx;
          if (newY < 0 || newY > window.innerHeight) shape.vy = -shape.vy;

          return { ...shape, x: newX, y: newY };
        });

        return updatedShapes;
      });
    }, 15); // Update positions every 15ms

    return () => clearInterval(intervalId); // Clean up on unmount
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-tl from-gray-950 to-slate-900 relative overflow-hidden">
      {/* Animated shapes with different colors */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        {shapes.map((shape) => (
          <animated.div
            key={shape.id}
            style={{
              position: "absolute",
              left: shape.x,
              top: shape.y,
              backgroundColor: shape.color,
              width: shape.size,
              height: shape.size,
              borderRadius: "50%",
            }}
          />
        ))}
      </div>

      <div className="bg-gradient-to-b opacity-95 from-base-100 to-gray-950 p-10 rounded-2xl shadow-xl w-96 overflow-hidden z-10 relative">
        <img src={logo} alt="logo" className="w-24 mx-auto mb-4 opacity-70" />
        <h2 className="text-center text-3xl font-bold mb-6 text-supabase-neutral">
          AURORA
        </h2>
        <h3 className="text-center text-xl mb-6 text-supabase-neutral">
          Welcome Back! <br />
          {sessionStorage.getItem("blockchain_address")
            ? "You can now use blockchain to login."
            : ""}
        </h3>

        <div
          className={`transition-transform duration-300 ${
            sliding ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          {step === 1 ? (
            <>
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <input
                    type="email"
                    className="input input-bordered w-full rounded-2xl bg-zinc-400 text-black placeholder:text-black "
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="password"
                    className="input input-bordered w-full rounded-2xl bg-zinc-400 text-black placeholder:text-black"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn w-full bg-supabase.primary hover:bg-supabase.secondary text-supabase-neutral rounded-2xl"
                >
                  Sign In
                </button>
                {/* Sign in button to autofill email to "a@admin.com" and password to "a" and call handleLogin */}
                <button
                  type="submit"
                  onClick={() => {
                    setEmail("a@admin.com");
                    setPassword("a");
                    handleLogin();
                  }}
                  className="btn w-half bg-supabase.primary hover:bg-supabase.secondary text-supabase-neutral rounded-2xl mt-4"
                >
                  Sign In as Admin
                </button>
                {/* Sign in button to autofill email to "a@admin.com" and password to "a" and call handleLogin */}
                <button
                  type="submit"
                  onClick={() => {
                    setEmail("a@user.com");
                    setPassword("a");
                    handleLogin();
                  }}
                  className="btn w-half bg-supabase.primary hover:bg-supabase.secondary text-supabase-neutral rounded-2xl mt-4"
                >
                  Sign In as User
                </button>
              </form>
              <button
                onClick={handleNextStep}
                className="btn w-full bg-supabase.secondary hover:bg-supabase.primary text-supabase-neutral rounded-2xl mt-4"
              >
                Login with Blockchain
              </button>
            </>
          ) : (
            <>
              {/* Blockchain login flow */}
              <div className="mb-4">
                <button
                  onClick={requestChallenge}
                  className="btn bg-supabase.primary hover:bg-supabase.secondary w-full text-supabase-neutral"
                >
                  Step 1: Request Challenge
                </button>
              </div>

              {/* Show the challenge message */}
              {message && (
                <div className="mt-4 text-supabase-neutral">
                  <p>Challenge Message:</p>
                  <p className="text-sm">{message}</p>
                </div>
              )}

              <div className="mb-4">
                <button
                  onClick={signChallenge}
                  className="btn bg-supabase.primary hover:bg-supabase.secondary w-full text-supabase-neutral"
                >
                  Step 2: Sign Challenge
                </button>
              </div>

              {/* Show the signed message */}
              {signedMessage && (
                <div className="mt-4 text-supabase-neutral">
                  <p>Signed Message:</p>
                  <p className="text-sm">{signedMessage}</p>
                </div>
              )}

              <p className="text-center text-sm text-supabase.grayDark">
                {status}
              </p>
            </>
          )}
        </div>

        <div className="mt-4 text-center">
          <a href="/forgot-password" className="text-supabase-accent">
            Forgot Password?
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
