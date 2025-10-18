#include "LicenseValidator.hpp"
#include <windows.h>
#include <wininet.h>
#include <intrin.h>
#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <shellapi.h>

#pragma comment(lib, "wininet.lib")
#pragma comment(lib, "shell32.lib")

LicenseValidator::LicenseValidator()
    : running(false), validStatus(false)
{
    machineId = getMachineId();
}

LicenseValidator::~LicenseValidator()
{
    stop();
}

std::string LicenseValidator::getMachineId()
{
    std::string hwid;

    // Get volume serial number
    DWORD volumeSerial = 0;
    if (GetVolumeInformationA("C:\\", NULL, 0, &volumeSerial, NULL, NULL, NULL, 0))
    {
        char buffer[32];
        sprintf_s(buffer, "%08X", volumeSerial);
        hwid = buffer;
    }

    // Get CPU info
    int cpuInfo[4] = { 0 };
    __cpuid(cpuInfo, 1);
    char cpuBuffer[64];
    sprintf_s(cpuBuffer, "-%08X%08X", cpuInfo[3], cpuInfo[0]);
    hwid += cpuBuffer;

    return hwid;
}

std::string LicenseValidator::getStoredKey()
{
    std::ifstream file("license.dat");
    if (file.is_open())
    {
        std::string key;
        std::getline(file, key);
        file.close();
        return key;
    }
    return "";
}

void LicenseValidator::saveKey(const std::string& key)
{
    std::ofstream file("license.dat");
    if (file.is_open())
    {
        file << key;
        file.close();
    }
}

std::string LicenseValidator::promptForKey()
{
    std::string key;
    std::cout << "Enter your license key (format: XXXX-XXXX-XXXX-XXXX): ";
    std::getline(std::cin, key);
    return key;
}

