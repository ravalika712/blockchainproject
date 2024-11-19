// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Appointment {
    event AppointmentBooked(
        address indexed patient,
        address indexed doctor,
        uint256 timestamp,
        string metadataHash,
        uint256 appointmentId
    );
    event AppointmentCancelled(address indexed patient, uint256 appointmentId);
    event AppointmentRescheduled(
        address indexed patient,
        uint256 appointmentId,
        uint256 newTimestamp
    );

    struct AppointmentInfo {
        address patient;
        address doctor;
        uint256 timestamp;
        string metadataHash;
        bool isActive;
    }

    mapping(uint256 => AppointmentInfo) public appointments;
    uint256 public appointmentCounter;

    function bookAppointment(
        address doctor,
        uint256 timestamp,
        string memory metadataHash
    ) public {
        require(doctor != address(0), "Invalid doctor address");
        require(timestamp > block.timestamp, "Appointment time must be in the future");

        appointmentCounter++;
        appointments[appointmentCounter] = AppointmentInfo(
            msg.sender,
            doctor,
            timestamp,
            metadataHash,
            true
        );

        emit AppointmentBooked(
            msg.sender,
            doctor,
            timestamp,
            metadataHash,
            appointmentCounter
        );
    }

    function cancelAppointment(uint256 appointmentId) public {
        AppointmentInfo storage appointment = appointments[appointmentId];
        require(appointment.isActive, "Appointment is not active");
        require(appointment.patient == msg.sender, "Only the patient can cancel their appointment");
        require(appointment.timestamp > block.timestamp, "Cannot cancel past appointments");

        appointment.isActive = false;

        emit AppointmentCancelled(msg.sender, appointmentId);
    }

    function rescheduleAppointment(uint256 appointmentId, uint256 newTimestamp) public {
        AppointmentInfo storage appointment = appointments[appointmentId];
        require(appointment.isActive, "Appointment is not active");
        require(appointment.patient == msg.sender, "Only the patient can reschedule their appointment");
        require(newTimestamp > block.timestamp, "New appointment time must be in the future");

        appointment.timestamp = newTimestamp;

        emit AppointmentRescheduled(msg.sender, appointmentId, newTimestamp);
    }
}
