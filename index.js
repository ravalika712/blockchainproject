import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Render the React application to the DOM
const root = ReactDOM.createRoot(document.getElementById('root'));

// Request MetaMask connection before rendering
window.ethereum
  .request({ method: "eth_requestAccounts" })
  .then(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error("MetaMask connection failed", error);
    alert("Please connect to MetaMask to use this application.");
  });

// Handle Ethereum events to ensure user stays connected
if (window.ethereum) {
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
      alert("Please connect to MetaMask to continue using this application.");
    } else {
      console.log("Account changed:", accounts[0]);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    }
  });

  window.ethereum.on('chainChanged', () => {
    console.log("Network changed. Reloading the app...");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
}
