import { StatusPage } from './StatusPage'

export default function NotFoundPage() {
  return (
    <StatusPage
      code="404"
      title="This page doesn't exist"
      description="The page you're looking for may have been moved or removed."
    />
  )
}
