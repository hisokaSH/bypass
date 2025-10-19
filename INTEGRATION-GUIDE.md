# Vulcan Bypass - License System Integration Guide

This guide shows you how to integrate the license validation system into your C++ Vulcan bypass project.

## 📁 Files to Copy to Your C++ Project

Copy these 3 files to your Visual Studio project directory:

1. **LicenseValidator.hpp**
2. **LicenseValidator.cpp**
3. **Update your main.cpp** (see below)

---

## 🔧 Step 1: Add Files to Your Visual Studio Project

1. Right-click your project in Solution Explorer
2. Add → Existing Item
3. Select `LicenseValidator.hpp` and `LicenseValidator.cpp`

---

## 📝 Step 2: Update Your main.cpp

Replace your current `main()` function with this:

```cpp
#include "ConfigProxy.hpp"
#include "RiotUtils.hpp"
#include "LicenseValidator.hpp"

#include <iostream>
#include <thread>
#include <csignal>

BOOL WINAPI consoleCtrlHandler(DWORD)
{
    RiotUtils::terminateRiotServices();
    return TRUE;
}

void signalHandler(int)
{
    RiotUtils::terminateRiotServices();
}

std::terminate_handler g_prevTerminate = nullptr;
void terminateHandler()
{
    RiotUtils::terminateRiotServices();
    if (g_prevTerminate)
        g_prevTerminate();
    std::abort();
}

int main()
{
    // ========================================================================
    // LICENSE VALIDATION - MUST BE FIRST
    // ========================================================================

    std::cout << "=================================================\n";
    std::cout << "        Vulcan Bypass - License Activation      \n";
    std::cout << "=================================================\n\n";

    LicenseValidator validator;

    // Validate license at startup
    if (!validator.validateAtStartup())
    {
        std::cout << "\n[X] License validation failed!\n";
        std::cout << "Please visit your license portal to get a valid license.\n";
        std::cout << "Press any key to exit...\n";
        std::cin.get();
        return 1;
    }

    std::cout << "\n[✓] License validated successfully!\n";
    std::cout << "=================================================\n\n";

    // Start background validation (checks every hour)
    validator.startPeriodicValidation();

    // ========================================================================
    // ORIGINAL BYPASS CODE
    // ========================================================================

    std::atexit([] { RiotUtils::terminateRiotServices(); });
    g_prevTerminate = std::set_terminate(terminateHandler);
    SetConsoleCtrlHandler(consoleCtrlHandler, TRUE);

    std::signal(SIGINT, signalHandler);
    std::signal(SIGTERM, signalHandler);
    std::signal(SIGABRT, signalHandler);

    RiotUtils::terminateRiotServices();

    auto riotPath = RiotUtils::getPath();
    if (!riotPath.has_value())
    {
        std::cout << "Can't find Riot Client!" << std::endl;
        validator.stop();
        return 1;
    }

    if (RiotUtils::isVanguardInstalled())
    {
        if (!RiotUtils::removeVanguard())
        {
            std::cout << "Failed to remove Vanguard!" << std::endl;
            validator.stop();
            return 1;
        }
    }

    if (RiotUtils::isVanguardInstalled())
    {
        std::cout << "Vanguard is still installed!" << std::endl;
        validator.stop();
        return 1;
    }

    ConfigProxy proxy;

    std::thread t([&] { proxy.run(); });

    std::this_thread::sleep_for(std::chrono::seconds(3));
    RiotUtils::runRiotClient(proxy.getPort());

    std::cout << "Goodbye cheap bypass!" << std::endl;

    while (validator.isValid())
        std::this_thread::sleep_for(std::chrono::seconds(5));

    proxy.stop();
    t.join();
    validator.stop();

    return 0;
}
```

---

## 🏗️ Step 3: Build Settings

Make sure your Visual Studio project has these settings:

### Required Libraries (already included via #pragma comment)
- `wininet.lib` (for HTTP requests)
- `shell32.lib` (for opening browser)

