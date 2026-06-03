export interface Document {
    document_id: number;
    title: string;
    s3url: string;
    document_type: string;
    document_size: string;
    content_type: string;
    uploaded_by: number;
    description: string;
    folder_id: number | null;
    shared: Array<{
      shared_by: number;
      shared_by_email: string;
      time: string;
      shared_to: Array<{
        user_id: number;
        user_email: string;
      }>;
    }>;
    status: string;
    parent_folder_id?: number | null;
    created_at: string;
    updated_at: string;
  }
  
  export interface Folder {
    folder_id: number;
    title: string;
    s3url?: string;
    parent_folder_id: number | null;
    uploaded_by: number;
    status: string;
    shared: Array<{
      shared_by: string;
      shared_by_email: string;
      time: string;
      shared_to: Array<{
        user_id: number;
        user_email: string;
      }>;
    }>;
    created_at: string;
    updated_at: string;
  }
  
  // Add types for organize actions
  export type OrganizeAction = {
    type: 'MOVE_DOCUMENT' | 'MOVE_FOLDER';
    sourceId: number;
    destinationId: number | null;
  };
  
  export interface MoveDestination {
    type: 'DOCUMENT' | 'FOLDER';
    folder_id?: number | null;
    parent_folder_id?: number | null;
  } 
  
  export interface Team {
    id: number;
    name: string;
    members: TeamMember[];
  }
  
  export interface TeamMember{
    id:number;
    name:string;
    email:string;
    Department?:string;
    role?:string;
  }