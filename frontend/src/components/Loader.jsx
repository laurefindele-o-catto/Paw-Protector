import React from "react";
import capooWaiting from "../assets/capoo-waiting.gif";
export function Loader() {
  return (
    <div className="flex justify-center items-center my-4">
      <img
        src={capooWaiting}
        alt="Loading..."
        className="w-16 h-16"
      />
    </div>
  );
}
