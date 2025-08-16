# TecniServer Pro - Taller Management System

This is a comprehensive workshop management system built with React, Vite, and TypeScript, styled with Tailwind CSS, and powered by the Google Gemini API.

## Running the Project Locally with VS Code

This project is fully configured to run locally using Visual Studio Code or any other code editor. Follow these steps to get started:

### Prerequisites

*   [Node.js](https://nodejs.org/) (version 18 or newer recommended)
*   A code editor like [Visual Studio Code](https://code.visualstudio.com/)

### Step-by-Step Instructions

1.  **Clone or Download the Project:**
    Get the project files onto your local machine.

2.  **Open in VS Code:**
    Open the project folder in Visual Studio Code.

3.  **Install Dependencies:**
    Open the integrated terminal in VS Code (`Ctrl+ñ` or `View > Terminal`) and run the following command. This will download all the necessary libraries for the project to run.
    ```bash
    npm install
    ```

4.  **Set Up Environment Variables (Crucial Step):**
    The application requires a Google Gemini API key to function.
    a. In the root of the project, create a new file named `.env.local`.
    b. You can duplicate the provided `.env.local.example` file and rename it.
    c. Open `.env.local` and add your API key like this:
    ```
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```
    Replace `"YOUR_GEMINI_API_KEY_HERE"` with your actual key. This file is ignored by version control for security.

5.  **Run the Development Server:**
    In the terminal, run the following command to start the application:
    ```bash
    npm run dev
    ```
    Vite will start a local server, typically at `http://localhost:5173`. Open this URL in your web browser to see the application running. Any changes you make to the source code will automatically reload in the browser.

### Building for Production

When you are ready to deploy the application, run:
```bash
npm run build
```
This command will create an optimized, production-ready version of your app in a `dist` folder. You can then deploy the contents of this folder to any static hosting service.
