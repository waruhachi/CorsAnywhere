// Utility functions for CORS Anywhere Worker

/**
 * Checks if a given URI or origin matches any pattern in the provided list.
 * @param {string|null} uri - The URI or origin to check.
 * @param {string[]} listing - Array of regex patterns as strings.
 * @returns {boolean}
 */
export function matchesWhitelist(uri, listing) {
	if (typeof uri === 'string') {
		return listing.some((pattern) => uri.match(pattern) !== null);
	}
	// Accept null origins by default; change to false to reject
	return true;
}

/**
 * Sets up CORS headers for the response.
 * @param {Headers} headers - The Headers object to modify.
 * @param {Request} request - The incoming request.
 * @param {boolean} isPreflightRequest - Whether the request is a preflight OPTIONS request.
 * @returns {Headers}
 */
export function setupCORSHeaders(headers, request, isPreflightRequest) {
	headers.set('Access-Control-Allow-Origin', request.headers.get('Origin'));
	if (isPreflightRequest) {
		headers.set(
			'Access-Control-Allow-Methods',
			request.headers.get('access-control-request-method')
		);
		const requestedHeaders = request.headers.get(
			'access-control-request-headers'
		);
		if (requestedHeaders) {
			headers.set('Access-Control-Allow-Headers', requestedHeaders);
		}
		headers.delete('X-Content-Type-Options');
	}
	return headers;
}
