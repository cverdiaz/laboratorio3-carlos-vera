import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const originalAmbiente = process.env.AMBIENTE;
  const originalApiKey = process.env.API_KEY;

  beforeEach(async () => {
    process.env.AMBIENTE = 'test';
    process.env.API_KEY = 'test-api-key';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World! - CI/CD actualizado');
  });

  it('/lab (GET)', () => {
    return request(app.getHttpServer()).get('/lab').expect(200).expect({
      AMBIENTE: 'test',
      API_KEY: 'test-api-key',
    });
  });

  afterEach(async () => {
    await app.close();

    if (originalAmbiente === undefined) {
      delete process.env.AMBIENTE;
    } else {
      process.env.AMBIENTE = originalAmbiente;
    }

    if (originalApiKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = originalApiKey;
    }
  });
});
