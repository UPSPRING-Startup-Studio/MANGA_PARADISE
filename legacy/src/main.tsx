import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import BetaGate from "./components/BetaGate";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BetaGate>
      <App />
    </BetaGate>
  </React.StrictMode>
);