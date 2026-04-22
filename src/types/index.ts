export type UserRole = 'ADMIN' | 'PM' | 'TEAM_MEMBER' | 'VIEWER'
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'
export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
export type AutomationPhase = 'VENDOR' | 'DEVELOPMENT' | 'SIT' | 'UAT' | 'GO_LIVE'
export type ReleaseStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'
export type ReleaseItemType = 'FEATURE' | 'BUG' | 'IMPROVEMENT'
export type ReleaseItemStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE'
export type NotificationType = 'TASK_ASSIGNED' | 'TASK_DELAYED' | 'DEPENDENCY_BLOCKED' | 'RELEASE_UPCOMING'

export interface AppUser {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  start_date?: string
  end_date?: string
  status: ProjectStatus
  owner_id: string
  owner?: AppUser
  created_at: string
}

export interface SOP {
  id: string
  project_id: string
  name: string
  readiness: number
  start_date?: string
  end_date?: string
  created_at: string
  subtasks?: SOPSubtask[]
  progress?: number // computed
  is_delayed?: boolean // computed
}

export interface SOPSubtask {
  id: string
  sop_id: string
  name: string
  department?: string
  assigned_to?: string
  assigned_user?: AppUser
  progress: number
  status: TaskStatus
  depends_on?: string
  dependency?: SOPSubtask
  remarks?: string
  start_date?: string
  end_date?: string
  created_at: string
  is_blocked?: boolean // computed
  is_delayed?: boolean // computed
}

export interface Automation {
  id: string
  project_id: string
  name: string
  created_at: string
  phases?: AutomationPhaseRecord[]
}

export interface AutomationPhaseRecord {
  id: string
  automation_id: string
  phase: AutomationPhase
  owner?: string
  progress: number
  start_date?: string
  end_date?: string
  created_at: string
  is_delayed?: boolean // computed
}

export interface Release {
  id: string
  project_id: string
  name: string
  release_date?: string
  status: ReleaseStatus
  vendor_name?: string
  progress: number
  created_at: string
  items?: ReleaseItem[]
}

export interface ReleaseItem {
  id: string
  release_id: string
  name: string
  type: ReleaseItemType
  status: ReleaseItemStatus
  owner?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  message: string
  read: boolean
  entity_id?: string
  entity_type?: string
  created_at: string
}
