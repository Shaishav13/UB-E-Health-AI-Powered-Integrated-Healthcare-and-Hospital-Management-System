/**
 * Calculate age from date of birth
 * @param {Date|string} dob - Date of birth
 * @returns {number} - Age in years
 */
const calculateAge = (dob) => {
  if (!dob) return 0;
  
  const birthDate = new Date(dob);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // If birthday hasn't occurred this year yet, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

module.exports = { calculateAge };
