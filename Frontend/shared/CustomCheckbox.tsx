import React from "react";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return; // Prevent onChange when disabled
    onChange(event.target.checked);
  };

  return (
    <label
      className={`flex items-center gap-2 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="hidden" // Hide the native checkbox
      />
      <span
        className={`w-[20px] h-[20px] bg-background  ${
          checked && !disabled ? "bg-blue" : "bg-theme-white"
        } ${
          checked && !disabled ? "border-transparent" : "border"
        } border rounded-[4px] flex items-center justify-center ${
          disabled ? "opacity-50" : ""
        }`}
        style={{ borderRadius: "4px" }} // Ensure precise radius if Tailwind lacks exact match
      >
        {checked && !disabled && (
          <svg
            width="25"
            height="24"
            viewBox="0 0 25 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <mask
              id="mask0_2641_6975"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="25"
              height="24"
            >
              <rect x="0.25" width="24" height="24" fill="currentColor" />
            </mask>
            <g mask="url(#mask0_2641_6975)">
              <path
                d="M9.80032 17.6534L4.46582 12.3189L5.53482 11.2496L9.80032 15.5151L18.9658 6.34961L20.0348 7.41886L9.80032 17.6534Z"
                fill="currentColor"
              />
            </g>
          </svg>
        )}
      </span>
      {label && (
        <span className={`text-sm text-dark ${disabled ? "opacity-50" : ""}`}>
          {label}
        </span>
      )}
    </label>
  );
};

export default CustomCheckbox;