package com.hrplatform.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Abstraction over "where uploaded files actually live". Currently backed
 * by Cloudinary (see CloudinaryStorageService) because Render's free-tier
 * filesystem is ephemeral — anything written to local disk is lost on the
 * next deploy/restart. Swapping to S3, local disk (for a non-ephemeral
 * host), or any other backend later only means adding a new implementation
 * of this interface, not touching EmployeeService or the controller.
 */
public interface StorageService {

    UploadResult upload(MultipartFile file, String folder);

    void delete(String publicId);

    record UploadResult(String url, String publicId) {}
}