/**
 * useForm Hook
 * Path: src/hooks/useForm.js
 *
 * Custom hook for form state management
 */

import { useState } from 'react';

/**
 * @param {object} initialValues - Initial form values
 * @param {function} onSubmit - Called with formData when validation passes
 * @param {object} validationRules - Optional: { fieldName: (value, formData) => errorMessage | '' }
 */
export default function useForm(initialValues, onSubmit, validationRules = {}) {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name, value, data) => {
    const rule = validationRules[name];
    if (!rule) return '';
    return rule(value, data) || '';
  };

  const validateAll = (data) => {
    const newErrors = {};
    Object.keys(validationRules).forEach((name) => {
      const error = validateField(name, data[name], data);
      if (error) newErrors[name] = error;
    });
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts editing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate on blur if a rule exists
    const error = validateField(name, formData[name], formData);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run all validation rules before submitting
    const validationErrors = validateAll(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      if (error.errors) {
        setErrors(error.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(initialValues);
    setErrors({});
    setTouched({});
  };

  const setValues = (values) => {
    setFormData((prev) => ({ ...prev, ...values }));
  };

  const setFieldValue = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setFieldError = (name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    setValues,
  };
}

/**
 * Common validation rules (Vietnamese messages)
 * Usage: { name: rules.required('Tên dự án') }
 */
export const rules = {
  required: (label) => (value) =>
    !value || String(value).trim() === '' ? `${label} là bắt buộc` : '',

  minNumber: (label, min) => (value) =>
    value !== '' && Number(value) < min ? `${label} phải lớn hơn hoặc bằng ${min}` : '',

  maxNumber: (label, max) => (value) =>
    value !== '' && Number(value) > max ? `${label} không được vượt quá ${max}` : '',

  positiveNumber: (label) => (value) =>
    value !== '' && Number(value) <= 0 ? `${label} phải là số dương` : '',

  email: () => (value) =>
    value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Email không hợp lệ' : '',

  phone: () => (value) =>
    value && !/^(0|\+84)[0-9]{9,10}$/.test(value.replace(/\s/g, ''))
      ? 'Số điện thoại không hợp lệ'
      : '',

  dateAfter: (label, otherField, otherLabel) => (value, formData) =>
    value && formData[otherField] && new Date(value) < new Date(formData[otherField])
      ? `${label} phải sau ${otherLabel}`
      : '',

  combine: (...validators) => (value, formData) => {
    for (const validator of validators) {
      const error = validator(value, formData);
      if (error) return error;
    }
    return '';
  },
};
