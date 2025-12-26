import { Link } from '@tanstack/react-router'
import { Home, Search } from 'lucide-react'
import { Button } from './button'

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/explore">
              <Search className="w-4 h-4 mr-2" />
              Explore
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
