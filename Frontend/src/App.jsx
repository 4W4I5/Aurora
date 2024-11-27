import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import LoginPage from "./pages/Loginpage";
import AddUser from "./pages/admin/AddUser";
import Dashboard from "./pages/admin/AdminDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import UserDashboard from "./pages/user/UserDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/login" element={<LoginPage role={"admin"} />} />
        <Route path="/admin/dashboard" element={<Dashboard role={"admin"} />} />
        <Route path="/admin/adduser" element={<AddUser role={"admin"} />} />

        <Route
          path="/admin/profile"
          element={<AdminProfile role={"admin"} />}
        />

        <Route path="/user/profile" element={<AdminProfile role={"user"} />} />
        {/* User Routes */}
        <Route path="/" element={<LoginPage role={"user"} />} />
        <Route
          path="/user/dashboard"
          element={<UserDashboard role={"user"} />}
        />
        {/* <Route path="/user/help" element={<UserHelp role={"user"} />} /> */}
        {/* <Route path="/user/profile" element={<UserProfile role={"user"} />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
