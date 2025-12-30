export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password) {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

export function validateProductForm(data) {
  const errors = {};

  if (!data.product_name || data.product_name.length < 2) {
    errors.product_name = 'Product name must be at least 2 characters';
  }

  if (!data.product_code || data.product_code.length < 1) {
    errors.product_code = 'Product code is required';
  }

  if (!data.product_category) {
    errors.product_category = 'Category is required';
  }

  if (!data.unit) {
    errors.unit = 'Unit is required';
  }

  if (!data.critical_stock_level || data.critical_stock_level < 0) {
    errors.critical_stock_level = 'Critical stock level must be a positive number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}