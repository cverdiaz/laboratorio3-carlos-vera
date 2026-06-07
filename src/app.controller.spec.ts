import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return "Hello World! - CI/CD actualizado"', () => {
      expect(appController.getHello()).toBe('Hello World! - CI/CD actualizado');
    });
  });

  describe('lab', () => {
    it('should return environment variables', () => {
      jest.spyOn(appService, 'getLabInfo').mockReturnValue({
        AMBIENTE: 'desarrollo',
        API_KEY: 'secret-key',
      });

      expect(appController.getLab()).toEqual({
        AMBIENTE: 'desarrollo',
        API_KEY: 'secret-key',
      });
    });
  });
});
