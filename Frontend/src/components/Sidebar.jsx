import {
  ChartArea,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  User,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.jpg";

const Sidebar = ({ role, children }) => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const adminLinks = [
    { name: "Users", path: "/admin/dashboard", icon: <ChartArea /> },
    { name: "Profile", path: "/admin/profile", icon: <User /> },
  ];

  const userLinks = [
    { name: "Home", path: "/user/dashboard", icon: <Home /> },
    { name: "Profile", path: "/user/profile", icon: <User /> },
  ];

  const links = role === "admin" ? adminLinks : userLinks;
  const logoutPath = role === "admin" ? "/" : "/";

  return (
    <>
      {/** Medium & Large screens */}
      <div className="flex h-screen max-sm:hidden">
        {/* Sidebar */}
        <div
          className={`bg-supabase-base-100 ${
            isExpanded ? "w-64" : "w-20"
          } h-screen flex flex-col justify-between py-4 shadow-lg transition-width duration-200`}
        >
          {/* Logo and Toggle Button */}
          <div
            className={`flex flex-col gap-4 ${
              !isExpanded && "items-center"
            } justify-between px-4`}
          >
            <div className="flex items-center">
              <img src={logo} alt="Company Logo" className="w-10 h-10" />
              {isExpanded && (
                <span className="ml-2 text-xl font-bold">Aurora</span>
              )}
            </div>
            <button
              className="btn btn-ghost btn-square"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronLeft /> : <ChevronRight />}
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-3 mt-8 ">
            {links.map((link) => (
              <Link to={link.path} key={link.name} title={link.name}>
                <div
                  className={`w-full flex items-center ml-4 ${
                    isExpanded ? "px-4" : "pl-5"
                  } py-3 rounded-lg ${
                    location.pathname === link.path
                      ? "bg-gradient-to-br from-supabase-primary to-supabase-secondary text-white"
                      : "hover:bg-supabase-base-200 text-supabase-primary ring-base-200 ring-1 shadow"
                  }`}
                >
                  {link.icon}
                  {isExpanded && <span className="ml-4">{link.name}</span>}
                </div>
              </Link>
            ))}
          </div>

          {/* Logout Button */}
          <div className="mb-4">
            <Link to={logoutPath} title="Logout">
              <div
                className={`w-full flex items-center ${
                  isExpanded ? "px-4" : "justify-center"
                } py-2 rounded-lg hover:bg-supabase-base-200 text-supabase-primary`}
              >
                <LogOut />
                {isExpanded && <span className="ml-4">Logout</span>}
              </div>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gradient-to-b from-supabase-Newbackground1 to-supabase-Newbackground2 p-6 lg:px-20 lg:pt-16 lg:pb-20 md:px-8 sm:px-1 overflow-y-auto">
          {children}
        </div>
      </div>

      {/***************************************************/}

      {/** Small screens */}
      <div className="drawer drawer-mobile h-screen sm:hidden">
        {/* Drawer Toggle */}
        <input id="my-drawer" type="checkbox" className="drawer-toggle" />
        {/* Page Content */}
        <div className="drawer-content flex flex-col">
          {/* Navbar for Small Screens */}
          <div className="navbar bg-supabase-base-100 lg:hidden">
            <div className="flex-none">
              <label htmlFor="my-drawer" className="btn btn-square btn-ghost">
                {/* Hamburger Icon */}
                <Menu />
              </label>
            </div>
            <div className="flex-1">
              <Link to="/" className="btn btn-ghost normal-case text-xl">
                <img src={logo} alt="Aurora Logo" className="w-6 h-6 mr-2" />
                Aurora
              </Link>
            </div>
          </div>
          {/* Main Content */}
          <div className="flex-1 bg-supabase-base-200 p-6 lg:px-20 md:px-8 sm:px-1 overflow-y-auto">
            {children}
          </div>
        </div>
        {/* Sidebar */}
        <div className="drawer-side">
          <label
            htmlFor="my-drawer"
            className="drawer-overlay lg:hidden"
          ></label>
          <div className="bg-supabase-base-100 w-20 h-screen flex flex-col items-center justify-between py-4 shadow-md">
            {/* Logo */}
            <div className="mb-8">
              <img src={logo} alt="Company Logo" className="w-10 h-10" />
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col gap-3">
              {links.map((link) => (
                <Link to={link.path} key={link.name} className="group">
                  <div
                    className={`w-12 h-12 flex items-center justify-center rounded-lg 
                  ${
                    location.pathname === link.path
                      ? "bg-gradient-to-br from-supabase-primary to-supabase-secondary text-white"
                      : "shadow-sm shadow-primary text-supabase-primary"
                  } group-hover:scale-105 transition-transform`}
                  >
                    {link.icon}
                  </div>
                </Link>
              ))}
            </div>

            {/* Logout Button */}
            <div className="mb-4">
              <Link to={logoutPath}>
                <div className="w-12 h-12 flex items-center justify-center rounded-lg shadow-md shadow-primary text-supabase-primary group-hover:scale-105 transition-transform">
                  <LogOut />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
