import * as repository from "~~/server/repositories/settings.repository";
import {H3Event} from "h3";
import {BindAppleInput, UpdateProfileSettingsInput, UpdateSocialLinksInput} from "~~/server/model/settings.model";
import {withTransaction} from "~~/server/db/postgres";
import {HttpError} from "~~/server/errors/HttpError";
import {get, set} from "~~/server/db/redis";
import jwt from "jsonwebtoken";
import {getUserByAppleId, linkAppleId, unlinkAppleId} from "~~/server/repositories/user.repository";
import {sendSuccess} from "~~/server/utils/response";

export const getUserSettings = async (event: H3Event,) => {
    return withTransaction(
        async (client) => {

            const cacheSetting = await get(`user_settings`);

            if (cacheSetting) {
                return sendSuccess(event, JSON.parse(cacheSetting), "User settings retrieved successfully", "user_settings_retrieved");
            }

            const settings = await repository.getUserSettings(client,);
            if (!settings) {
                throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
            }
            await set(`user_settings`, JSON.stringify(settings));
            return sendSuccess(event, settings, "User settings retrieved successfully", "user_settings_retrieved");
        }
    )
}

export const updateProfileSettings = async (event: H3Event, data: UpdateProfileSettingsInput) => {
    return withTransaction(
        async (client) => {
            const user = await repository.getUserSettings(client);
            if (!user) {
                throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
            }

            const ok = await repository.updateProfileSettings(client, data);
            if (!ok) {
                throw new HttpError(500, 'PROFILE_UPDATE_FAILED', 'Failed to update profile settings');
            }

            const updatedSettings = await repository.getUserSettings(client,);

            await set(`user_settings`, JSON.stringify(updatedSettings));

            return sendSuccess(
                event,
                updatedSettings,
                "Profile settings updated successfully",
                "profile_updated",
                200
            )
        }
    )
}

export const updateSocialLinks = async (event: H3Event, data: UpdateSocialLinksInput) => {
    return withTransaction(
        async (client) => {
            const user = await repository.getUserSettings(client);
            if (!user) {
                throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
            }

            const ok = await repository.updateSocialLinks(client, data);
            if (!ok) {
                throw new HttpError(500, 'SOCIAL_LINKS_UPDATE_FAILED', 'Failed to update social links');
            }

            const updatedSettings = await repository.getUserSettings(client);

            await set(`user_settings`, JSON.stringify(updatedSettings));

            return sendSuccess(
                event,
                updatedSettings,
                "Social links updated successfully",
                "social_links_updated",
                200
            )
        }
    )
}

export const bindAppleToUser = async (event: H3Event, data: BindAppleInput) => {
    const userId = event.context.user?.id;
    if (!userId) {
        throw new HttpError(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    const decoded = jwt.decode(data.identityToken) as {
        sub?: string;
        email?: string;
    } | null;

    if (!decoded || !decoded.sub) {
        throw new HttpError(400, 'INVALID_APPLE_TOKEN', 'Failed to decode Apple identity token');
    }

    const appleUserId = decoded.sub;
    const resolvedEmail = decoded.email || data.email || null;

    return withTransaction(
        async (client) => {
            // Check if this Apple ID is already linked to another user
            const existingWithApple = await getUserByAppleId(client, appleUserId);
            if (existingWithApple && existingWithApple.id !== userId) {
                throw new HttpError(400, 'APPLE_ALREADY_LINKED', 'Akun Apple ini sudah terhubung ke akun lain.');
            }

            const ok = await linkAppleId(client, userId, appleUserId, resolvedEmail);
            if (!ok) {
                throw new HttpError(500, 'BIND_APPLE_FAILED', 'Gagal menghubungkan akun Apple.');
            }

            const updatedSettings = await repository.getUserSettings(client);
            if (updatedSettings) {
                await set(`user_settings`, JSON.stringify(updatedSettings));
            }

            return sendSuccess(
                event,
                updatedSettings,
                "Apple ID linked successfully",
                "apple_id_linked",
                200
            );
        }
    );
}

export const unbindAppleFromUser = async (event: H3Event) => {
    const userId = event.context.user?.id;
    if (!userId) {
        throw new HttpError(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    return withTransaction(
        async (client) => {
            const ok = await unlinkAppleId(client, userId);
            if (!ok) {
                throw new HttpError(500, 'UNBIND_APPLE_FAILED', 'Gagal memutuskan tautan akun Apple.');
            }

            const updatedSettings = await repository.getUserSettings(client);
            if (updatedSettings) {
                await set(`user_settings`, JSON.stringify(updatedSettings));
            }

            return sendSuccess(
                event,
                updatedSettings,
                "Apple ID unlinked successfully",
                "apple_id_unlinked",
                200
            );
        }
    );
}


