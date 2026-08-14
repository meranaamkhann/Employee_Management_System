package com.hrplatform.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.hrplatform.common.ApiException;
import com.hrplatform.common.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryStorageService implements StorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB

    private final Cloudinary cloudinary;

    @Override
    public UploadResult upload(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest(ErrorCode.VALIDATION_FAILED, "No file was provided.");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw ApiException.badRequest(ErrorCode.INVALID_FILE_TYPE,
                    "Only JPEG, PNG, or WEBP images are allowed.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw ApiException.badRequest(ErrorCode.FILE_TOO_LARGE,
                    "Image must be smaller than 5MB.");
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image",
                    "transformation", ObjectUtils.asMap(
                            "width", 400, "height", 400, "crop", "fill", "gravity", "face"
                    )
            ));
            return new UploadResult((String) result.get("secure_url"), (String) result.get("public_id"));
        } catch (IOException e) {
            log.error("Cloudinary upload failed", e);
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    ErrorCode.INTERNAL_ERROR, "Photo upload failed. Please try again.");
        }
    }

    @Override
    public void delete(String publicId) {
        if (publicId == null || publicId.isBlank()) return;
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            // Non-fatal: an orphaned Cloudinary asset costs nothing to leave behind,
            // but we shouldn't fail the caller's request (e.g. employee delete) over it.
            log.warn("Failed to delete Cloudinary asset {}: {}", publicId, e.getMessage());
        }
    }
}