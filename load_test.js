import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, // Ramp up to 20 users
    { duration: '20s', target: 20 }, // Stay at 20 users for 20s
    { duration: '10s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_failed': ['rate<0.01'],   // Error rate should be less than 1%
  },
};

export default function () {
  group('Backend API Tests', function () {
    const res = http.get('http://127.0.0.1:5000/api/camps');
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time is acceptable': (r) => r.timings.duration < 500,
    });
  });

  group('Frontend App Tests', function () {
    const res = http.get('http://127.0.0.1:5173/');
    check(res, {
      'status is 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}
