---
status: complete
created: '2025-11-20'
tags:
  - frontend
  - ui
  - design
  - react
  - shadcn
priority: high
assignee: marvin
---

# Modern Web UI Redesign

> **Status**: 📅 Planned · **Priority**: High · **Created**: 2025-11-20

## Overview

Redesign the AgentRelay web interface to be a professional, comprehensive, and modern mission control center. The current basic UI will be replaced with a robust dashboard featuring sidebar navigation, detailed runner management, and a multi-tab terminal experience.

## Goals

1.  **Professional Aesthetic**: Clean, modern design using `shadcn/ui` components.
2.  **Improved Navigation**: Sidebar-based navigation for easy access to different sections.
3.  **Enhanced Functionality**:
    *   **Dashboard**: At-a-glance system status and metrics.
    *   **Runner Management**: Detailed view of connected runners with status and metadata.
    *   **Multi-Session Terminal**: Tabbed interface to handle multiple active terminal sessions simultaneously.
4.  **Better UX**: Responsive design, dark mode support, and intuitive interactions.

## Design

### Layout Structure
-   **Sidebar**: Collapsible navigation menu (Dashboard, Runners, Terminal, Settings).
-   **Header**: Breadcrumbs, global actions (e.g., "Connect New Runner"), Theme Toggle, User/System Status.
-   **Main Content Area**: Dynamic content based on selected route.

### Key Views

#### 1. Dashboard (Home)
-   **Metrics Cards**:
    *   Active Runners (count)
    *   Active Sessions (count)
    *   System Uptime / Health
-   **Recent Activity**: Log of recent connections/disconnections.
-   **Quick Actions**: "Connect to Runner", "View Logs".

#### 2. Runners List
-   **Table View**:
    *   Columns: Status (Online/Offline), ID, Hostname, IP, Last Seen, Active Sessions.
    *   Actions: Connect, Disconnect, View Details.
-   **Filtering/Sorting**: Filter by status, search by ID.

#### 3. Terminal (Multi-Tab)
-   **Tab Bar**: Switch between active sessions (e.g., "runner-01", "runner-02").
-   **Split Panes** (Future): Option to view terminals side-by-side.
-   **Session Management**: Close tabs, rename tabs, reconnect.

#### 4. Settings
-   **Appearance**: Theme selection (Light/Dark/System).
-   **Connection**: HQ Server URL configuration.
-   **About**: Version info, links to docs.

## Technical Implementation

### Stack Additions
-   **Routing**: `react-router-dom` for client-side routing.
-   **State Management**: `zustand` for managing global state (runners list, active sessions, theme).
-   **Icons**: `lucide-react` (already included with shadcn).

### Component Plan (shadcn/ui)
-   **Layout**: `Sidebar` (custom or `Sheet`), `Resizable` (for split panes).
-   **Data Display**: `Table`, `Badge`, `Card`, `ScrollArea`.
-   **Navigation**: `Tabs`, `Breadcrumb`, `DropdownMenu`.
-   **Feedback**: `Toast` (for notifications), `Skeleton` (loading states).

## Plan

- [ ] **Setup & Infrastructure**
    - [ ] Install `react-router-dom` and `zustand`.
    - [ ] Set up basic routing structure (`/`, `/runners`, `/terminal`, `/settings`).
    - [ ] Create `Layout` component with Sidebar and Header.

- [ ] **Dashboard Implementation**
    - [ ] Create `Dashboard` page.
    - [ ] Implement Metric Cards (mock data initially, then real).
    - [ ] Implement Recent Activity feed.

- [ ] **Runners View**
    - [ ] Create `Runners` page.
    - [ ] Implement `RunnersTable` using `shadcn/ui` Table.
    - [ ] Integrate with `useRunners` store/hook.

- [ ] **Terminal Experience**
    - [ ] Refactor `Terminal` component to be reusable.
    - [ ] Create `TerminalPage` with `Tabs` for multiple sessions.
    - [ ] Implement session state management in Zustand.

- [ ] **Polish & Refinement**
    - [ ] Add `Settings` page.
    - [ ] Ensure responsive design works on smaller screens.
    - [ ] Add loading states and error handling.

## Open Questions
-   **Auth**: Is there any authentication required for the web UI? (Currently assumes open/local).
-   **Persistence**: Should open terminal tabs persist across page reloads? (Maybe store session IDs in localStorage).

