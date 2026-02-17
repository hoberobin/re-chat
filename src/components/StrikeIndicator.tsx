import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

interface StrikeIndicatorProps {
  strikes: number;
}

export function StrikeIndicator({ strikes }: StrikeIndicatorProps) {
  return (
    <div className="flex gap-2 items-center" aria-label={`${strikes} of 3 strikes`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
            i < strikes
              ? "border-red-500 bg-red-500 text-white scale-110"
              : "border-gray-300 bg-transparent text-gray-400"
          }`}
        >
          {i < strikes ? (
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          ) : null}
        </span>
      ))}
    </div>
  );
}
