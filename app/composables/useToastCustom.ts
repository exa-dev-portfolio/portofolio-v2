export const useToastCustom = () => {
    const toast = useToast()

    const showSuccessToast = (title: string, message: string, duration = 3000) => {
        const t = toast.add(
            {
                title: title,
                description: message,
                duration: duration,
                color: 'success',
                close: true
            }
        )
        const id = t?.id
        if (id && duration && isFinite(duration) && duration > 0) {
            setTimeout(() => {
                toast.remove(id)
            }, duration)
        }
        return t
    }

    const showErrorToast = (title: string, message: string, duration = 5000) => {
        const t = toast.add(
            {
                title: title,
                description: message,
                duration: duration,
                color: 'error',
                close: true
            }
        )
        const id = t?.id
        if (id && duration && isFinite(duration) && duration > 0) {
            setTimeout(() => {
                toast.remove(id)
            }, duration)
        }
        return t
    }

    const showInfoToast = (title: string, message: string, duration = 3000) => {
        const t = toast.add(
            {
                title: title,
                description: message,
                duration: duration,
                color: 'info',
                close: true
            }
        )
        const id = t?.id
        if (id && duration && isFinite(duration) && duration > 0) {
            setTimeout(() => {
                toast.remove(id)
            }, duration)
        }
        return t
    }

    const showWarningToast = (title: string, message: string, duration = 3500) => {
        const t = toast.add(
            {
                title: title,
                description: message,
                duration: duration,
                color: 'warning',
                close: true
            }
        )
        const id = t?.id
        if (id && duration && isFinite(duration) && duration > 0) {
            setTimeout(() => {
                toast.remove(id)
            }, duration)
        }
        return t
    }

    const showLoadingToast = (title: string, message: string) => {
        return toast.add(
            {
                title: title,
                description: message,
                duration: Infinity,
                icon: 'line-md:loading-loop',
                color: 'primary',
                close: true
            }
        )
    }

    const updateToast = (
        toastId: any,
        title: string,
        message: string,
        color: "success" | "primary" | "secondary" | "info" | "warning" | "error" | "neutral" | undefined,
        duration: number = 4000,
        icon?: string
    ) => {
        const id = typeof toastId === 'object' && toastId !== null ? toastId.id : toastId
        if (!id) return

        const resolvedIcon = icon ?? (
            color === 'success' ? 'carbon:checkmark-filled' :
            color === 'error' ? 'carbon:error-filled' :
            color === 'warning' ? 'carbon:warning-filled' :
            color === 'info' ? 'carbon:information-filled' :
            undefined
        )

        toast.update(id, {
            title: title,
            description: message,
            color: color,
            duration: duration,
            icon: resolvedIcon,
            close: true
        })

        if (duration && isFinite(duration) && duration > 0) {
            setTimeout(() => {
                toast.remove(id)
            }, duration)
        }
    }

    const removeToast = (toastId: any) => {
        const id = typeof toastId === 'object' && toastId !== null ? toastId.id : toastId
        if (id) {
            toast.remove(id)
        }
    }

    const showConfirmationToast = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
        const toastId = toast.add({
            title: title,
            description: message,
            duration: 10000,
            color: 'warning',
            close: true,
            actions: [
                {
                    label: 'Confirm',
                    color: 'success',
                    onClick: () => {
                        onConfirm()
                        toast.remove(toastId.id)
                    }
                },
                {
                    label: 'Cancel',
                    color: 'error',
                    onClick: () => {
                        if (onCancel) {
                            onCancel()
                        }
                        toast.remove(toastId.id)
                    }
                }
            ]
        })
        if (toastId?.id) {
            setTimeout(() => {
                toast.remove(toastId.id)
            }, 10000)
        }
    }

    return {
        showSuccessToast,
        showErrorToast,
        showLoadingToast,
        showInfoToast,
        showConfirmationToast,
        showWarningToast,
        updateToast,
        removeToast
    }
}