### Build Configuration
1. Right-click project → Properties
2. Configuration: **All Configurations**
3. C/C++ → General → C++ Language Standard: **ISO C++17** or newer
4. Build → Configuration Type: **Application (.exe)**

---

## 🌐 Step 4: Deploy Your Web Dashboard

### Option A: Quick Test (localhost)

1. Leave the code as-is (uses `http://localhost:5173/activate`)
2. Run your web app locally: `npm run dev`
3. Build and run your C++ exe

### Option B: Production (Deploy to Web)

1. Deploy your web app to a hosting service:
   - **Vercel** (recommended, free)
   - **Netlify**
   - **Your own server**

2. Update the URL in `LicenseValidator.cpp` line 271:
   ```cpp
   std::string activationUrl = "https://your-domain.com/activate";
   ```

3. Rebuild your exe

---

## 🎯 How It Works When Users Run Your .exe

1. **Console opens** with "Vulcan Bypass - License Activation"
2. **Browser automatically opens** to activation page
3. **Console shows Machine ID** - user copies this
4. **User enters in browser:**
   - Machine ID (from console)
   - License key (that you provided them)
5. **Browser validates** the license via Supabase
6. **If valid:** Shows success message with expiration date
7. **User goes back to console** and confirms
8. **Bypass starts** and runs normally
9. **Background checks** validate license every hour

---

## 🔐 Security Features Built-In

✅ **Hardware ID binding** - Each license tied to specific PC
✅ **Online validation** - Always checks with server (no offline cracks)
✅ **Hourly re-checks** - License validated every hour while running
✅ **Expiration dates** - Keys automatically expire
✅ **Activation limits** - Control max number of activations per key
✅ **Admin dashboard** - Monitor all active licenses

---

## 📊 Admin Dashboard URLs

After deployment, you'll have these URLs:

- `/activate` - **For users** to activate their license
- `/login` - **For you** to log in as admin
- `/` - **Admin dashboard** to see all licenses
- `/admin` - **Generate new keys** and manage users

---

## 🔑 Creating License Keys (Admin)

1. Go to `/login` on your deployed site
2. Log in with your admin account
3. Go to **Admin Panel** (`/admin`)
4. Click **Generate License Key**
5. Set duration (7, 30, or 90 days)
6. Copy the key and send it to your customer

---

## 🎫 Customer Flow

1. Customer buys your bypass
2. You generate a license key in admin panel
3. Send them the key via email/Discord/etc
4. They run the `.exe`
5. Browser opens automatically
6. They enter their machine ID and license key
7. Bypass starts working
8. License checks every hour in background

---

## ⚙️ Environment Variables

Your web app needs these variables (already in `.env`):

```env
VITE_SUPABASE_URL=https://fbqjorresxxdyklbtrtn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

These are automatically used by both:
- The web dashboard (React app)
- The C++ validator (hardcoded in LicenseValidator.cpp)

---

## 🚀 Quick Deploy to Vercel (Recommended)

1. Push your project to GitHub
2. Go to https://vercel.com
3. Click "Import Project"
4. Select your repository
5. Vercel auto-detects Vite config
6. Click "Deploy"
7. Copy the URL (e.g., `https://your-app.vercel.app`)
8. Update `LicenseValidator.cpp` with your URL
9. Rebuild your exe

Done! Your license system is live.

---

## 📝 Notes

- The `license.dat` file is created next to your exe after first successful activation
- On subsequent runs, it auto-loads the cached key (but still validates online)
- Users can't bypass validation - it's always online-only
- If validation fails during runtime, the app exits immediately

---

## 🐛 Troubleshooting

### Browser doesn't open
- Make sure `shell32.lib` is linked
- Check Windows firewall isn't blocking

### "License validation failed"
- Verify the Supabase URL is correct
- Check internet connection
- Ensure license key format is correct: XXXX-XXXX-XXXX-XXXX

### Build errors
- Ensure C++17 or newer
- Check all required libraries are linked
- Verify Windows SDK is installed

---

## ✅ You're Done!

Copy the 3 files, update main.cpp, build your exe, and deploy the web app. That's it!
