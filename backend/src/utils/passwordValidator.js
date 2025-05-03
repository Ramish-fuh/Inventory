export const isValidPassword = (password) => {
    // Password must be at least 12 characters long
    if (password.length < 12) return false;

    // Must contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) return false;

    // Must contain at least one lowercase letter
    if (!/[a-z]/.test(password)) return false;

    // Must contain at least one number
    if (!/[0-9]/.test(password)) return false;

    // Must contain at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

    return true;
};