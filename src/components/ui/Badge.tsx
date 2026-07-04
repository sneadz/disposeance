import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export const badgeVariants = cva(
  'inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border',
  {
    variants: {
      status: {
        pending: 'bg-accent-soft text-accent border-accent/30',
        closed: 'bg-success/15 text-success border-success/30',
      },
    },
    defaultVariants: { status: 'pending' },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, status, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ status }), className)} {...props} />
  )
)
Badge.displayName = 'Badge'

export default Badge
