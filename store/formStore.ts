import { create } from 'zustand'

interface FormData {
    // Step 1
    name: string
    email: string
    phone: string
    portfolio: string
    // Step 2
    roles: string[]
    commitment: string
    experience: number
    // Step 3
    traits: string[]
    equityInterest: string
    // Step 4
    motivation: string
    ownershipEg: string
}

interface FormStore extends FormData {
    step: number
    isSubmitting: boolean
    // Actions
    setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void
    toggleRole: (role: string) => void
    toggleTrait: (trait: string) => void
    nextStep: () => void
    prevStep: () => void
    setStep: (step: number) => void
    setSubmitting: (v: boolean) => void
    reset: () => void
}

const initialData: FormData = {
    name: '', email: '', phone: '', portfolio: '',
    roles: [], commitment: '', experience: 1,
    traits: [], equityInterest: '',
    motivation: '', ownershipEg: '',
}

export const useFormStore = create<FormStore>((set, get) => ({
    ...initialData,
    step: 1,
    isSubmitting: false,

    setField: (key, value) => set({ [key]: value }),

    toggleRole: (role) => {
        const roles = get().roles
        if (roles.includes(role)) {
            set({ roles: roles.filter((r) => r !== role) })
        } else if (roles.length < 3) {
            set({ roles: [...roles, role] })
        }
    },

    toggleTrait: (trait) => {
        const traits = get().traits
        if (traits.includes(trait)) {
            set({ traits: traits.filter((t) => t !== trait) })
        } else {
            set({ traits: [...traits, trait] })
        }
    },

    nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 5) })),
    prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) })),
    setStep: (step) => set({ step }),
    setSubmitting: (v) => set({ isSubmitting: v }),
    reset: () => set({ ...initialData, step: 1, isSubmitting: false }),
}))
