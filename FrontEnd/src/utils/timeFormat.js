// Utility functions for time formatting

/**
 * Convert 24-hour time format to 12-hour AM/PM format
 * @param {string} time24 - Time in 24-hour format (e.g., "14:30", "09:00")
 * @returns {string} Time in 12-hour AM/PM format (e.g., "2:30 PM", "9:00 AM")
 */
export const convertTo12Hour = (time24) => {
  if (!time24) return "N/A";
  
  try {
    // Handle both "HH:MM" and "HH:MM:SS" formats
    const [hours24, minutes] = time24.split(':');
    let hours = parseInt(hours24, 10);
    const mins = minutes || "00";
    
    if (isNaN(hours)) return time24; // Return original if invalid
    
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert hours
    if (hours === 0) {
      hours = 12; // Midnight
    } else if (hours > 12) {
      hours = hours - 12;
    }
    
    return `${hours}:${mins} ${period}`;
  } catch (error) {
    console.error('Error converting time:', error);
    return time24; // Return original on error
  }
};

/**
 * Convert 12-hour AM/PM format to 24-hour format
 * @param {string} time12 - Time in 12-hour format (e.g., "2:30 PM", "9:00 AM")
 * @returns {string} Time in 24-hour format (e.g., "14:30", "09:00")
 */
export const convertTo24Hour = (time12) => {
  if (!time12) return "";
  
  try {
    const [time, period] = time12.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  } catch (error) {
    console.error('Error converting time:', error);
    return time12;
  }
};

/**
 * Generate time slots in AM/PM format
 * @param {string} startTime - Start time in 24-hour format (e.g., "09:00")
 * @param {string} endTime - End time in 24-hour format (e.g., "17:00")
 * @param {number} interval - Interval in minutes (default: 30)
 * @returns {Array} Array of time slots in AM/PM format
 */
export const generateTimeSlots = (startTime = "09:00", endTime = "17:00", interval = 30) => {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMin = startMin;
  
  while (currentHour < endHour || (currentHour === endHour && currentMin <= endMin)) {
    const time24 = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    slots.push({
      value: time24, // Store in 24-hour format
      label: convertTo12Hour(time24) // Display in 12-hour format
    });
    
    currentMin += interval;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }
  
  return slots;
};
