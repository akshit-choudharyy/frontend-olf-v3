import { LoginForm } from '@/components/widgets/login'
import { isAuthenticated } from '@/utils/auth';
import { createFileRoute } from '@tanstack/react-router'
import { router } from '../App';

export const Route = createFileRoute('/login')({
  component: RouteComponent,
  beforeLoad: async () => {
    // Check if the user is authenticated
    if (isAuthenticated()) {
        // Redirect to home if authenticated
        router.navigate({ to: '/' });
        return false; // Prevent further loading
    }
    return true; // Allow rendering the Login component
},
})

function RouteComponent() {
  return <LoginForm />
}
