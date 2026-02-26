const fs = require('fs');
const path = require('path');

// List of dashboard pages to add footer (excluding login/signup pages)
const dashboardPages = [
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Doctor_Dashboard.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Doctor/AllReport.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Check_Appointment.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Create_Report.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Patient_Details.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Patient_Details_Hybrid.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Doctor/Patient_Documents.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Patient/Book_Appointment.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Patient/Book_Lab_Test.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Patient/My_Appointments.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Patient/My_Documents.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Patient/My_Medications.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Patient/Health_Trends.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Patient/Notification_Settings.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Patient/Payment_History.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Admin/Admin_Profile.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Admin/Add_Doctor.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Admin/Add_Ambulance.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Admin/Add_Lab_Personnel.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Admin/Manage_Doctors.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Admin/Manage_Patients.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Admin/View_Lab_Personnel.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Laboratory/Lab_Dashboard.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Laboratory/Lab_Test_Requests.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Laboratory/Enter_Test_Results.jsx',
  'FrontEnd/src/Pages/Dashboard/Main-Dashboard/AllPages/Laboratory/Home_Service_Requests.jsx',
];

const basePath = 'E-Health-Management-Hub-main';

dashboardPages.forEach(filePath => {
  const fullPath = path.join(basePath, filePath);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if Footer is already imported
    if (content.includes('import Footer from')) {
      console.log(`✓ Footer already added to ${filePath}`);
      return;
    }
    
    // Add Footer import after other imports
    const importRegex = /(import.*from.*['"]\);?\n)(?!import)/;
    if (!content.includes('import Footer from')) {
      content = content.replace(importRegex, `$1import Footer from "../../../../../Components/Footer";\n`);
    }
    
    // Add Footer component before the last closing tags
    // Look for pattern: </div>\n    </>\n  );\n};
    const footerPlacement = content.replace(
      /([\s]*)<\/div>\s*<\/>\s*\);\s*};/,
      '$1</div>\n      <Footer />\n    </>\n  );\n};'
    );
    
    if (footerPlacement !== content) {
      fs.writeFileSync(fullPath, footerPlacement, 'utf8');
      console.log(`✓ Added Footer to ${filePath}`);
    } else {
      console.log(`⚠ Could not find insertion point in ${filePath}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
});

console.log('\nFooter addition complete!');
