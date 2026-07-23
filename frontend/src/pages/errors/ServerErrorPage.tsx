import { StatusPage } from './StatusPage'

export default function ServerErrorPage() {
  return (
    <StatusPage
      code="500"
      title="Something went wrong"
      description="We hit an unexpected error on our end. Please try again in a moment."
    />
  )
}
