import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Search } from './search';
import { CourseService } from '@app/services/course/course-service';
import { ExtendedInfoCourse } from '@common/program';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatHeaderCell, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

const mockCourses: ExtendedInfoCourse[] = [
  {
    sigle: 'LOG1000',
    name: 'Programmation 1',
    department: 'Informatique',
    credits: 3,
    description: 'Cours d’introduction à la programmation',
    trimester: 'Automne',
    semester: { Automne: 'O', Hiver: 'N', Été: 'N' },
    semesterList: [],
    language: 'Français',
  },
  {
    sigle: 'MTH1100',
    name: 'Mathématiques 1',
    department: 'Mathématiques',
    credits: 3,
    description: 'Cours de mathématiques de base',
    trimester: 'Hiver',
    semester: { Automne: 'N', Hiver: 'O', Été: 'O' },
    semesterList: [],
    language: 'Anglais',
  },
  {
    sigle: 'LOG2100',
    name: 'Structures de données',
    department: 'Informatique',
    credits: 3,
    description: 'Cours sur les structures de données classiques',
    trimester: 'Automne',
    semester: { Automne: 'O', Hiver: 'O', Été: 'N' },
    semesterList: [],
    language: 'Français',
  },
];

class MockCourseService {
  searchCourses = mockCourses;
}

describe('Search', () => {
  let component: Search;
  let fixture: ComponentFixture<Search>;
  let mockCourseService: MockCourseService;

  beforeEach(async () => {
    mockCourseService = new MockCourseService();

    await TestBed.configureTestingModule({
      imports: [
        Search,
        CommonModule,
        MatInputModule,
        MatSelect,
        MatOption,
        MatHeaderCell,
        MatTableModule,
        MatIconModule,
      ],
      providers: [{ provide: CourseService, useValue: mockCourseService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Search);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should format courses and populate department, trimester and language lists', () => {
      component.ngOnInit();

      expect(component.allCourses.length).toBe(3);
      expect(component.filteredCourses.length).toBe(3);
      expect(component.departments).toContain('Informatique');
      expect(component.trimesters).toContain('Automne');
      expect(component.languages).toContain('Français');
    });
  });

  describe('formatTrimester()', () => {
    it('should correctly convert semester flags into a readable list', () => {
      const result = (component as any).formatTrimester(mockCourses);

      expect(result[0].semesterList).toEqual(['Automne']);
      expect(result[1].semesterList).toEqual(['Hiver', 'Été']);
      expect(result[2].semesterList).toEqual(['Automne', 'Hiver']);
    });

    it('should add "Aucune session offerte" when no semester active', () => {
      const noTrimesterCourse = [
        {
          ...mockCourses[0],
          semester: { Automne: 'N', Hiver: 'N', Été: 'N' },
        },
      ];
      const result = (component as any).formatTrimester(noTrimesterCourse);
      expect(result[0].semesterList).toEqual(['Aucune session offerte']);
    });
  });

  describe('onSearch()', () => {
    it('should update searchValue and call filterBySelectedValue', () => {
      spyOn(component, 'filterBySelectedValue');
      component.onSearch('log');
      expect((component as any).searchValue).toBe('log');
      expect(component.filterBySelectedValue).toHaveBeenCalled();
    });
  });

  describe('filterBySelectedValue()', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should filter by search value', () => {
      component.onSearch('log');
      expect(component.filteredCourses.every((c) => c.sigle.startsWith('LOG'))).toBeTrue();
    });

    it('should filter by department', () => {
      component.selectedDepartment = 'Mathématiques';
      component.filterBySelectedValue();
      expect(component.filteredCourses.length).toBe(1);
      expect(component.filteredCourses[0].department).toBe('Mathématiques');
    });

    it('should filter by trimester', () => {
      component.selectedTrimester = 'Hiver';
      component.filterBySelectedValue();
      expect(component.filteredCourses.every((c) => c.semesterList.includes('Hiver'))).toBeTrue();
    });

    it('should filter by language', () => {
      component.selectedLanguage = 'Français';
      component.filterBySelectedValue();
      expect(component.filteredCourses.every((c) => c.language === 'Français')).toBeTrue();
    });

    it('should apply multiple filters at once correctly', () => {
      component.selectedDepartment = 'Informatique';
      component.selectedTrimester = 'Automne';
      component.selectedLanguage = 'Français';
      component.onSearch('LOG');
      expect(
        component.filteredCourses.every(
          (c) =>
            c.department === 'Informatique' &&
            c.language === 'Français' &&
            c.semesterList.includes('Automne')
        )
      ).toBeTrue();
    });
  });
});
