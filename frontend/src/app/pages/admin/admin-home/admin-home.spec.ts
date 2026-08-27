import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminHome } from './admin-home';

describe('AdminHome', () => {
  let fixture: ComponentFixture<AdminHome>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminHome],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    fixture = TestBed.createComponent(AdminHome);
    fixture.detectChanges();
  });

  it('groups the sections under three titled headings', () => {
    const groupTitles: string[] = Array.from(
      fixture.nativeElement.querySelectorAll('.admin-home__group-title'),
    ).map((el) => (el as HTMLElement).textContent?.trim());

    expect(groupTitles).toEqual(['Opérations', 'Pilotage', 'Production']);
  });

  it('places each card in the right group, linking to its route', () => {
    const groups: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.admin-home__group'));
    expect(groups).toHaveLength(3);

    const hrefsByGroup = groups.map((group) =>
      Array.from(group.querySelectorAll('a.admin-home__card')).map((a) => a.getAttribute('href')),
    );

    expect(hrefsByGroup[0]).toEqual(['/admin/stocks', '/admin/orders', '/admin/slots']);
    expect(hrefsByGroup[1]).toEqual(['/admin/analytics', '/admin/users']);
    expect(hrefsByGroup[2]).toEqual(['/admin/raw-materials', '/admin/production-sessions']);
  });

  it('keeps a sane heading hierarchy: h3 group titles, h4 card titles', () => {
    const groupHeadingTags = Array.from(fixture.nativeElement.querySelectorAll('.admin-home__group-title')).map(
      (el) => (el as HTMLElement).tagName,
    );
    const cardHeadingTags = Array.from(fixture.nativeElement.querySelectorAll('.admin-home__card-title')).map(
      (el) => (el as HTMLElement).tagName,
    );

    expect(groupHeadingTags.every((tag) => tag === 'H3')).toBe(true);
    expect(cardHeadingTags.every((tag) => tag === 'H4')).toBe(true);
  });
});
