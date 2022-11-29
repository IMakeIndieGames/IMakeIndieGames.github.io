import GSheetProcessor from './gsheetsprocessor.js';
import "./styles.css";

GSheetReader(
  {
    sheetId: "1_IpENDkoujmWr-B0M2ZVcyvgPQGeKwYxfHX_JYTDtRc",
    sheetNumber: 1,
    returnAllResults: false,
    // Note: this API Key is locked to this demo, it can't be
    // used in your own projects.
    apiKey: "AIzaSyD4ZoTrXMfF7mhAMVNNiensNsWL5XC6Sqo",
    filter: {
      department: "archaeology"
    }
  },
  (results) => {
    results.forEach((result) => {
      document.getElementById(
        "app"
      ).innerHTML += `<p>${result["Module Description"]}</p>`;
    });
  },
  (error) => {
    document.getElementById("app").innerHTML += `<p>error: ${error}</p>`;
  }
);
