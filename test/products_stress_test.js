import http from 'k6/http';
import { check } from 'k6'; // No sleep() in stress test
import { Counter } from 'k6/metrics';

const productsPageHits = new Counter('products_page_hits');

export const options = {
  // Stress test profile: high number of users, no think time
  stages: [
    { duration: '30s', target: 200 }, // Ramping up to 200 users
    { duration: '2m', target: 500 },  // Sustaining 500 users for 2 minutes
    { duration: '30s', target: 0 },  // Ramping down
  ],
  // Adjust thresholds for a stress test
  // We expect higher response times and might see some errors at peak
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete within 1000ms (1 second)
    http_req_failed: ['rate<0.05'],  // Less than 5% of requests should fail (more tolerant for stress test)
    products_page_hits: ['count>10000'], // Expect many hits
  },
};

export default function () {
  const baseUrl = 'http://localhost:8080/products?perPage=all';

  // Simulate various user behaviors to hit different cache keys and DB paths
  // Parameters are kept, but no sleep time
  const params = {
    perPage: Math.floor(Math.random() * 3) * 4 + 4, // 4, 8, 12
    page: Math.floor(Math.random() * 5) + 1,        // Page 1 to 5
    // Simulate searching sometimes
    searchTerm: Math.random() < 0.3 ? 'acc' : '', // 30% chance to search for 'acc'
    // Simulate category filtering sometimes
    categoryId: Math.random() < 0.2 ? Math.floor(Math.random() * 5) + 1 : '', // 20% chance to filter by category 1-5
  };

  // Build query string
  let queryString = '';
  for (const key in params) {
    if (params[key]) {
      queryString += `${key}=${params[key]}&`;
    }
  }
  queryString = queryString.slice(0, -1); // Remove trailing '&'

  const url = `${baseUrl}?${queryString}`;

  const res = http.get(url, {
    tags: { name: 'ProductsListStress' },
  });

  productsPageHits.add(1);

  check(res, {
    'is status 200': (r) => r.status === 200,
    'is json': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    'has data array': (r) => {
        try {
            const body = r.json();
            return Array.isArray(body.data);
        } catch (e) {
            return false;
        }
    },
    'cache status is HIT or MISS': (r) => r.headers['X-Cache-Status'] === 'HIT' || r.headers['X-Cache-Status'] === 'MISS',
  });

  // No sleep() here to simulate maximum possible requests
}
