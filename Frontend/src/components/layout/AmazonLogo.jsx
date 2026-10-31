export default function AmazonLogo({ className = "" }) {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <div className="relative flex flex-col pt-1">
        <div className="flex items-baseline leading-none">
          <span className="text-white font-extrabold text-[32px] tracking-[-0.05em] leading-none font-sans">
            amazon
          </span>
          <span className="text-white font-normal text-[14px] tracking-[-0.02em] leading-none ml-[1px]">
            .in
          </span>
        </div>
        {/* Amazon Smile Curve Vector */}
        <svg
          className="w-[78px] h-[13px] -mt-[2px] ml-[2px]"
          viewBox="0 0 100 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 6 5 C 32 20 68 20 88 6"
            stroke="#FF9900"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <path
            d="M 83 4 L 92 6 L 89 15"
            fill="#FF9900"
            stroke="#FF9900"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
