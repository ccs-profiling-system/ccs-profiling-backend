/**
 * Upload Module DTOs
 * Data Transfer Objects for file upload management
 * 
 * Requirements: 20.2
 */

/**
 * UploadResponseDTO - Output returned to clients
 */
export interface UploadResponseDTO {
  id: string;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  entity_type: string;
  entity_id: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * UploadMetadataDTO - Metadata for file uploads
 */
export interface UploadMetadataDTO {
  entity_type: 'student' | 'faculty' | 'research' | 'event';
  entity_id: string;
}

/**
 * UploadListResponseDTO - Paginated list output
 */
export interface UploadListResponseDTO {
  data: UploadResponseDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
