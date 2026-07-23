import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginFormValues = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

const genderEnum = z.enum(['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED']).optional()
const statusEnum = z.enum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED']).optional()

export const employeeSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(120, 'Full name must be under 120 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z
    .string()
    .regex(/^$|^[+]?[0-9\-() ]{7,20}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  gender: genderEnum,
  dateOfBirth: z
    .string()
    .optional()
    .refine((val) => !val || new Date(val) < new Date(), 'Date of birth must be in the past'),
  departmentId: z.string().optional(),
  designation: z.string().max(100, 'Designation must be under 100 characters').optional(),
  joiningDate: z.string().optional(),
  salary: z.coerce.number().min(0, 'Salary cannot be negative'),
  status: statusEnum,
  managerId: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  photoUrl: z.string().optional(),
  notes: z.string().max(2000, 'Notes must be under 2000 characters').optional(),
})
export type EmployeeFormValues = z.infer<typeof employeeSchema>

export const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100, 'Name must be under 100 characters'),
  description: z.string().max(1000, 'Description must be under 1000 characters').optional(),
  headEmployeeId: z.string().optional(),
  budget: z.coerce.number().min(0, 'Budget cannot be negative').optional(),
})
export type DepartmentFormValues = z.infer<typeof departmentSchema>
