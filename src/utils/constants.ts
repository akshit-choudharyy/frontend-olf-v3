export interface Task {
    task_id: number
    id: any
    parent_task: string | null
    name: string
    expected_start: string
    expected_finish: string
    actual_start: string
    actual_finish: string
    duration: number
    progress: number
    outline: number
    predecessors: Dependency[]
    successors: Dependency[]
    assigned: number[]
    vendor: number[]
    is_leaf: boolean
    note:string
    status:number
    priority:string
    documents:any
}

export interface Dependency {
    id: string
    type: "FS" | "SS" | "SF" | "FF"
    gap: number
}

export interface User {
    id: number
    name: string
    profile_url: string
}

export interface Vendor {
    id: number
    name: string
}