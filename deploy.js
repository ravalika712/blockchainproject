const hre = require("hardhat");

async function main() {
  // Get the contract factory for Appointment
  const Appointment = await hre.ethers.getContractFactory("Appointment");

  // Deploy the contract
  const appointment = await Appointment.deploy();

  // Wait until the contract is deployed
  await appointment.waitForDeployment();

  // Get the deployed contract address
  const contractAddress = await appointment.getAddress();
  console.log("Appointment contract deployed to:", contractAddress);
}

// Catch errors and handle them
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
