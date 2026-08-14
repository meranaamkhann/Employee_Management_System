export type Role = 'ADMIN' | 'IT_ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNDISCLOSED'

export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED'

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  timestamp: string
}

export interface ApiErrorResponse {
  success: false
  errorCode: string
  message: string
  fieldErrors?: Record<string, string>
  timestamp: string
  path: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  email: string
  role: Role
  employeeId: string | null
  displayName?: string | null
}

export interface DepartmentSummary {
  id: string
  name: string
}

export interface EmployeeSummary {
  id: string
  fullName: string
  employeeCode: string
}

export interface Employee {
  id: string
  employeeCode: string
  fullName: string
  email: string
  phone?: string
  gender?: Gender
  dateOfBirth?: string
  department?: DepartmentSummary
  designation?: string
  joiningDate?: string
  salary: number
  status: EmploymentStatus
  manager?: EmployeeSummary
  emergencyContactName?: string
  emergencyContactPhone?: string
  addressLine?: string
  city?: string
  country?: string
  photoUrl?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface EmployeeFormValues {
  fullName: string
  email: string
  phone?: string
  gender?: Gender
  dateOfBirth?: string
  departmentId?: string
  designation?: string
  joiningDate?: string
  salary: number
  status?: EmploymentStatus
  managerId?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  addressLine?: string
  city?: string
  country?: string
  photoUrl?: string
  notes?: string
}

export interface Department {
  id: string
  name: string
  description?: string
  headEmployeeId?: string
  headEmployeeName?: string
  budget?: number
  employeeCount: number
  createdAt: string
  updatedAt: string
}

export interface DepartmentFormValues {
  name: string
  description?: string
  headEmployeeId?: string
  budget?: number
}

export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  onLeaveEmployees: number
  newHiresThisMonth: number
  totalMonthlySalary: number
  employeesByStatus: Record<string, number>
  departmentDistribution: { departmentName: string; employeeCount: number }[]
  recentHires: {
    employeeId: string
    fullName: string
    departmentName?: string
    designation?: string
    joiningDate: string
  }[]
}

export interface UserAccount {
  id: string
  email: string
  role: Role
  active: boolean
  emailVerified: boolean
  employeeId?: string
  employeeName?: string
  displayName?: string
  createdAt: string
}

export type AuditEntityType = 'EMPLOYEE' | 'DEPARTMENT' | 'USER_ACCOUNT'
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'DEACTIVATE' | 'ROLE_CHANGE' | 'LOGIN'

export interface AuditLogEntry {
  id: string
  entityType: AuditEntityType
  entityId?: string
  action: AuditAction
  performedByEmail: string
  performedByRole?: string
  summary?: string
  createdAt: string
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE'

export interface AttendanceRecord {
  id: string
  employee: EmployeeSummary
  workDate: string
  clockIn?: string
  clockOut?: string
  status: AttendanceStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MonthlySummary {
  employeeId: string
  employeeName: string
  month: string
  presentDays: number
  lateDays: number
  halfDays: number
  absentDays: number
  onLeaveDays: number
  totalRecorded: number
}

export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID'
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface LeaveRequestItem {
  id: string
  employee: EmployeeSummary
  leaveType: LeaveType
  startDate: string
  endDate: string
  numberOfDays: number
  reason?: string
  status: LeaveStatus
  reviewedBy?: EmployeeSummary
  reviewNote?: string
  createdAt: string
  updatedAt: string
}

export interface LeaveBalanceItem {
  leaveType: LeaveType
  year: number
  allocatedDays: number
  usedDays: number
  remainingDays: number
}

export interface Holiday {
  id: string
  date: string
  name: string
}

export type PayslipStatus = 'DRAFT' | 'FINALIZED' | 'PAID'

export interface Payslip {
  id: string
  employee: EmployeeSummary
  payMonth: string
  basicSalary: number
  hra: number
  conveyanceAllowance: number
  specialAllowance: number
  grossEarnings: number
  providentFund: number
  professionalTax: number
  unpaidLeaveDeduction: number
  bonus: number
  netSalary: number
  status: PayslipStatus
  generatedAt: string
  paidAt?: string
  notes?: string
}
