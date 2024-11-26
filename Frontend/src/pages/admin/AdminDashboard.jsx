import {
  CheckSquare,
  Edit,
  PlusCircle,
  Trash,
  Users,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";

const Dashboard = () => {
  const [totalUsers, setTotalUsers] = useState(null);
  const [activeUsers, setActiveUsers] = useState(null);
  const [users, setUsers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    phone: "",
    role: "",
    isPWLess: false,
    isOnline: true,
  });

  useEffect(() => {
    fetch("http://localhost:8000/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setTotalUsers(data.length);
      });

    fetch("http://localhost:8000/api/users/active")
      .then((res) => res.json())
      .then((data) => setActiveUsers(data.active_users));
  }, []);

  const deleteUser = (id) => {
    fetch(`http://localhost:8000/api/users/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        fetch("http://localhost:8000/api/users")
          .then((res) => res.json())
          .then((data) => {
            setUsers(data);
            setTotalUsers(data.length);
          });
      });
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    fetch(`http://localhost:8000/api/users/${editingUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingUser),
    })
      .then((res) => res.json())
      .then(() => {
        setUsers(
          users.map((user) =>
            user.id === editingUser.id ? { ...user, ...editingUser } : user
          )
        );
        setIsEditModalOpen(false);
        setEditingUser(null);
      });
    location.reload();
  };

  const handleAddUser = () => {
    fetch("http://localhost:8000/api/auth/password/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers([...users, { id: data.address, ...newUser }]);
          setIsAddModalOpen(false);
          setNewUser({
            username: "",
            email: "",
            phone: "",
            role: "",
            isPWLess: false,
            isOnline: true,
          });
        } else {
          alert("User registration failed: " + data.error);
        }
      });
    location.reload();
  };

  return (
    <Sidebar role={"admin"}>
      <div className="col-span-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <button
            className="bg-supabase-primary text-white flex items-center px-4 py-2 rounded-md shadow-md hover:bg-supabase-primary-focus"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle size={20} className="mr-2" />
            Add User
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="bg-supabase-base-100 lg:w-48 rounded-2xl shadow-md p-6 flex items-center justify-between">
            <div>
              <div className="flex gap-1 items-center">
                <Users className="text-supabase-primary" size={30} />
                <h2 className="text-4xl font-bold text-supabase-primary">
                  {totalUsers}
                </h2>
              </div>
              <p className="text-gray-500">Total Users</p>
            </div>
          </div>
          <div className="bg-supabase-base-100 lg:w-48 rounded-2xl shadow-md p-6 flex items-center justify-between">
            <div>
              <div className="flex gap-3 items-center">
                <CheckSquare className="text-supabase-primary" size={30} />
                <h2 className="text-4xl font-bold text-supabase-primary">
                  {activeUsers}
                </h2>
              </div>
              <p className="text-gray-500">Users Online</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">All Users</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-supabase-base-100 rounded-2xl shadow-md p-6"
              >
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{user.username}</h3>
                    <span
                      className={`w-3 h-3 rounded-full ${
                        user.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                      title={user.isOnline ? true : false}
                    ></span>
                  </div>
                  <p className="text-supabase-neutral">
                    Email: <span className="text-gray-500">{user.email}</span>
                  </p>
                  <p className="text-supabase-neutral">
                    Phone: <span className="text-gray-500">{user.phone}</span>
                  </p>
                  <p className="text-supabase-neutral">
                    Role:{" "}
                    <span className="text-gray-500">{user.role || "User"}</span>
                  </p>
                  <p className="text-supabase-neutral">
                    Passwordless Enabled:{" "}
                    <span className="text-gray-500">
                      {user.isPWLess ? "Yes" : "No"}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-blue-500"
                    onClick={() => handleEditClick(user)}
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    className="text-red-500"
                    onClick={() => deleteUser(user.id)}
                  >
                    <Trash size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-supabase-base-100 rounded-2xl shadow-md p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add User</h2>
              <button onClick={() => setIsAddModalOpen(false)}>
                <XCircle
                  size={24}
                  className="text-gray-500 hover:text-red-500"
                />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                className="input input-bordered w-full"
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className="input input-bordered w-full"
              />
              <input
                type="text"
                placeholder="Phone"
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser({ ...newUser, phone: e.target.value })
                }
                className="input input-bordered w-full"
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                className="input input-bordered w-full"
              />
              <div>
                <label className="label cursor-pointer">
                  <span className="label-text">Role Admin</span>
                  <input
                    type="checkbox"
                    checked={newUser.role === "admin"}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        role: e.target.checked ? "admin" : "user",
                      })
                    }
                    className="checkbox"
                  />
                </label>
              </div>
              <button
                className="btn btn-primary w-full"
                onClick={handleAddUser}
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-supabase-base-100 rounded-2xl shadow-md p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button onClick={() => setIsEditModalOpen(false)}>
                <XCircle
                  size={24}
                  className="text-gray-500 hover:text-red-500"
                />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={editingUser?.username || ""}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    username: e.target.value,
                  })
                }
                className="input input-bordered w-full text-supabase-neutral placeholder:text-gray-500"
                placeholder="Username"
              />
              <input
                type="email"
                value={editingUser?.email || ""}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    email: e.target.value,
                  })
                }
                className="input input-bordered w-full text-supabase-neutral placeholder:text-gray-500"
                placeholder="Email"
              />
              <input
                type="password"
                placeholder="Password"
                value={editingUser?.password}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, password: e.target.value })
                }
                className="input input-bordered w-full text-supabase-neutral placeholder:text-gray-500"
              />
              <input
                type="text"
                value={editingUser?.phone || ""}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    phone: e.target.value,
                  })
                }
                className="input input-bordered w-full text-supabase-neutral placeholder:text-gray-500"
                placeholder="Phone"
              />
              <div>
                <label className="label cursor-pointer">
                  <span className="label-text">Enable Passwordless</span>
                  <input
                    type="checkbox"
                    checked={editingUser?.isPWLess || false}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        isPWLess: e.target.checked,
                      })
                    }
                    className="checkbox"
                  />
                  {/* </label> */}
                  {/* </div>
              <div> */}
                  {/* <label className="label cursor-pointer"> */}
                  <span className="label-text">Grant Admin?</span>
                  <input
                    type="checkbox"
                    checked={editingUser?.role === "admin"}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        role: e.target.checked ? "admin" : "user",
                      })
                    }
                    className="checkbox"
                  />
                </label>
              </div>
              <button
                className="btn btn-primary w-full"
                onClick={handleEditSubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
};

export default Dashboard;
