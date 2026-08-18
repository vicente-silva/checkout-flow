import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns an ok status with a timestamp', () => {
    const controller = new HealthController();
    const response = controller.check();

    expect(response.status).toBe('ok');
    expect(typeof response.timestamp).toBe('string');
  });
});
