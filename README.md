# AI Bug Commander (AI Software Engineer)

This repository is built for the **26/09/2026 Swytchcode Buildathon** under the **AI Software Engineer Track**. 
The goal of this project is to build an autonomous AI software engineer capable of understanding development tasks, interacting with code repositories, tracking issues, and assisting development teams.

## 🚀 Features Implemented

- **Modern Command Center Dashboard**: A premium, dynamic frontend built with React, Vite, and TailwindCSS. It features a responsive layout with real-time UI updates, tool activity panels, and a dynamic decision-tracking view.
- **GitHub Integration**: Automatically fetches your repositories and open issues securely via Swytchcode integrations.
- **Intelligent Bug Analysis**: Uses Large Language Models (LLMs) via LangGraph to read incoming bug reports and understand the context.
- **Autonomous Decision Making**: Automatically prioritizes bugs and decides whether an issue warrants tracking as a formal ticket based on its severity and impact.
- **Automated Jira Task Creation**: Seamlessly creates Jira tasks (with formatted Atlassian Document Format descriptions) for critical issues.
- **Slack Notifications**: Notifies your team's Slack channel in real-time when new bugs are analyzed and tracks Jira ticket links.
- **Real-Time Execution Streaming**: The backend utilizes Server-Sent Events (SSE) to stream the LangGraph agent's intermediate steps. The frontend progressively updates the timeline, issue analysis, and Agent Decisions panel without waiting for the full job to finish.
- **AI Code Review Pre-commit Hook**: A custom Git pre-commit script that runs AI-powered analysis over your staged code, providing automated reviews and feedback before you even push your code.

## 🔮 Upcoming Features

- **Code Ownership Tracking**: Identify the code owner for specific bugs and automatically assign the created Jira tickets to that particular person.
- **Admin Dashboard**: A high-level view where admins and managers can analyze team performance, agent activity, and overall project health.
- **Autonomous Code Fixing**: The agent will automatically create a sub-branch, attempt to write the code fix for the bug, and create a Pull Request for human review.
