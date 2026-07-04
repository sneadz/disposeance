import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-accent-fill text-accent-fg shadow-accent-glow',
        ghost: 'bg-white/[0.06] border border-border-subtle text-ink font-semibold hover:bg-white/[0.09]',
        danger: 'bg-danger/10 border border-danger/30 text-danger font-semibold',
      },
      size: {
        md: 'px-4 py-3 text-sm',
        lg: 'w-full py-4 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
)
Button.displayName = 'Button'

export default Button
