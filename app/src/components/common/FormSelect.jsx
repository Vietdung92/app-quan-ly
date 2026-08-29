/**
 * Form Select Component
 * Path: src/components/common/FormSelect.jsx
 *
 * Reusable form select with validation
 */

export default function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  placeholder = 'Chọn một tùy chọn',
  required = false,
  disabled = false,
  helperText,
}) {
  return (
    <div>
      {label && (
        <label htmlFor={name} className="label-field">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`input-field w-full ${error ? 'border-red-500' : ''} ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-gray-500 text-xs mt-1">{helperText}</p>
      )}
    </div>
  );
}
