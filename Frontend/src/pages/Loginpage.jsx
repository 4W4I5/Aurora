import { animated } from "@react-spring/web";
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

  const handleLogin = async (e) => {
    e.preventDefault();

    const URL = "http://127.0.0.1:8000/api/auth/password/verify"; // Adjust as per your connector server API.

    const user = {
      email: email,
      password: password,
    };

    // if (email) {
    //   const domain = email.split("@")[1];
    //   if (domain !== "admin.com" && domain !== "user.com") {
    //     alert(
    //       "Invalid email domain, please use either @admin.com or @user.com"
    //     );
    //     return;
    //   }
    // }

    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(user),
    });

    if (response.ok) {
      const data = await response.json();

      if (data["authenticated"] === true) {
        navigate(`/${data.role}/dashboard`);
      } else {
        alert("Authentication failed: " + data["error"]);
      }
    } else {
      const errorData = await response.json();
      alert("Failed to authenticate user\n" + errorData.error);
    }
  };

  const requestChallenge = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/challenge"); // Connector API for challenge
      const data = await res.json();
      setMessage(data.message);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      setStatus("Failed to get challenge.");
    }
  };

  const passwordlessLogin = async () => {
    if (!message) {
      setStatus("Fetch a challenge first!");
      return;
    }

    try {
      // Use connector server to handle signing
      const res = await fetch("http://127.0.0.1:8000/api/auth/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const signData = await res.json();
      if (!signData.signature) {
        setStatus("Failed to sign the message.");
        return;
      }

      const verifyRes = await fetch("http://127.0.0.1:8000/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature: signData.signature }),
      });

      const data = await verifyRes.json();
      setStatus(data.success ? "Login Successful!" : "Login Failed!");
      if (data.success) {
        navigate("/user/dashboard");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setStatus("Login failed.");
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
          Welcome Back!
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
              </form>
              <button
                onClick={() => handleNextStep()}
                className="btn w-full bg-supabase.secondary hover:bg-supabase.primary text-supabase-neutral rounded-2xl mt-4"
              >
                Login with Blockchain
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <button
                  onClick={requestChallenge}
                  className="btn bg-supabase.primary hover:bg-supabase.secondary w-full text-supabase-neutral"
                >
                  Request Challenge
                </button>
              </div>
              <div className="mb-4">
                <button
                  onClick={passwordlessLogin}
                  className="btn bg-supabase.primary hover:bg-supabase.secondary w-full text-supabase-neutral"
                >
                  Login with Blockchain
                </button>
              </div>
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
