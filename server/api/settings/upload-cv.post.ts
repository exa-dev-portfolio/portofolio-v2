import {HttpError} from "~~/server/errors/HttpError"
import {withAuth} from "~~/server/utils/withAuth"
import {getMinioClient} from "~~/server/lib/minio"
import {getUserSettings, updateUserCV} from "~~/server/repositories/settings.repository";
import {withTransaction} from "~~/server/db/postgres";
import {del, set} from "~~/server/db/redis";

export default withAuth(async (event) => {
    return await withTransaction(
        async (client) => {


            try {
                // Get the uploaded file
                const files = await readMultipartFormData(event)
                if (!files || files.length === 0) {
                    throw new HttpError(400, 'NO_FILE', 'No file uploaded')
                }

                const fileData = files[0]
                if (!fileData.filename || !fileData.data) {
                    throw new HttpError(400, 'INVALID_FILE', 'Invalid file data')
                }

                // Validate file type (PDF only)
                const filename = fileData.filename.toLowerCase()
                if (!filename.endsWith('.pdf')) {
                    throw new HttpError(400, 'INVALID_FILE_TYPE', 'Only PDF files are allowed')
                }

                // Validate file size (max 5MB)
                const maxSize = 5 * 1024 * 1024 // 5MB
                if (fileData.data.length > maxSize) {
                    throw new HttpError(413, 'FILE_TOO_LARGE', 'File size must be less than 5MB')
                }

                // Upload to MinIO
                const minio = getMinioClient()
                const bucketName = 'project'
                const key = `portofolio/resumes/${filename}-${crypto.randomUUID()}-${Date.now()}.pdf`

                try {
                    const currentUser = await getUserSettings(client)
                    const url = minio.getPublicUrl(bucketName, key)

                    const ok = await updateUserCV(
                        client,
                        url
                    )

                    if (!ok) {
                        throw new HttpError(500, 'DB_UPDATE_FAILED', 'Failed to update user CV URL in database')
                    }

                    await minio.uploadFile(
                        bucketName,
                        key,
                        fileData.data,
                        'application/pdf'
                    )

                    // Update Redis cache with updated user settings
                    const updatedSettings = await getUserSettings(client)
                    if (updatedSettings) {
                        await set(`user_settings`, JSON.stringify(updatedSettings))
                    } else {
                        await del(`user_settings`)
                    }

                    // Clean up previous CV from storage if exists
                    if (currentUser?.cv_url && currentUser.cv_url !== url) {
                        try {
                            const oldUrl = new URL(currentUser.cv_url)
                            const prefix = `/${bucketName}/`
                            if (oldUrl.pathname.startsWith(prefix)) {
                                const oldKey = oldUrl.pathname.substring(prefix.length)
                                await minio.deleteFile(bucketName, oldKey)
                            }
                        } catch (cleanupError) {
                            logger.warn({ err: cleanupError }, 'Failed to delete previous CV from storage:')
                        }
                    }

                    return sendSuccess(event, {url}, 'CV uploaded successfully', 'cv_uploaded')
                } catch (minioError) {
                    logger.error({ err: minioError }, 'MinIO upload error:')
                    throw new HttpError(500, 'UPLOAD_ERROR', 'Failed to upload file to storage')
                }
            } catch (error) {
                if (error instanceof HttpError) {
                    throw error
                }
                logger.error({ err: error }, 'CV upload error:')
                throw new HttpError(500, 'UPLOAD_ERROR', 'Failed to upload CV')
            }
        }
    )
})

