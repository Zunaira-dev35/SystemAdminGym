import { backendBasePath } from "@/constants";
import { RootState } from "@/redux/store";
import React from "react";
import { useSelector } from "react-redux";
// import type { RootState } from "../../redux/store";
// import { backendBasePath } from "../../constants";

interface LoadingProps {
  message?: string;
  size?: "xs" | "sm" | "md" | "lg"; // Added 'xs' for button use
  fullScreen?: boolean;
  className?: string;
  inButton?: boolean; // New prop for in-button usage
}

const Loading: React.FC<LoadingProps> = ({
  message,
  size = "lg",
  fullScreen = false,
  className = "",
  inButton = false,
}) => {
  const sizeStyles = {
    xs: "w-4 h-4 border-2", // Small size for buttons
    sm: "w-8 h-8 border-4",
    md: "w-10 h-10 border-3",
    lg: "w-16 h-16 border-8",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 fade-in ${
        inButton ? "inline-flex" : !(sizeStyles[size] === "sm") && "h-[50vh]"
      } ${
        fullScreen && !inButton
          ? "fixed inset-0 bg-[#0000001A] backdrop-blur-sm z-50"
          : inButton
          ? ""
          : "p-6"
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      {" "}
     
        <>
          <div
            className={`border-t-font-blue2 border-font-blue2/30 rounded-full animate-spin ${
              sizeStyles[size] || "border-8"
            } ${inButton ? "mr-2" : ""}`}
            aria-label="Loading spinner"
          ></div>
          {message && !inButton && (
            <p className="text-dark text-sm font-manrope">{message}</p>
          )}{" "}
        </>
    
    </div>
  );
};

export default Loading;
