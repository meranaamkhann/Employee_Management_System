import { StatusPage } from './StatusPage'

export default function ForbiddenPage() {
  return (
    <StatusPage
      code="403"
      title="You don't have access to this"
      description="Your account role doesn't include permission to view this page."
    />
  )
}
