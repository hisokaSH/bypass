#pragma once

#include <string>
#include <thread>
#include <atomic>
#include <chrono>

class LicenseValidator {
public:
    LicenseValidator();
    ~LicenseValidator();

    // Validates license at startup (interactive or cached)
    bool validateAtStartup();

    // Starts background validation thread (checks every hour)
    void startPeriodicValidation();

    // Stops the validation thread
    void stop();

    // Returns current validation status
    bool isValid() const;

private:
    std::string machineId;
    std::string licenseKey;
    std::atomic<bool> running;
    std::atomic<bool> validStatus;
    std::thread validationThread;

    // Gets unique machine identifier (CPU + Volume Serial)
    std::string getMachineId();

    // Reads stored license key from file
    std::string getStoredKey();

    // Saves license key to file
    void saveKey(const std::string& key);

    // Validates license key against API
    bool validateOnline(const std::string& key, const std::string& hwid);

    // Background validation loop
    void periodicCheck();

    // Prompts user for license key
    std::string promptForKey();

    // Makes HTTP POST request to validation endpoint
    bool makeValidationRequest(const std::string& key, const std::string& hwid);
};
