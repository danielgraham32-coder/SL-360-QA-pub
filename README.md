# SL-360 QA - eLearning Review Platform

A tool that reviews your eLearning courses (Storyline 360, Rise, or any HTML-based training) for **grammar errors**, **design issues**, and **functionality problems** - automatically.

You paste in a link to your published course, and the platform goes through it slide-by-slide like a learner would, documenting everything that needs to be fixed.

---

## What It Checks

| Category        | What It Looks For |
|----------------|-------------------|
| **Grammar**     | Misspellings, repeated words, punctuation errors, passive voice, inconsistent capitalization, confusing words (its/it's, their/there, etc.) |
| **Design**      | Poor color contrast (WCAG accessibility), too many fonts, text too small, inconsistent text sizes, missing image alt text, tight line spacing |
| **Functionality** | Broken links, empty buttons, hidden navigation, localhost URLs left in, HTTP instead of HTTPS, missing images |

---

## Getting Started (Step by Step)

### Step 1: Install Node.js (one time only)

Node.js is the engine that runs this application. You only need to do this once.

1. Go to **https://nodejs.org**
2. Click the big green **LTS** button to download it
3. Open the downloaded file and follow the installer prompts (just click Next/Continue through everything)
4. When it's done, **restart your computer** (or at least close and reopen your terminal)

**To verify it worked**, open a terminal and type:
```
node -v
```
You should see a version number like `v20.x.x`. If you see that, you're good!

### Step 2: Open a terminal in the project folder

- **Windows**: Open the project folder in File Explorer, click the address bar, type `cmd`, press Enter
- **Mac**: Open Terminal (search for "Terminal" in Spotlight), then type `cd ` (with a space), drag the project folder onto the Terminal window, and press Enter

### Step 3: Run the setup script (one time only)

In your terminal, type:
```
bash setup.sh
```

This installs everything the app needs. It may take a couple of minutes. You only need to do this once.

### Step 4: Start the application

In your terminal, type:
```
bash start.sh
```

You should see a message saying the server is running.

### Step 5: Use it!

1. Open your web browser (Chrome, Edge, Firefox, etc.)
2. Go to **http://localhost:3001**
3. Paste the URL of your published eLearning course
4. Click **Start Review**
5. Wait for the review to complete (it navigates through your course automatically)
6. View the results - filter by Grammar, Design, or Functionality

### To stop the application

Press **Ctrl+C** in the terminal window where it's running.

### To start it again later

Just run `bash start.sh` again (you don't need to re-run setup).

---

## How to Read the Results

Each finding has a **severity level**:

- **Critical** (red) - Must fix. These are things like broken images, unreadable text due to poor contrast, or links pointing to localhost.
- **Warning** (yellow) - Should fix. These are things like misspellings, inconsistent fonts, or empty links.
- **Info** (blue) - Consider fixing. These are suggestions for improvement like using active voice or more descriptive link text.

Use the filter buttons at the top of the results to focus on one category or severity at a time.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `command not found: node` | Node.js isn't installed. Go back to Step 1. |
| `command not found: bash` | On Windows, try using Git Bash or PowerShell instead of Command Prompt. |
| Setup script shows errors | Make sure you have an internet connection. Try running `bash setup.sh` again. |
| Browser says "can't connect" | Make sure the server is running (`bash start.sh`). Check that you're going to `http://localhost:3001` (not https). |
| Review stuck on "In Progress" | The course URL may not be reachable, or the course may use a format the crawler can't navigate. Try a different course. |
