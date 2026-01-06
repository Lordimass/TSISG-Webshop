/**
 * Thrown from functions implemented by Netlify functions to signify that something has gone wrong.
 * This should be caught by the base Netlify function and a suitable `Response` returned based on this.
 * @see @shared/types/types.ts/StatusedError
 */
export class StatusedError extends Error {
    message: string;
    status: number;

    constructor(message: string, status?: number) {
        super(message)
        this.message = message;
        this.status = status || 500;
    }
}