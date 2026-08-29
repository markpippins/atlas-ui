# Nexus - Service Mesh Management Console

Nexus is a specialized administration console built with Angular for managing the Atomic Service Mesh. It provides a comprehensive interface for overseeing services, host servers, deployments, and configurations across the infrastructure.

## Key Capabilities

- **Service Mesh Management:** View and manage the registry of all services (`atomic-services`, `atomic-users`, etc.), their versions, and statuses.
- **Infrastructure Control:** Monitor and configure Host Servers (physical/virtual nodes) and Broker Gateways.
- **Deployment Tracking:** Track active deployments and rollout history across different environments.
- **Configuration Management:** Centralized management of service configurations and feature flags.
- **Visual Architecture Graph:** Interactive 3D visualization of service dependencies and relationships.
- **Multi-Platform Management:** Unified interface for managing services, frameworks, deployments, and hosts.
- **Integrated Search & Discovery:** Multi-source search capabilities with web, image, video, academic, and AI results.
- **Real-time Monitoring:** Live service health and status updates with WebSocket integration.

## Architecture & Features

- **Modern Angular:** Built with Angular 20+, utilizing Standalone Components, Signals, and Zoneless Change Detection for optimal performance.
- **Remote Management:** Connects to backend APIs to fetch real-time state of the mesh.
- **Dual Pane Interface:** Efficiently manage resources with a split-view interface for comparing configs or logs.
- **Theming:** Integrated Light, Steel, and Dark themes.
- **Visual Component Editor:** Integrated 3D service architecture graph with visual component editor.
- **Platform Management Views:** Dedicated CRUD interfaces for services, frameworks, deployments, hosts, and lookup tables.
- **Integrated Chat & Notes:** Built-in chat functionality and note-taking capabilities.
- **RSS Feed Integration:** Real-time feed monitoring and display.
- **Terminal Emulator:** Integrated terminal for command-line operations.
- **Advanced Search:** Multi-source search with Google, Unsplash, YouTube, academic databases, and Gemini AI.

## Recent Feature Updates

### Service Mesh Visualization
- **3D Architecture Graph:** Interactive visualization of service dependencies using Three.js
- **Real-time Updates:** WebSocket integration for live service status updates
- **Visual Component Editor:** Create and modify service components with visual tools
- **Service Instance Management:** Detailed view and control of individual service instances

### Platform Management
- **Data Dictionary:** Organized management of frameworks, service types, server types, and categories
- **CRUD Operations:** Full create, read, update, delete capabilities for all platform entities
- **Visual Style Management:** Associate default and override visual styles with services and service types
- **Deployment Management:** Track and manage service deployments across environments

### Enhanced User Experience
- **Dual-Pane Navigation:** Simultaneous browsing of different locations or views
- **Advanced Search Integration:** Multi-source search results displayed in both grid and list formats
- **Customizable Layout:** Adjustable pane sizes and collapsible sections
- **Context-Aware Toolbars:** Toolbars that adapt based on the current view and selection
- **Integrated Notes System:** Persistent note-taking capability linked to specific items

### Technical Improvements
- **Signal-Based State Management:** Leveraging Angular's latest reactivity system for improved performance
- **Tree Provider Architecture:** Abstracted tree navigation supporting multiple data sources
- **WebSocket Integration:** Real-time updates for service status and other dynamic data
- **Improved Error Handling:** Better error reporting and recovery mechanisms

## Running the Application

This is a web application built with the Angular CLI.

### Prerequisites

You must have [Node.js](https://nodejs.org/) and npm installed.

### 1. Installation

```bash
npm install
```

### 2. Running the Development Server

```bash
npm start
```

This will run the application at `http://localhost:4200`.

### 3. Building for Production

```bash
npm run build
```

## Configuration

The application supports various configuration options through the Local Configuration dialog accessible from the settings menu. You can customize:

- Default session name and image URL
- Theme preferences
- Pane layouts and visibility
- Search API keys for enhanced functionality

## Architecture Overview

The application follows a modular architecture with dedicated services for different functionality areas:

- `HostServerProvider`: Manages connections to host servers and retrieves platform data
- `ServiceMeshService`: Handles service mesh visualization and management
- `ArchitectureVizService`: Controls the 3D visualization of service architecture
- `TreeManagerService`: Manages tree navigation across different data sources
- `Search Services`: Multiple services for different search sources (Google, Unsplash, YouTube, etc.)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.