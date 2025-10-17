import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GsupMenu } from './gsup-menu';
import { AuthentificationService } from '@app/services/authentification/authentification-service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ElementRef } from '@angular/core';
import { UserRole } from '@common/user';

class MockAuthService {
  logout = jasmine.createSpy('logout');
}
class MockRouter {
  navigate = jasmine.createSpy('navigate');
}
class MockDialog {
  open = jasmine.createSpy('open');
}
class MockElementRef {
  nativeElement = { contains: () => false };
}

describe('GsupMenu', () => {
  let component: GsupMenu;
  let fixture: ComponentFixture<GsupMenu>;
  let mockAuthService: MockAuthService;
  let mockRouter: MockRouter;
  let mockDialog: MockDialog;
  let mockElementRef: MockElementRef;

  beforeEach(async () => {
    mockAuthService = new MockAuthService();
    mockRouter = new MockRouter();
    mockDialog = new MockDialog();
    mockElementRef = new MockElementRef();

    await TestBed.configureTestingModule({
      imports: [GsupMenu],
      providers: [
        { provide: AuthentificationService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ElementRef, useValue: mockElementRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GsupMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('openMenu()', () => {
    it('should toggle menu state when called', () => {
      component.isMenuOpen = false;
      component.openMenu();
      expect(component.isMenuOpen).toBeTrue();

      component.openMenu();
      expect(component.isMenuOpen).toBeFalse();
    });
  });

  describe('navigateTo()', () => {
    it('should close menu and navigate to given route', () => {
      component.isMenuOpen = true;
      component.navigateTo('acceuil');

      expect(component.isMenuOpen).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/acceuil']);
    });
  });

  describe('logout()', () => {
    it('should call logout and redirect to login', () => {
      component.logout();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('searchCourses()', () => {
    it('should close menu and open search dialog', () => {
      component.isMenuOpen = true;
      component.searchCourses();

      expect(component.isMenuOpen).toBeFalse();
      expect(mockDialog.open).toHaveBeenCalled();
    });
  });

  describe('isAdmin()', () => {
    it('should return true if user is admin', () => {
      component.currentUser = {
        _id: '1',
        usercode: 'U001',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.Administrateur,
        currentPlan: '',
        plans: ['A'],
      };
      expect(component.isAdmin()).toBeTrue();
    });

    it('should return false if user is not admin', () => {
      component.currentUser = {
        _id: '2',
        usercode: 'U002',
        firstName: 'Etudiant',
        lastName: 'User',
        role: UserRole.Etudiant,
        currentPlan: '',
        plans: ['A'],
      };
      expect(component.isAdmin()).toBeFalse();
    });
  });

  describe('clickOutsideMenu()', () => {
    it('should close menu when clicking outside', () => {
      component.isMenuOpen = true;
      spyOn(mockElementRef.nativeElement, 'contains').and.returnValue(false);

      component.clickOutsideMenu(new Event('click'));
      expect(component.isMenuOpen).toBeFalse();
    });

    it('should not close menu when clicking inside', () => {
      component.isMenuOpen = true;
      spyOn(mockElementRef.nativeElement, 'contains').and.returnValue(true);

      component.clickOutsideMenu(new Event('click'));
      expect(component.isMenuOpen).toBeFalse();
    });
  });

  describe('clickOnResizeMenu()', () => {
    it('should close menu when window is resized', () => {
      component.isMenuOpen = true;
      component.clickOnResizeMenu();
      expect(component.isMenuOpen).toBeFalse();
    });
  });
});
