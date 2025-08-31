GitLab Commit History Fetcher
This is a simple, modern web application built with React, Next.js, and Tailwind CSS that helps you fetch and view your commit history from GitLab. It allows you to filter commits by a specific date range and provides a clean, user-friendly interface to easily copy commit messages and project details.

✨ Features
Authentication: Securely use your GitLab private token to fetch your personal commit history.

Date Filtering: Use an intuitive date range picker to view commits within a specific timeframe.

Commit Grouping: Commits are automatically grouped by project and date for a clean, consolidated view.

Data Table: A sortable and searchable data grid to easily navigate your commit history.

Copy Functionality: Quickly copy a commit message with its associated project name to your clipboard with a single click.

Local Storage: Your GitLab username and token are saved in local storage for convenience, so you do not have to enter them every time.

🚀 Getting Started
Follow these instructions to get a copy of the project up and running on your local machine.

Prerequisites
You will need the following installed on your computer:

Node.js (v14.x or later)

npm or yarn

Installation
Clone the repository:

git clone [https://github.com/](https://github.com/)[Your-Username]/gitlab-commit-history-fetcher.git
cd gitlab-commit-history-fetcher

Install dependencies:

npm install
# or
yarn install

Run the development server:

npm run dev
# or
yarn dev

Open http://localhost:3000 in your browser to see the application.

🔑 How to Use
Generate a Private Token: Go to your GitLab profile settings, navigate to "Access Tokens," and create a new personal access token with the api scope enabled.

Enter your Credentials: On the app's home page, enter your GitLab username and the private token you just created. Click Submit.

Select a Date Range: Use the date picker to select a start and end date for the commits you want to view.

Load Commits: Click the Load Commits button. The application will fetch your commit history and display it in the table below.

Copy Commits: Use the "Copy" button in each row to copy the commit message to your clipboard.

⚙️ Technologies Used
React - The JavaScript library for building user interfaces.

Next.js - The React framework for production.

TypeScript - For type-safe code.

Tailwind CSS - A utility-first CSS framework for rapid UI development.

Ant Design - A React UI library for the date picker component.

MUI (Material-UI) - For the DataGrid component.

Day.js - A lightweight JavaScript library for parsing and formatting dates.