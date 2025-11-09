// src/app/pages/components/RemoveButton.jsx
export default function RemoveButton({ onClick, disabled, label = "Remove" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-full bg-black/70 p-2 text-white transition-colors hover:bg-red-600 focus:outline-none 
                  ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {disabled ? (
        <svg
          className="h-5 w-5 animate-spin"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path d="M4 12a8 8 0 018-8v8H4z" fill="currentColor" />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
}
