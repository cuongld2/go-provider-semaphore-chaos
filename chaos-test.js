import { ServiceDisruptor } from 'k6/x/disruptor';
import http from 'k6/http';
import { check } from 'k6';


export const options = {
    scenarios: {
        base: {
          executor: 'constant-arrival-rate',
          rate: 20,
          preAllocatedVUs: 5,
          maxVUs: 100,
          exec: 'requestProduct',
          startTime: '0s',
          duration: '30s',
        },
        inject: {
          executor: 'shared-iterations',
          iterations: 1,
          vus: 1,
          exec: 'injectFaults',
          startTime: '30s',
        },
        chaos: {
          executor: 'constant-arrival-rate',
          rate: 20,
          preAllocatedVUs: 5,
          maxVUs: 100,
          exec: 'requestProduct',
          startTime: '30s',
          duration: '30s',
        },
      },
      thresholds: {
        'http_req_duration{scenario:base}': [],
        'checks{scenario:base}': [],
        'http_req_duration{scenario:chaos}': [],
        'checks{scenario:chaos}': [],
    },
  };
  
  export function requestProduct(data) {
    const resp = http.get(`http://${__ENV.SVC_IP}/consuming`);
    check(resp, {

        'is status 200': (r) => r.status === 200,
    
      });
  }

  export function injectFaults(data) {
    const errorBody = '{"error":"Unexpected error","status_code":500,"status_text":"Internal Server Error"}';
  
    const fault = {
      averageDelay: 100,
      errorRate: 0.1,
      errorCode: 500,
      errorBody: errorBody,
      exclude: '/health',
    };
    const svcDisruptor = new ServiceDisruptor('my-go-app-service', 'default');
    svcDisruptor.injectHTTPFaults(fault, 30);
  }