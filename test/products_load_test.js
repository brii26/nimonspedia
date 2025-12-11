import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const productsPageHits = new Counter('products_page_hits');

export const options = {
  // A modest load profile for initial testing
  stages: [
    { duration: '30s', target: 20 }, // Ramping up to 20 users
    { duration: '1m', target: 50 },  // Staying at 50 users
    { duration: '30s', target: 0 },  // Ramping down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
    http_req_failed: ['rate<0.01'],  // Less than 1% of requests should fail
    products_page_hits: ['count>100'], // Ensure we hit the endpoint a reasonable number of times
  },
};

export default function () {
  const baseUrl = 'http://localhost:8080/products';

  // Simulate various user behaviors to hit different cache keys and DB paths
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
    tags: { name: 'ProductsList' },
  });

  productsPageHits.add(1);

  check(res, {
    'is status 200': (r) => r.status === 200,
    'cache status is HIT or MISS': (r) => r.headers['X-Cache-Status'] === 'HIT' || r.headers['X-Cache-Status'] === 'MISS',
    'cache status is HIT': (r) => r.headers['X-Cache-Status'] === 'HIT',
    // We expect cache hits to dominate after ramp-up
  });

  sleep(Math.random() * 3 + 1); // Simulate realistic user think time between 1 and 4 seconds
}
