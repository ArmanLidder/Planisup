import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService {
  private programmes: any[];

  constructor() {
    const filePath = path.join(
      process.cwd(),
      'src',
      'cours_polytechnique_complet.json',
    );
    const rawData = fs.readFileSync(filePath, 'utf8');
    this.programmes = JSON.parse(rawData);
  }

  // Récupérer tout
  getAll() {
    return this.programmes;
  }

  // Récupérer par type (maitrise, dess, doctorat)
  getByType(type: string) {
    return this.programmes.filter((p: any) =>
      p.url.toLowerCase().includes(type.toLowerCase()),
    );
  }

  // Récupérer par type + discipline (ex: maitrise + genie-informatique)
  getByDiscipline(type: string, discipline: string) {
    return this.programmes.filter(
      (p: any) =>
        p.url.toLowerCase().includes(type.toLowerCase()) &&
        p.url.toLowerCase().includes(discipline.toLowerCase()),
    );
  }

  // Récupérer par nom exact
  getByName(name: string) {
    return this.programmes.find(
      (p: any) => p.program_name.toLowerCase() === name.toLowerCase(),
    );
  }
}
