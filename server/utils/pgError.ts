import {HttpError} from '~~/server/errors/HttpError'
import {UNIQUE_CONSTRAINT_FIELD_MAP} from '~~/server/constants/pgConstraints'
import {logger} from './logger'

export function formatPgError(err: any): never {
    // UNIQUE VIOLATION
    logger.error({ err: err }, 'Database error:');
    if (err?.code === '23505') {
        const field =
            UNIQUE_CONSTRAINT_FIELD_MAP[err.constraint] ?? null

        throw new HttpError(
            409,
            'DUPLICATE_RESOURCE',
            `Duplicate resource${field ? `: some ${field}` : ''} already exists`,
            {field, constraint: err.constraint}
        )
    }

    // FOREIGN KEY VIOLATION
    if (err?.code === '23503') {
        throw new HttpError(
            409,
            'FOREIGN_KEY_VIOLATION',
            'Foreign key constraint violation occurred'
        )
    }

    // NOT NULL VIOLATION
    if (err?.code === '23502') {
        throw new HttpError(
            400,
            'NOT_NULL_VIOLATION',
            `Operation violates not-null constraint on field: ${err.column}`
        )
    }

    throw new HttpError(
        500,
        'INTERNAL_SERVER_ERROR',
        'An internal server error occurred'
    )
}
