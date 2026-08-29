/**
 * Button Component
 * Path: src/components/common/Button.jsx
 *
 * Reusable button with different variants
 */

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  icon: Icon,
  fullWidth = false,
  ...props
}) {
  const baseStyles =
    'font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'bg-green-600 text-white hover:bg-green-700',
    outline: 'border-2 border-gray-300 text-gray-900 hover:bg-gray-50',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthClass} ${className}`}
      {...props}
    >
      {loading && (
        <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-current border-r-transparent"></div>
      )}
      {Icon && !loading && <Icon size={18} />}
      {children}
    </button>
  );
}
