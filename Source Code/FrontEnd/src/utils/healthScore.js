/**
 * Calculate health score based on vital signs
 * Returns a score out of 100
 * If no data is available, returns 100 (perfect health assumed)
 */

export const calculateHealthScore = (stats) => {
  // If no stats data, return perfect score
  if (!stats) return 100;

  let score = 100;
  let deductions = 0;
  let metricsCount = 0;

  // Temperature scoring (Normal: 97-99°F)
  if (stats.temperature?.latest) {
    metricsCount++;
    const temp = parseFloat(stats.temperature.latest);
    if (temp < 95 || temp > 103) {
      deductions += 15; // Critical
    } else if (temp < 97 || temp > 100) {
      deductions += 8; // Concerning
    } else if (temp < 97.5 || temp > 99.5) {
      deductions += 3; // Slightly off
    }
  }

  // Weight scoring (Check for rapid changes)
  if (stats.weight?.latest && stats.weight?.avg) {
    metricsCount++;
    const weight = parseFloat(stats.weight.latest);
    const avgWeight = parseFloat(stats.weight.avg);
    const weightChange = Math.abs(weight - avgWeight);
    const changePercent = (weightChange / avgWeight) * 100;
    
    if (changePercent > 10) {
      deductions += 12; // Significant change
    } else if (changePercent > 5) {
      deductions += 6; // Moderate change
    } else if (changePercent > 2) {
      deductions += 2; // Minor change
    }
  }

  // Blood Pressure scoring (Normal: 120/80)
  if (stats.systolic?.latest && stats.diastolic?.latest) {
    metricsCount++;
    const sys = parseFloat(stats.systolic.latest);
    const dia = parseFloat(stats.diastolic.latest);
    
    // Hypertension or Hypotension
    if (sys >= 180 || sys < 90 || dia >= 120 || dia < 60) {
      deductions += 20; // Critical
    } else if (sys >= 140 || sys < 100 || dia >= 90 || dia < 65) {
      deductions += 10; // Stage 2 / Low
    } else if (sys >= 130 || sys < 110 || dia >= 85 || dia < 70) {
      deductions += 5; // Stage 1 / Slightly low
    }
  }

  // Glucose scoring (Normal: 70-100 mg/dL fasting)
  if (stats.glucose?.latest) {
    metricsCount++;
    const glucose = parseFloat(stats.glucose.latest);
    
    if (glucose >= 200 || glucose < 50) {
      deductions += 20; // Critical
    } else if (glucose >= 140 || glucose < 60) {
      deductions += 12; // High risk
    } else if (glucose >= 110 || glucose < 70) {
      deductions += 5; // Elevated / Low
    }
  }

  // If no metrics available, return perfect score
  if (metricsCount === 0) {
    return 100;
  }

  // Calculate final score
  score = Math.max(0, score - deductions);
  
  // Round to nearest integer
  return Math.round(score);
};

/**
 * Get health score color based on value
 */
export const getHealthScoreColor = (score) => {
  if (score >= 90) return '#10b981'; // Green - Excellent
  if (score >= 75) return '#34d399'; // Light Green - Good
  if (score >= 60) return '#f59e0b'; // Orange - Fair
  if (score >= 40) return '#f97316'; // Dark Orange - Poor
  return '#ef4444'; // Red - Critical
};

/**
 * Get health score status text
 */
export const getHealthScoreStatus = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical';
};

/**
 * Get health score gradient
 */
export const getHealthScoreGradient = (score) => {
  if (score >= 90) return 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
  if (score >= 75) return 'linear-gradient(135deg, #34d399 0%, #6ee7b7 100%)';
  if (score >= 60) return 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)';
  if (score >= 40) return 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)';
  return 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)';
};
