/**
 * Uploads Module Integration Tests
 * Tests for file upload functionality
 * 
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../db';
import { uploads } from '../../db/schema';
import { UploadRepository } from './repositories/upload.repository';
import { UploadService } from './services/upload.service';
import { generateUUIDv7 } from '../../shared/utils/uuid';
import { ValidationError } from '../../shared/errors';

describe('Uploads Module', () => {
  let uploadRepository: UploadRepository;
  let uploadService: UploadService;
  const testUploadIds: string[] = [];

  beforeAll(() => {
    uploadRepository = new UploadRepository(db);
    uploadService = new UploadService(uploadRepository);
  });

  afterAll(async () => {
    // Clean up test uploads
    for (const id of testUploadIds) {
      try {
        await uploadRepository.delete(id);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  });

  describe('UploadRepository', () => {
    it('should create an upload record', async () => {
      const id = generateUUIDv7();
      const upload = await uploadRepository.create({
        id,
        file_name: 'test_file.pdf',
        original_name: 'test.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        storage_path: 'student/2024/01/test_file.pdf',
        entity_type: 'student',
        entity_id: generateUUIDv7(),
      });

      testUploadIds.push(id);

      expect(upload).toBeDefined();
      expect(upload.id).toBe(id);
      expect(upload.file_name).toBe('test_file.pdf');
      expect(upload.original_name).toBe('test.pdf');
    });

    it('should find upload by ID', async () => {
      const id = generateUUIDv7();
      await uploadRepository.create({
        id,
        file_name: 'test_file_2.pdf',
        original_name: 'test2.pdf',
        file_type: 'application/pdf',
        file_size: 2048,
        storage_path: 'student/2024/01/test_file_2.pdf',
        entity_type: 'student',
        entity_id: generateUUIDv7(),
      });

      testUploadIds.push(id);

      const upload = await uploadRepository.findById(id);
      expect(upload).toBeDefined();
      expect(upload?.id).toBe(id);
    });

    it('should find uploads by entity ID', async () => {
      const entityId = generateUUIDv7();
      const id1 = generateUUIDv7();
      const id2 = generateUUIDv7();

      await uploadRepository.create({
        id: id1,
        file_name: 'test_file_3.pdf',
        original_name: 'test3.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        storage_path: 'student/2024/01/test_file_3.pdf',
        entity_type: 'student',
        entity_id: entityId,
      });

      await uploadRepository.create({
        id: id2,
        file_name: 'test_file_4.pdf',
        original_name: 'test4.pdf',
        file_type: 'application/pdf',
        file_size: 2048,
        storage_path: 'student/2024/01/test_file_4.pdf',
        entity_type: 'student',
        entity_id: entityId,
      });

      testUploadIds.push(id1, id2);

      const uploads = await uploadRepository.findByEntityId('student', entityId);
      expect(uploads).toHaveLength(2);
      expect(uploads[0].entity_id).toBe(entityId);
      expect(uploads[1].entity_id).toBe(entityId);
    });

    it('should delete upload by ID', async () => {
      const id = generateUUIDv7();
      await uploadRepository.create({
        id,
        file_name: 'test_file_5.pdf',
        original_name: 'test5.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        storage_path: 'student/2024/01/test_file_5.pdf',
        entity_type: 'student',
        entity_id: generateUUIDv7(),
      });

      await uploadRepository.delete(id);

      const upload = await uploadRepository.findById(id);
      expect(upload).toBeNull();
    });
  });

  describe('UploadService - Validation', () => {
    it('should reject files with invalid MIME type', async () => {
      const file = {
        originalname: 'test.exe',
        mimetype: 'application/x-msdownload',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const metadata = {
        entity_type: 'student' as const,
        entity_id: generateUUIDv7(),
      };

      await expect(
        uploadService.uploadFile(file, metadata)
      ).rejects.toThrow(ValidationError);
    });

    it('should reject files exceeding size limit', async () => {
      const file = {
        originalname: 'large.pdf',
        mimetype: 'application/pdf',
        size: 11 * 1024 * 1024, // 11MB (exceeds 10MB limit)
        buffer: Buffer.alloc(11 * 1024 * 1024),
      } as Express.Multer.File;

      const metadata = {
        entity_type: 'student' as const,
        entity_id: generateUUIDv7(),
      };

      await expect(
        uploadService.uploadFile(file, metadata)
      ).rejects.toThrow(ValidationError);
    });
  });
});
