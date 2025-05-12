/*
 * CORS Anywhere as a Cloudflare Worker (modular, clean version)
 * (c) 2019 by Zibri (www.zibri.org)
 * Refactored for maintainability and scalability
 * https://github.com/Zibri/cloudflare-cors-anywhere
 */

import { whitelistUrls, blacklistUrls, whitelistOrigins } from './config.js';
import { matchesWhitelist, setupCORSHeaders } from './utils.js';

/**
 * Main event listener for fetch events
 */
addEventListener('fetch', (event) => {
	event.respondWith(handleRequest(event));
});

/**
 * Extracts the target URL from the query parameter 'url'
 * @param {URL} urlObj
 * @returns {string|null}
 */
function extractTargetUrl(urlObj) {
	const param = urlObj.searchParams.get('url');
	if (param) {
		try {
			return decodeURIComponent(param);
		} catch {
			return null;
		}
	}
	return null;
}

/**
 * Handles the incoming request and returns a Response
 * @param {FetchEvent} event
 * @returns {Promise<Response>}
 */
async function handleRequest(event) {
	const request = event.request;
	const isPreflight = request.method === 'OPTIONS';
	const url = new URL(request.url);
	const targetUrl = extractTargetUrl(url);
	const originHeader = request.headers.get('Origin');
	const connectingIp = request.headers.get('CF-Connecting-IP');

	// If no ?url= param, show info page
	if (!targetUrl) {
		let responseHeaders = new Headers();
		responseHeaders = setupCORSHeaders(
			responseHeaders,
			request,
			isPreflight
		);
		let country = false;
		let colo = false;
		if (typeof request.cf !== 'undefined') {
			country = request.cf.country || false;
			colo = request.cf.colo || false;
		}
		return new Response(
			'CorsAnywhere\n\n' +
				'Source:\nhttps://github.com/waruhachi/corsanywhere\n\n' +
				'Usage:\n' +
				url.origin +
				'/?url=<url>\n\n' +
				(originHeader ? 'Origin: ' + originHeader + '\n' : '') +
				'IP: ' +
				connectingIp +
				'\n' +
				(country ? 'Country: ' + country + '\n' : '') +
				(colo ? 'Datacenter: ' + colo + '\n' : '') +
				'\n',
			{
				status: 200,
				headers: responseHeaders,
			}
		);
	}

	// Enforce whitelistUrls if not empty
	if (whitelistUrls.length > 0 && !matchesWhitelist(targetUrl, whitelistUrls)) {
		return new Response(
			'Target URL is not allowed by whitelist.',
			{ status: 403, statusText: 'Forbidden' }
		);
	}

	// Check blacklist and origin whitelist
	if (
		!matchesWhitelist(targetUrl, blacklistUrls) &&
		matchesWhitelist(originHeader, whitelistOrigins)
	) {
		// Parse custom headers if present
		let customHeaders = request.headers.get('x-cors-headers');
		if (customHeaders) {
			try {
				customHeaders = JSON.parse(customHeaders);
			} catch {
				customHeaders = null;
			}
		}

		// Filter headers for the proxied request
		const filteredHeaders = {};
		for (const [key, value] of request.headers.entries()) {
			if (
				!/^origin/i.test(key) &&
				!/eferer/i.test(key) &&
				!/^cf-/i.test(key) &&
				!/^x-forw/i.test(key) &&
				!/^x-cors-headers/i.test(key)
			) {
				filteredHeaders[key] = value;
			}
		}
		// Add custom headers if provided
		if (customHeaders) {
			Object.entries(customHeaders).forEach(
				([k, v]) => (filteredHeaders[k] = v)
			);
		}
		// Perform the proxied fetch
		let response;
		try {
			const newRequest = new Request(request, {
				redirect: 'follow',
				headers: filteredHeaders,
			});
			response = await fetch(targetUrl, newRequest);
		} catch (err) {
			return new Response('Error fetching target URL: ' + err.message, {
				status: 502,
			});
		}
		// Prepare response headers
		let responseHeaders = new Headers(response.headers);
		const exposedHeaders = [];
		const allResponseHeaders = {};
		for (const [key, value] of response.headers.entries()) {
			exposedHeaders.push(key);
			allResponseHeaders[key] = value;
		}
		exposedHeaders.push('cors-received-headers');
		responseHeaders = setupCORSHeaders(
			responseHeaders,
			request,
			isPreflight
		);
		responseHeaders.set(
			'Access-Control-Expose-Headers',
			exposedHeaders.join(',')
		);
		responseHeaders.set(
			'cors-received-headers',
			JSON.stringify(allResponseHeaders)
		);
		// Return proxied response
		const responseBody = isPreflight ? null : await response.arrayBuffer();
		return new Response(responseBody, {
			headers: responseHeaders,
			status: isPreflight ? 200 : response.status,
			statusText: isPreflight ? 'OK' : response.statusText,
		});
	} else {
		// Forbidden response for non-whitelisted/blacklisted requests
		return new Response(
			'Create your own CORS proxy</br>\n' +
				"<a href='https://github.com/waruhachi/corsanywhere'>https://github.com/waruhachi/corsanywhere</a></br>\n" +
				'\nDonate</br>\n' +
				"<a href='https://paypal.me/Zibri/5'>https://paypal.me/Zibri/5</a>\n",
			{
				status: 403,
				statusText: 'Forbidden',
				headers: { 'Content-Type': 'text/html' },
			}
		);
	}
}
