(global => {
	'use strict'

	const parseHeaders = raw => {
		const headers = new Map();
		if (!raw) return {
			get: () => null,
			has: () => false,
			entries: () => [],
			forEach: () => {}
		};

		raw.trim().split(/[\r\n]+/).forEach(line => {
			const parts = line.split(': ');
			const key = parts.shift().toLowerCase();
			const value = parts.join(': ');
			if (!headers.has(key)) headers.set(key, value);
			else headers.set(key, headers.get(key) + ', ' + value);
		});

    return {
			get: k => headers.get(k.toLowerCase()) ?? null,
			has: k => headers.has(k.toLowerCase()),
			entries: () => Array.from(headers.entries()),
			forEach: cb => headers.forEach((v, k) => cb(v, k))
		}; 
	}

	const makeResponse = xhr => {
		const headers = parseHeaders(xhr.getAllResponseHeaders());
		const status = xhr.status === 0 ? 200 : xhr.status;

		const ok = status >= 200 && status < 300;
		const statusText = xhr.statusText || '';

		return {
			ok,
			status,
			statusText,
			headers,
			url: xhr.responseURL || '',
			text: () => Promise.resolve(xhr.responseText),
			json: () => { try {
				return Promise.resolve(JSON.parse(xhr.responseText || '{}'));
			} catch (e) {
				return Promise.reject(e);
			}},
			blob: () => Promise.resolve(new Blob([xhr.response])),
			arrayBuffer: () => Promise.resolve(xhr.response instanceof ArrayBuffer ? 
				xhr.response : (new TextEncoder().encode(xhr.responseText)).buffer)
		};
	}

	const fetchXhr = (input, init = {}) => new Promise((resolve, reject) => {
		try {
			const method = (init.method || 'GET').toUpperCase();
			let url = typeof input === 'string' ? input : String(input);

			const xhr = new XMLHttpRequest();

			if (init.signal) {
        if (init.signal.aborted) {
          return reject(new DOMException('Aborted', 'AbortError'));
        }
        const onAbort = () => {
          xhr.abort();
          reject(new DOMException('Aborted', 'AbortError'));
        };
        init.signal.addEventListener('abort', onAbort, { once: true });
        xhr.onloadend = () => {
          init.signal.removeEventListener('abort', onAbort);
        };
			}

			if (method === 'GET' 
				&& init.body 
				&& !(init.body instanceof FormData) 
				&& !(init.body instanceof URLSearchParams) 
				&& typeof init.body === 'object') {
				const qs = new URLSearchParams(init.body).toString();
				url += (url.includes('?') ? '&' : '?') + qs;
			}

			xhr.open(method, url, true);

			if (init.responseType) {
				try { xhr.responseType = init.responseType; } catch (e) {}
			}
			if (init.timeout) xhr.timeout = init.timeout;

			const headers = init.headers || {};
			const isForm = init.body instanceof FormData;

			if (!isForm 
				&& init.body 
				&& typeof init.body === 'object' 
				&& !(init.body instanceof URLSearchParams) 
				&& init.json !== false 
				&& !headers['Content-Type'] 
				&& !headers['content-type']) {
				headers['Content-Type'] = 'application/json; charset=UTF-8';
			}
			
			Object.keys(headers).forEach(h => {
				try { xhr.setRequestHeader(h, headers[h]); } catch (e) {}
			});

			// Event Handlers
			xhr.onreadystatechange = () => {
				if (xhr.readyState !== 4) return;
				resolve(makeResponse(xhr));
			};
			xhr.onerror = () => reject(new TypeError('Network request failed'));
			xhr.ontimeout = () => reject(new TypeError('Network request timed out'));

			//  Send Request
			if (!init.body || method === 'GET' || method === 'HEAD') {
        xhr.send();
      } else if (init.body instanceof FormData) {
        xhr.send(init.body);
      } else if (init.body instanceof URLSearchParams) {
			if (!headers['Content-Type'] && !headers['content-type']) {
				try {
					xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
				} catch (e) {}
			}
        xhr.send(init.body.toString());
      } else if (typeof init.body === 'string') {
        xhr.send(init.body);
      } else if (init.json === true 
				|| (typeof init.body === 'object' && !(init.body instanceof ArrayBuffer))) {
        // Jadiin JSON
        try {
          xhr.send(JSON.stringify(init.body));
        } catch (e) {
          reject(e);
        }

      } else if (init.body instanceof ArrayBuffer || init.body instanceof Blob) {
        xhr.send(init.body);
      } else {
        // Fallback (anggep jadi form-urlencoded)
        const params = new URLSearchParams();
        Object.keys(init.body || {}).forEach(k => params.append(k, init.body[k]));
        xhr.send(params.toString());
      }
			
		} catch (err) {
			reject(err);
		}
	});
	global.fetchXhr = fetchXhr;
})(window);