bool LicenseValidator::makeValidationRequest(const std::string& key, const std::string& hwid)
{
    HINTERNET hInternet = InternetOpenA(
        "VulcanBypass/1.0",
        INTERNET_OPEN_TYPE_DIRECT,
        NULL,
        NULL,
        0
    );

    if (!hInternet)
        return false;

    HINTERNET hConnect = InternetOpenUrlA(
        hInternet,
        "https://fbqjorresxxdyklbtrtn.supabase.co/functions/v1/validate-key",
        NULL,
        0,
        INTERNET_FLAG_SECURE | INTERNET_FLAG_NO_CACHE_WRITE,
        0
    );

    if (!hConnect)
    {
        InternetCloseHandle(hInternet);
        return false;
    }

    // Prepare JSON body
    std::stringstream jsonBody;
    jsonBody << "{\"key\":\"" << key << "\",\"machine_id\":\"" << hwid << "\"}";
    std::string body = jsonBody.str();

    // Prepare headers
    std::string headers =
        "Content-Type: application/json\r\n"
        "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZicWpvcnJlc3h4ZHlrbGJ0cnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTgxODQsImV4cCI6MjA3NjM3NDE4NH0.9ZCzDBIO1N9Y-9BLSojshcbh9j7lEIzN4sBaN7_e6M0\r\n";

    InternetCloseHandle(hConnect);

    // Reopen with POST method
    hConnect = InternetOpenUrlA(
        hInternet,
        "https://fbqjorresxxdyklbtrtn.supabase.co/functions/v1/validate-key",
        headers.c_str(),
        headers.length(),
        INTERNET_FLAG_SECURE | INTERNET_FLAG_NO_CACHE_WRITE | INTERNET_FLAG_RELOAD,
        0
    );

    if (!hConnect)
    {
        InternetCloseHandle(hInternet);
        return false;
    }

    // Use HttpSendRequest for POST
    HINTERNET hRequest = InternetOpenUrlA(
        hInternet,
        "https://fbqjorresxxdyklbtrtn.supabase.co/functions/v1/validate-key",
        headers.c_str(),
        headers.length(),
        INTERNET_FLAG_SECURE | INTERNET_FLAG_NO_CACHE_WRITE,
        0
    );

    InternetCloseHandle(hConnect);

    // For simplicity, use WinHTTP approach instead
    InternetCloseHandle(hInternet);

    // Alternative: Use WinHTTP for proper POST support
    HINTERNET hSession = InternetOpenA(
        "VulcanBypass/1.0",
        INTERNET_OPEN_TYPE_DIRECT,
        NULL,
        NULL,
        0
    );

    HINTERNET hConnection = InternetConnectA(
        hSession,
        "fbqjorresxxdyklbtrtn.supabase.co",
        INTERNET_DEFAULT_HTTPS_PORT,
        NULL,
        NULL,
        INTERNET_SERVICE_HTTP,
        0,
        0
    );

    if (!hConnection)
    {
        InternetCloseHandle(hSession);
        return false;
    }

    HINTERNET hReq = HttpOpenRequestA(
        hConnection,
        "POST",
        "/functions/v1/validate-key",
        NULL,
        NULL,
        NULL,
        INTERNET_FLAG_SECURE | INTERNET_FLAG_NO_CACHE_WRITE,
        0
    );

    if (!hReq)
    {
        InternetCloseHandle(hConnection);
        InternetCloseHandle(hSession);
        return false;
    }

    std::string allHeaders =
        "Content-Type: application/json\r\n"
        "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZicWpvcnJlc3h4ZHlrbGJ0cnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTgxODQsImV4cCI6MjA3NjM3NDE4NH0.9ZCzDBIO1N9Y-9BLSojshcbh9j7lEIzN4sBaN7_e6M0";

    BOOL result = HttpSendRequestA(
        hReq,
        allHeaders.c_str(),
        allHeaders.length(),
        (LPVOID)body.c_str(),
        body.length()
    );

    if (!result)
    {
        InternetCloseHandle(hReq);
        InternetCloseHandle(hConnection);
        InternetCloseHandle(hSession);
        return false;
    }

    // Read response
    char buffer[4096] = { 0 };
    DWORD bytesRead = 0;
    std::string response;

    while (InternetReadFile(hReq, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0)
    {
        buffer[bytesRead] = 0;
        response += buffer;
    }

    InternetCloseHandle(hReq);
    InternetCloseHandle(hConnection);
    InternetCloseHandle(hSession);

    // Parse JSON response (simple check for "valid":true)
    bool isValid = response.find("\"valid\":true") != std::string::npos;

    if (!isValid)
    {
        // Check for error message
        if (response.find("\"error\"") != std::string::npos)
        {
            size_t start = response.find("\"error\":\"") + 9;
            size_t end = response.find("\"", start);
            if (start != std::string::npos && end != std::string::npos)
            {
                std::string error = response.substr(start, end - start);
                std::cout << "[!] Validation error: " << error << std::endl;
            }
        }
    }

    return isValid;
}

bool LicenseValidator::validateOnline(const std::string& key, const std::string& hwid)
{
    std::cout << "[*] Validating license with server..." << std::endl;
    std::cout << "[*] Machine ID: " << hwid << std::endl;

    bool result = makeValidationRequest(key, hwid);

    if (result)
    {
        std::cout << "[✓] License is valid!" << std::endl;
    }
    else
    {
        std::cout << "[X] License validation failed!" << std::endl;
    }

    return result;
}

bool LicenseValidator::validateAtStartup()
{
    // Open web UI for activation
    std::cout << "[*] Opening license activation page..." << std::endl;
    std::string activationUrl = "http://localhost:5173/activate";
    ShellExecuteA(NULL, "open", activationUrl.c_str(), NULL, NULL, SW_SHOWNORMAL);

    std::cout << "\n========================================" << std::endl;
    std::cout << "  Web activation page opened in browser" << std::endl;
    std::cout << "========================================" << std::endl;
    std::cout << "\nYour Machine ID: " << machineId << std::endl;
    std::cout << "\nPlease enter this Machine ID in the web form." << std::endl;
    std::cout << "Then paste your license key below:\n" << std::endl;

    // Try to load cached key
    licenseKey = getStoredKey();

    if (!licenseKey.empty())
    {
        std::cout << "[*] Found cached license key..." << std::endl;
        if (validateOnline(licenseKey, machineId))
        {
            validStatus = true;
            return true;
        }
        std::cout << "[!] Cached key is invalid, please enter a new one." << std::endl;
    }

    // Prompt for new key
    while (true)
    {
        licenseKey = promptForKey();

        if (licenseKey.empty())
        {
            std::cout << "[!] License key cannot be empty!" << std::endl;
            continue;
        }

        if (validateOnline(licenseKey, machineId))
        {
            saveKey(licenseKey);
            validStatus = true;
            return true;
        }

        std::cout << "[!] Invalid license key. Please try again or contact support." << std::endl;
        std::cout << "\nPress Enter to retry, or type 'exit' to quit: ";
        std::string input;
        std::getline(std::cin, input);

        if (input == "exit")
            return false;
    }

    return false;
}

void LicenseValidator::periodicCheck()
{
    while (running)
    {
        // Wait 1 hour (3600 seconds)
        for (int i = 0; i < 3600 && running; ++i)
        {
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }

        if (!running)
            break;

        std::cout << "\n[*] Performing periodic license check..." << std::endl;

        if (!validateOnline(licenseKey, machineId))
        {
            std::cout << "[X] License validation failed! Application will terminate." << std::endl;
            validStatus = false;
            running = false;
            break;
        }

        std::cout << "[✓] License still valid." << std::endl;
    }
}

void LicenseValidator::startPeriodicValidation()
{
    if (running)
        return;

    running = true;
    validationThread = std::thread(&LicenseValidator::periodicCheck, this);
}

void LicenseValidator::stop()
{
    running = false;
    if (validationThread.joinable())
        validationThread.join();
}

bool LicenseValidator::isValid() const
{
    return validStatus;
}
