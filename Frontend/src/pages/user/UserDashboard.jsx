import React from "react";
import Sidebar from "../../components/Sidebar";

const Applications = () => {
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
