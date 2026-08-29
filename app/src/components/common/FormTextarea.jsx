/**
 * Form Textarea Component
 * Path: src/components/common/FormTextarea.jsx
 *
 * Reusable form textarea with validation
 */

export default function FormTextarea({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
  helperText,
  maxLength,
}) {
  return (
    <div>
      {label && (
        <label htmlFor={name} className="label-field">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {maxLength && (
            <span className="text-gray-500 text-xs ml-2">
              ({value?.length || 0}/{maxLength})
            </span>
          )}
        </label>
      )}

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`input-field w-full resize-none ${error ? 'border-red-500' : ''} ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      ></textarea>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-gray-500 text-xs mt-1">{helperText}</p>
      )}
    </div>
  );
}
