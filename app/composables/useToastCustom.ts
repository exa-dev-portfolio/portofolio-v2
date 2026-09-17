export const useToastCustom = () => {
    const toast = useToast()

    const showSuccessToast = (title: string, message: string) => {
        return toast.add(
            {
                title: title,

                description: message,
                duration: 2000,
                color: 'success'
            }
        )
    }

    const showErrorToast = (title: string, message: string) => {
        return toast.add(
            {
                title: title,

                description: message,
                duration: 4000,
                color: 'error'
            }
        )
    }

    const showInfoToast = (title: string, message: string) => {
        return toast.add(
            {
                title: title,

                description: message,
                duration: 3000,
                color: 'info'
            }
        )
    }

    const showWarningToast = (title: string, message: string) => {
        return toast.add(
            {
                title: title,

                description: message,
                duration: 3000,
                color: 'warning'
            }
        )
    }

    const showLoadingToast = (title: string, message: string) => {
        return toast.add(
            {
                title: title,

                description: message,
                duration: Infinity,
                icon: 'line-md:loading-loop',
                color: 'primary'
            }
        )
    }

    const updateToast = (
        toastId: any,
        title: string,
        message: string,
        color: "success" | "primary" | "secondary" | "info" | "warning" | "error" | "neutral" | undefined,
        duration: number,
        icon?: string
    ) => {
        const id = typeof toastId === 'object' && toastId !== null ? toastId.id : toastId
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
            icon: resolvedIcon
        })

        if (duration && isFinite(duration) && duration > 0) {
            setTimeout(() => {
                toast.remove(id)
            }, duration)
        }
    }

    const removeToast = (toastId: any) => {
        const id = typeof toastId === 'object' && toastId !== null ? toastId.id : toastId
        toast.remove(id)
    }

    const showConfirmationToast = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
        const toastId = toast.add({
            title: title,
            description: message,
            duration: 10000,
            color: 'warning',
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