import * as repository from "~~/server/repositories/journey.repository";
import {H3Event} from "h3";
import {CreateJourneyInput, UpdateJourneyInput} from "~~/server/model/journey.model";
import {withTransaction} from "~~/server/db/postgres";
import {HttpError} from "~~/server/errors/HttpError";
import {get, set, del} from "~~/server/db/redis";
import {sendSuccess} from "~~/server/utils/response";

export const createJourney = async (event: H3Event, body: CreateJourneyInput) => {
    return withTransaction(
        async (client) => {
            const journeyId = await repository.createJourney(client, body);
            if (!journeyId) {
                throw new HttpError(500, 'JOURNEY_CREATION_FAILED', 'Failed to create journey');
            }

            if (body.id_skills && body.id_skills.length > 0) {
                const ok = await repository.linkSkillToJourney(client, journeyId, body.id_skills)
                if (!ok) {
                    throw new HttpError(500, 'JOURNEY_SKILL_RELATION_CREATION_FAILED', 'Failed to create journey-skill relation');
                }
            }

            await set('journeys:all', JSON.stringify(await repository.getAllJourneys(client))); // Update cache with new journeys list

            return sendSuccess(
                event,
                {journey_id: journeyId},
                "Journey created successfully",
                "journey_created",
                201
            )
        }
    )
}

export const getJourneysNoPagination = async (event: H3Event) => {
    return withTransaction(
        async (client) => {
            const cachedJourneys = await get('journeys:all')
            if (cachedJourneys) {
                const journeys = JSON.parse(cachedJourneys);
                return sendSuccess(event, {data: journeys}, "Journeys retrieved successfully", "journeys_retrieved");
            }

            const journeys = await repository.getAllJourneys(client)
            await set('journeys:all', JSON.stringify(journeys)); // Cache the journeys list

            return sendSuccess(event, {data: journeys}, "Journeys retrieved successfully", "journeys_retrieved");
        }
    )
}

export const getJourneysByCursor = async (event: H3Event, limit: number, cursor?: number, search?: string) => {
    return withTransaction(
        async (client) => {
            const {journeys, has_next} = await repository.getJourneysByCursor(client, limit, cursor, search);
            return sendSuccess(event, {
                data: journeys,
                has_next: has_next
            }, "Journeys retrieved successfully", "journeys_retrieved");
        }
    )
}

export const getJourneyById = async (event: H3Event, id: number) => {
    return withTransaction(
        async (client) => {
            const journey = await repository.getJourneyById(client, id);
            if (!journey) {
                throw new HttpError(404, 'JOURNEY_NOT_FOUND', 'Journey not found');
            }
            return sendSuccess(event, journey, "Journey retrieved successfully", "journey_retrieved");
        }
    )
}

export const updateJourney = async (event: H3Event, data: UpdateJourneyInput) => {
    return withTransaction(
        async (client) => {
            const journey = await repository.getJourneyById(client, data.id);
            if (!journey) {
                throw new HttpError(404, 'JOURNEY_NOT_FOUND', 'Journey not found');
            }

            const ok = await repository.updateJourney(client, data);
            if (!ok) {
                throw new HttpError(500, 'JOURNEY_UPDATE_FAILED', 'Failed to update journey');
            }

            if (data.id_skills && data.id_skills.length > 0) {
                const okRelation = await repository.linkSkillToJourney(client, data.id, data.id_skills);
                if (!okRelation) {
                    throw new HttpError(500, 'JOURNEY_SKILL_RELATION_UPDATE_FAILED', 'Failed to update journey-skill relation');
                }
            } else {
                // Clear all skill associations if empty
                await repository.linkSkillToJourney(client, data.id, [])
            }

            await set('journeys:all', JSON.stringify(await repository.getAllJourneys(client))); // Update cache with new journeys list

            return sendSuccess(
                event,
                {journey_id: data.id},
                "Journey updated successfully",
                "journey_updated",
                200
            )
        }
    )
}

export const deleteJourney = async (event: H3Event, id: number) => {
    return withTransaction(
        async (client) => {
            const journey = await repository.getJourneyById(client, id);
            if (!journey) {
                throw new HttpError(404, 'JOURNEY_NOT_FOUND', 'Journey not found');
            }

            const ok = await repository.deleteJourney(client, id);
            if (!ok) {
                throw new HttpError(500, 'JOURNEY_DELETION_FAILED', 'Failed to delete journey');
            }

            await set('journeys:all', JSON.stringify(await repository.getAllJourneys(client))); // Update cache with new journeys list

            return sendSuccess(
                event,
                {journey_id: id},
                "Journey deleted successfully",
                "journey_deleted",
                200
            )
        }
    )
}

