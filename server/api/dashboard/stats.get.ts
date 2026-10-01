import {withTransaction} from "~~/server/db/postgres";
import {sendSuccess} from "~~/server/utils/response";
import {withAuth} from "~~/server/utils/withAuth";
import * as projectRepository from "~~/server/repositories/project.repository";
import * as skillRepository from "~~/server/repositories/skill.repository";
import * as journeyRepository from "~~/server/repositories/journey.repository";
import * as messageRepository from "~~/server/repositories/message.repository";

export default withAuth(async (event) => {

    return withTransaction(
        async (client) => {
            // Get all projects
            const projects = await projectRepository.getAllProjects(client)
            const totalProjects = projects.length
            const publishedProjects = projects.filter((p: any) => p.status === 'published' || p.status === true).length
            const draftProjects = projects.filter((p: any) => p.status === 'draft' || p.status === false).length
            const archivedProjects = projects.filter((p: any) => p.status === 'archived').length

            // Get all skills
            const skills = await skillRepository.getAllSkills(client)
            const totalSkills = skills.length

            // Get all journeys
            const journeys = await journeyRepository.getAllJourneys(client)
            const totalJourneys = journeys.length
            const currentJourneys = journeys.filter((j: any) => j.is_current === true).length

            // Get unread messages count
            const messages = await messageRepository.getAllMessages(client)
            const unreadMessages = messages.filter((m: any) => m.status === 'unread').length

            const stats = {
                projects: {
                    total: totalProjects,
                    published: publishedProjects,
                    draft: draftProjects,
                    archived: archivedProjects
                },
                skills: {
                    total: totalSkills
                },
                journeys: {
                    total: totalJourneys,
                    current: currentJourneys
                },
                messages: {
                    unread: unreadMessages
                }
            }

            return sendSuccess(
                event,
                stats,
                "Dashboard stats retrieved successfully",
                "dashboard_stats_retrieved"
            )
        }
    )
})

