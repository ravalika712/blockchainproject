import React, { useState, useEffect } from "react";
import { BrowserProvider, Contract, isAddress, Interface } from "ethers";
import axios from "axios";
import AppointmentAbi from "./abi/Appointment.json";

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update this if needed

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [appointmentTimestamp, setAppointmentTimestamp] = useState("");
  const [appointmentMetadata, setAppointmentMetadata] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [newTimestamp, setNewTimestamp] = useState("");

  // Initialize blockchain connection
  useEffect(() => {
    const initializeBlockchain = async () => {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          setAccount(await signer.getAddress());

          const appointmentContract = new Contract(contractAddress, AppointmentAbi.abi, signer);
          setContract(appointmentContract);
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        }
      } else {
        alert("Please install MetaMask to use this dApp");
      }
    };
    initializeBlockchain();
  }, []);

  // Upload metadata to IPFS
  const uploadMetadataToIPFS = async (metadata) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    try {
      const response = await axios.post(url, metadata, {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: "e22ca1a733c3e40193bb",
          pinata_secret_api_key: "d29a471ebbc124f66b681345d3bb1f511475a30023ff2e1aad1f22f52721833c",
        },
      });
      return response.data.IpfsHash;
    } catch (error) {
      console.error("Error uploading metadata to IPFS via Pinata:", error);
      throw error;
    }
  };

  // Book an appointment
  const bookAppointment = async () => {
    try {
      if (!appointmentTimestamp) {
        alert("Please select a valid appointment time.");
        return;
      }

      const timestamp = Math.floor(new Date(appointmentTimestamp).getTime() / 1000);
      const currentUnixTimestamp = Math.floor(Date.now() / 1000);

      if (timestamp <= currentUnixTimestamp) {
        alert("Please select an appointment time that is in the future.");
        return;
      }

      const doctorAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
      if (!isAddress(doctorAddress)) {
        alert("Invalid doctor address");
        return;
      }

      const metadata = {
        patient: account,
        doctor: doctorAddress,
        notes: appointmentMetadata,
        timestamp: appointmentTimestamp,
      };

      const metadataHash = await uploadMetadataToIPFS(metadata);
      if (!metadataHash) {
        alert("Failed to upload metadata to IPFS");
        return;
      }

      console.log("Booking appointment with:");
      console.log("Doctor Address:", doctorAddress);
      console.log("Timestamp:", timestamp);
      console.log("Metadata Hash:", metadataHash);

      const tx = await contract.bookAppointment(doctorAddress, timestamp, metadataHash, {
        gasLimit: "500000",
      });
      const receipt = await tx.wait();

      if (receipt.events) {
        const event = receipt.events.find((e) => e.event === "AppointmentBooked");
        if (event && event.args) {
          const appointmentId = event.args.appointmentId.toString();
          alert(`Appointment booked successfully! Your appointment ID is: ${appointmentId}`);
        } else {
          alert("Appointment booked, but could not retrieve the appointment ID.");
        }
      } else {
        // Fallback for missing `events`
        const iface = new Interface(AppointmentAbi.abi);
        if (receipt.logs.length > 0) {
          const log = receipt.logs[0];
          const parsedLog = iface.parseLog(log);
          if (parsedLog.name === "AppointmentBooked") {
            const appointmentId = parsedLog.args.appointmentId.toString();
            alert(`Appointment booked successfully! Your appointment ID is: ${appointmentId}`);
          } else {
            alert("Appointment booked, but could not retrieve the event.");
          }
        } else {
          alert("Transaction successful but no logs found.");
        }
      }
    } catch (error) {
      console.error("Booking error:", error);
      alert(`Booking failed: ${error.message}`);
    }
  };

  // Cancel an appointment
  const cancelAppointment = async () => {
    try {
      if (!appointmentId) {
        alert("Please enter a valid appointment ID.");
        return;
      }
      await contract.cancelAppointment(appointmentId, {
        gasLimit: "100000",
      });
      alert("Appointment cancelled successfully!");
    } catch (error) {
      console.error("Cancellation error:", error);
      alert(`Cancellation failed: ${error.message}`);
    }
  };

  // Reschedule an appointment
  const rescheduleAppointment = async () => {
    try {
      if (!appointmentId || !newTimestamp) {
        alert("Please enter a valid appointment ID and new timestamp.");
        return;
      }

      const timestamp = Math.floor(new Date(newTimestamp).getTime() / 1000);
      if (timestamp <= Math.floor(Date.now() / 1000)) {
        alert("New appointment time must be in the future.");
        return;
      }

      await contract.rescheduleAppointment(appointmentId, timestamp, {
        gasLimit: "100000",
      });
      alert("Appointment rescheduled successfully!");
    } catch (error) {
      console.error("Reschedule error:", error);
      alert(`Reschedule failed: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Healthcare Appointment dApp</h1>
      <p>Account: {account}</p>
      <div>
        <h3>Book Appointment</h3>
        <input type="datetime-local" onChange={(e) => setAppointmentTimestamp(e.target.value)} />
        <input
          type="text"
          placeholder="Additional Metadata (e.g., reason)"
          onChange={(e) => setAppointmentMetadata(e.target.value)}
        />
        <button onClick={bookAppointment}>Book Appointment</button>
      </div>
      <div>
        <h3>Cancel Appointment</h3>
        <input
          type="text"
          placeholder="Appointment ID"
          onChange={(e) => setAppointmentId(e.target.value)}
        />
        <button onClick={cancelAppointment}>Cancel Appointment</button>
      </div>
      <div>
        <h3>Reschedule Appointment</h3>
        <input
          type="text"
          placeholder="Appointment ID"
          onChange={(e) => setAppointmentId(e.target.value)}
        />
        <input type="datetime-local" onChange={(e) => setNewTimestamp(e.target.value)} />
        <button onClick={rescheduleAppointment}>Reschedule Appointment</button>
      </div>
    </div>
  );
}

export default App;
