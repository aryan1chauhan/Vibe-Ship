@AGENTS.md
# **Agentic AI Systems for Personalized Task Management**
## **Project Vision**
Build an AI-powered "Agentic" task management system that learns from user behavior and preferences to proactively manage complex tasks and projects. The system will use a multi-agent architecture where specialized AI agents collaborate to break down large tasks, estimate effort, schedule work, and adapt to changes while maintaining user trust through transparency and control.

---

# **1. Core Architecture**
**Multi-Agent System:** A "Planner" agent will orchestrate specialized agents (Subtask Agent, Effort Estimation Agent, Scheduling Agent, Risk Assessment Agent, and Rebalancing Agent). The Planner will analyze user input, delegate tasks to other agents, review their outputs, and maintain the overall system state.

**Single Responsibility Agents:** Each agent will have a specific function, clearly defined prompts, and a single area of expertise. This promotes modularity, easier debugging, and the ability to retrain or replace individual agents without system-wide changes.

**Agent Communication:** Agents will communicate through a shared state in the database (task, subtask, and session records). The Planner will query other agents through the database and update records with their findings. This ensures that all agents have access to the same information and that the system state is always consistent.

---

# **2. Data Model**
## **User Preferences**
**Schema:**
```typescript
interface UserPreferences {
  user_id: string;
  timezone: string;
  daily_available_hours: number;
  work_start_hour: number;
  work_end_hour: number;
  created_at: string;
  updated_at: string;
}
```

**Purpose:**
The UserPreferences table will store per-user configuration that controls how the AI agents plan and schedule tasks. These preferences will be used by all agents to generate personalized outputs that align with the user's daily schedule, availability, and timezone.

**Description:**
This table will store all configuration settings that influence the behavior of the agent system, enabling the AI to generate personalized task management plans.

### **Key Fields:**
- **daily_available_hours**: (number) - Total hours per day the user is available for work (e.g., 4, 6, 8). This controls how many hours of work can be scheduled each day. Default: 8. Maximum: 24.
- **work_start_hour**: (number) - The hour when the user typically starts working (0-23). This is used to determine the earliest possible start time for task sessions.
- **work_end_hour**: (number) - The hour when the user typically finishes working (0-23). This defines the latest possible end time for task sessions.
- **timezone**: (string) - The user's timezone in IANA format (e.g., "America/New_York", "UTC"). This is used for all date/time calculations, ensuring that session times are relevant to the user's local time.

---

## **Tasks**
**Schema:**
```typescript
interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: string;
  task_type: TaskType;
  status: TaskStatus;
  priority: Priority;
  estimated_hours: number | null;
  actual_hours: number | null;
  ai_risk_level: RiskLevel | null;
  ai_risk_reason: string | null;
  created_at: string;
  updated_at: string;
}
```

**Description:**
The Tasks table is the central repository for all user tasks. Each task represents a distinct unit of work that needs to be completed, ranging from simple, short-term tasks to complex, long-term projects. Tasks are broken down into smaller, manageable subtasks that are then scheduled as individual work sessions.

---

### **Key Fields:**

#### **Primary Identification:**
- **id**: (string) Unique identifier for the task (UUID). System generated on creation.
- **user_id**: (string) Foreign key referencing the user who owns this task.

#### **Task Details:**
- **title**: (string) A concise title or name for the task (max 255 characters). This field is used by the AI agents for quick identification and in generated subtask titles.
- **description**: (string | null) A detailed description of the task, including context, requirements, and goals (max 65,535 characters). This field provides the information needed for the AI agents to understand the task and generate appropriate subtasks.
- **deadline**: (string) The target completion date and time for the task in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ). All scheduling calculations are based on this deadline.
- **task_type**: (enum) Type of task, used to provide context for scheduling and subtask generation.
  - 'assignment': Academic assignment (school, university)
  - 'project': Large, multi-phase undertaking
  - 'exam': Test or examination preparation
  - 'personal': Personal task or chore
  - 'work': Professional or job-related task

#### **Status Tracking:**
- **status**: (enum) The current status of the task. This field is updated by the AI agents as the task progresses.
  - 'planned': Task has been created and subtasks/schedule generated
  - 'active': Task is currently being worked on
  - 'completed': All work on the task is finished
  - 'missed': Task deadline was not met
  - 'replanned': Task schedule was adjusted due to changes
  - 'needs_review': Task requires user review (manual intervention)

#### **Effort Metrics:**
- **estimated_hours**: (number | null) The AI-estimated total hours required to complete the task (in hours). This is calculated by the Effort Estimation Agent based on subtask estimates.
- **actual_hours**: (number | null) The actual hours spent on the task (in hours). This field is updated when users log their work.

#### **AI Risk Assessment:**
- **ai_risk_level**: (enum | null) The risk level determined by the AI Risk Assessment Agent.
  - 'low': Minimal risk, plan is achievable
  - 'medium': Some risk factors present
  - 'high': Significant risk factors detected
  - 'critical': Major issues that require immediate attention
- **ai_risk_reason**: (string | null) A brief explanation of the detected risks and their potential impact.

#### **Timestamps:**
- **created_at**: (string) Timestamp when the task was created (ISO 8601).
- **updated_at**: (string) Timestamp when the task was last updated (ISO 8601).

---

### **Use Cases:**

#### **User Creation:**
Users can create tasks manually through the UI:
```javascript
POST /api/tasks
{
  "user_id": "uuid",
  "title": "Complete Q3 Financial Report",
  "description": "Prepare and submit the quarterly financial report including P&L, balance sheet, and cash flow analysis.",
  "deadline": "2024-08-15T17:00:00Z",
  "task_type": "work"
}
```

#### **AI Agent Processing:**
The AI Planner agent analyzes the task upon creation:
```javascript
// After creation, AI Planner triggers subtask generation
POST /api/agent/plan
{
  "task_id": "uuid",
  "user_id": "uuid"
}
```

#### **Status Updates:**
The task status evolves as the AI processes and the user works:
1. **Initial**: `planned`
2. **AI Processing**: `planned`
3. **AI Complete**: `planned` (awaiting user confirmation)
4. **User Confirmed**: `active`
5. **During Work**: `active`
6. **Completed**: `completed`

#### **Risk Monitoring:**
Risk assessment is performed automatically:
- **Low Risk**: Normal workflow
- **High/Critical Risk**: Status changes to `needs_review` and user is notified

---

### **Workflow Integration:**
1. **Task Creation**: User creates a task with title, description, and deadline.
2. **Subtask Generation**: AI Planner generates subtasks using the Subtask Agent.
3. **Effort Estimation**: AI assigns estimated hours to each subtask.
4. **Scheduling**: AI schedules subtasks into sessions using the Scheduling Agent.
5. **Risk Assessment**: AI assesses overall risk and updates `ai_risk_level`.
6. **User Review**: User reviews the generated plan and confirms or requests
