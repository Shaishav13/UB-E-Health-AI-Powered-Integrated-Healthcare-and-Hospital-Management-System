const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Get patient health trends (vital signs over time)
router.get("/health-trends/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).send({ 
        message: "Invalid patient ID format" 
      });
    }
    
    const Report = mongoose.model('Report');
    
    // Get all reports for the patient, sorted by date
    const reports = await Report.find({ patientid: patientId })
      .sort({ date: 1 }) // Ascending order (oldest first)
      .select('date time temperature weight bp glucose disease')
      .lean();
    
    if (!reports || reports.length === 0) {
      return res.status(200).send({ 
        message: "No health data found", 
        data: {
          dates: [],
          temperature: [],
          weight: [],
          systolic: [],
          diastolic: [],
          glucose: [],
          labels: []
        }
      });
    }
    
    // Process data for charts
    const chartData = {
      dates: [],
      temperature: [],
      weight: [],
      systolic: [],
      diastolic: [],
      glucose: [],
      labels: [],
      rawData: []
    };
    
    reports.forEach(report => {
      // Format date
      const date = new Date(report.date);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      chartData.dates.push(report.date);
      chartData.labels.push(formattedDate);
      
      // Temperature (convert to number, remove 'F' if present)
      const temp = report.temperature ? parseFloat(report.temperature.toString().replace('F', '').trim()) : null;
      chartData.temperature.push(temp);
      
      // Weight (convert to number, remove 'kg' if present)
      const weight = report.weight ? parseFloat(report.weight.toString().replace('kg', '').trim()) : null;
      chartData.weight.push(weight);
      
      // Blood Pressure (split into systolic and diastolic)
      if (report.bp) {
        const bpParts = report.bp.toString().split('/');
        chartData.systolic.push(bpParts[0] ? parseFloat(bpParts[0].trim()) : null);
        chartData.diastolic.push(bpParts[1] ? parseFloat(bpParts[1].trim()) : null);
      } else {
        chartData.systolic.push(null);
        chartData.diastolic.push(null);
      }
      
      // Glucose (convert to number, remove 'mg/dL' if present)
      const glucose = report.glucose ? parseFloat(report.glucose.toString().replace('mg/dL', '').trim()) : null;
      chartData.glucose.push(glucose);
      
      // Store raw data for CSV export
      chartData.rawData.push({
        date: formattedDate,
        temperature: report.temperature || 'N/A',
        weight: report.weight || 'N/A',
        bloodPressure: report.bp || 'N/A',
        glucose: report.glucose || 'N/A',
        disease: report.disease || 'N/A'
      });
    });
    
    // Calculate statistics
    const stats = {
      temperature: calculateStats(chartData.temperature),
      weight: calculateStats(chartData.weight),
      systolic: calculateStats(chartData.systolic),
      diastolic: calculateStats(chartData.diastolic),
      glucose: calculateStats(chartData.glucose)
    };
    
    res.status(200).send({ 
      message: "Success", 
      data: chartData,
      stats: stats,
      totalRecords: reports.length
    });
  } catch (error) {
    console.error("Error fetching health trends:", error);
    res.status(500).send({ 
      message: "Error fetching health trends", 
      error: error.message 
    });
  }
});

// Helper function to calculate statistics
const calculateStats = (data) => {
  const validData = data.filter(val => val !== null && !isNaN(val));
  
  if (validData.length === 0) {
    return {
      min: null,
      max: null,
      avg: null,
      latest: null,
      trend: null
    };
  }
  
  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const avg = validData.reduce((a, b) => a + b, 0) / validData.length;
  const latest = validData[validData.length - 1];
  
  // Calculate trend (comparing latest to average)
  let trend = 'stable';
  if (latest > avg * 1.05) trend = 'increasing';
  if (latest < avg * 0.95) trend = 'decreasing';
  
  return {
    min: parseFloat(min.toFixed(2)),
    max: parseFloat(max.toFixed(2)),
    avg: parseFloat(avg.toFixed(2)),
    latest: parseFloat(latest.toFixed(2)),
    trend: trend
  };
};

// Get comparison between two time periods
router.get("/compare/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    const { startDate1, endDate1, startDate2, endDate2 } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).send({ 
        message: "Invalid patient ID format" 
      });
    }
    
    const Report = mongoose.model('Report');
    
    // Get reports for period 1
    const period1Reports = await Report.find({
      patientid: patientId,
      date: { $gte: new Date(startDate1), $lte: new Date(endDate1) }
    }).select('temperature weight bp glucose').lean();
    
    // Get reports for period 2
    const period2Reports = await Report.find({
      patientid: patientId,
      date: { $gte: new Date(startDate2), $lte: new Date(endDate2) }
    }).select('temperature weight bp glucose').lean();
    
    const comparison = {
      period1: calculatePeriodStats(period1Reports),
      period2: calculatePeriodStats(period2Reports)
    };
    
    res.status(200).send({ 
      message: "Success", 
      data: comparison
    });
  } catch (error) {
    console.error("Error comparing periods:", error);
    res.status(500).send({ 
      message: "Error comparing periods", 
      error: error.message 
    });
  }
});

// Helper function to calculate period statistics
const calculatePeriodStats = (reports) => {
  const temps = [];
  const weights = [];
  const systolics = [];
  const diastolics = [];
  const glucoses = [];
  
  reports.forEach(report => {
    if (report.temperature) temps.push(parseFloat(report.temperature.toString().replace('F', '').trim()));
    if (report.weight) weights.push(parseFloat(report.weight.toString().replace('kg', '').trim()));
    if (report.bp) {
      const bpParts = report.bp.toString().split('/');
      if (bpParts[0]) systolics.push(parseFloat(bpParts[0].trim()));
      if (bpParts[1]) diastolics.push(parseFloat(bpParts[1].trim()));
    }
    if (report.glucose) glucoses.push(parseFloat(report.glucose.toString().replace('mg/dL', '').trim()));
  });
  
  return {
    temperature: calculateAverage(temps),
    weight: calculateAverage(weights),
    systolic: calculateAverage(systolics),
    diastolic: calculateAverage(diastolics),
    glucose: calculateAverage(glucoses),
    recordCount: reports.length
  };
};

// Helper function to calculate average
const calculateAverage = (arr) => {
  if (arr.length === 0) return null;
  return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
};

module.exports = router;
