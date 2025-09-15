import { Controller, Get, Logger, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('programmes')
export class AppController {
  constructor(private readonly programmeService: AppService) {}

  @Get()
  getAll() {
    return this.programmeService.getAll();
  }

  @Get(':type')
  getByType(@Param('type') type: string) {
    Logger.log(this.programmeService.getByType(type));
    return this.programmeService.getByType(type);
  }

  @Get(':type/:discipline')
  getByDiscipline(
    @Param('type') type: string,
    @Param('discipline') discipline: string,
  ) {
    return this.programmeService.getByDiscipline(type, discipline);
  }

  @Get('by-name/:name')
  getByName(@Param('name') name: string) {
    return this.programmeService.getByName(name);
  }
}
