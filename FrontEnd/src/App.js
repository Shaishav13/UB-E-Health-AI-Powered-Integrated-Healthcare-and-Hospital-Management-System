/*
 * UB E-Health - Frontend Application
 * Copyright (c) 2025 Shaishav
 * Licensed under MIT License - see LICENSE file for details
 */

import "./App.css";
import "./responsive.css";
import "./modern-theme.css";
import "./sidebar-layout.css";
import AllRoutes from "./Routes/AllRoutes";
import HealthChatbot from "./Components/HealthChatbot";

function App() {
  return (
    <>
      <AllRoutes />
      <HealthChatbot />
    </>
  );
}

export default App;
