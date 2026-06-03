import { cn } from '@/lib/utils'

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent',
        className
      )}
      aria-label="Carregando"
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex h-full min-h-64 items-center justify-center">
      <LoadingSpinner className="h-8 w-8 text-primary" />
    </div>
  )
}
