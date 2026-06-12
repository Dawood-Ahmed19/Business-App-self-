"use client";

function FormField({
  label,
  type = "text",
  placeholder,
  options = [],
  fontSize = "16px",
  value = "",
  onChange,
}: {
  label?: string;
  type?: string;
  placeholder?: string;
  options?: string[];
  fontSize?: string;
  value?: string | number;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-gray-400 text-sm block mb-1">{label}</label>
      {type === "select" ? (
        <select
          value={value}
          className="w-full bg-[#181B28] text-white py-[12px] px-[20px] rounded focus:outline-none cursor-pointer"
          onChange={(e) => onChange?.(e.target.value)}
          style={{
            fontSize,
            maxHeight: "180px",
            overflowY: "auto",
          }}
          size={1}
          required
        >
          <option value="">Select your option</option>
          {Array.isArray(options) && options.length > 0 ? (
            options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))
          ) : (
            <option disabled>No options available</option>
          )}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          className="w-full bg-fieldBg text-white px-[24px] py-[15px] rounded focus:outline-none"
          onChange={(e) => onChange?.(e.target.value)}
          style={{ fontSize }}
          required
        />
      )}
    </div>
  );
}

export default FormField;
