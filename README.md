# CorsAnywhere

A simple, scalable CORS proxy running on [Cloudflare Workers](https://workers.cloudflare.com/).  
Easily bypass CORS restrictions for client-side web applications by proxying requests through this worker.

---

## Features

-   Proxy any HTTP request and bypass CORS restrictions
-   Supports all HTTP methods (GET, POST, etc.)
-   Allows sending and receiving forbidden headers (e.g., `set-cookie`)
-   Returns all received headers in a special response header

---

## Prerequisites

-   [Bun](https://bun.sh/) (for local development)
-   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
-   [Cloudflare account](https://dash.cloudflare.com/)

---

## Deployment

### Automatic (One-Click Deploy)

You can deploy your own instance to Cloudflare Workers with a single click:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/waruhachi/corsanywhere)

This will guide you through the process of setting up the worker in your Cloudflare account automatically.

---

### Manual Method

1. Install Wrangler CLI:

    ```bash
    bun install -g wrangler
    ```

2. Authenticate with Cloudflare:

    ```bash
    wrangler login
    ```

3. Deploy the worker:
    ```bash
    wrangler deploy
    ```

---

## Usage

To proxy a request, use the worker URL with the target URL as a query parameter:

```javascript
fetch('https://<your-worker-subdomain>.workers.dev/?https://httpbin.org/post', {
	method: 'POST',
	headers: {
		'x-foo': 'bar',
		'x-bar': 'foo',
		'x-cors-headers': JSON.stringify({
			// Allows sending forbidden headers
			cookie: 'x=123',
		}),
	},
})
	.then((res) => {
		// Read all received headers (including forbidden ones)
		const headers = JSON.parse(res.headers.get('cors-received-headers'));
		console.log(headers);
		return res.json();
	})
	.then(console.log);
```

**Note:**  
All received headers are returned in the `cors-received-headers` response header as a JSON string.

---

## Configuration

-   Customize your worker by editing `wrangler.toml` and `index.js`.
-   For advanced configuration, see the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/).

---

## Security & Limitations

-   This proxy is public by default. Consider adding authentication or rate limiting for production use.
-   Some headers or methods may still be restricted by Cloudflare or browser policies.

---

## Contributing

Contributions are welcome! Please open issues or submit pull requests.

---

## License

[MIT](LICENSE)
