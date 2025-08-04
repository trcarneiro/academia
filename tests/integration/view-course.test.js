import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Mock global window and document
const html = fs.readFileSync(path.resolve(__dirname, '../../public/views/view-course.html'), 'utf8');
const dom = new JSDOM(html);
global.window = dom.window;
global.document = dom.window.document;
global.fetch = jest.fn();

// Import module to test
require('../../public/js/modules/view-course.js');

describe('View Course Module', () => {
  beforeEach(() => {
    fetch.mockClear();
    document.body.innerHTML = html;
  });

  test('should show error when no course ID in URL', async () => {
    // Mock URL without ID parameter
    delete window.location;
    window.location = { search: '' };

    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Check error state
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(document.querySelector('.error-state')).toBeTruthy();
  });

  test('should fetch and render course data', async () => {
    // Mock URL with ID
    delete window.location;
    window.location = { search: '?id=123' };

    // Mock successful fetch response
    const mockCourse = {
      name: 'Test Course',
      description: 'Test Description',
      level: 'BEGINNER',
      duration: '8 semanas',
      status: 'active',
      success: true
    };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockCourse })
    });

    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Verify rendering
    expect(document.getElementById('course-title').textContent).toBe('Test Course');
    expect(document.getElementById('course-description').textContent).toBe('Test Description');
    expect(document.getElementById('course-level').textContent).toBe('Iniciante');
    expect(document.getElementById('course-duration').textContent).toBe('8 semanas');
    expect(document.getElementById('course-status').textContent).toBe('Ativo');
  });

  test('should show error when fetch fails', async () => {
    // Mock URL with ID
    delete window.location;
    window.location = { search: '?id=123' };

    // Mock failed fetch
    fetch.mockRejectedValueOnce(new Error('Network error'));

    // Trigger DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Verify error state
    expect(document.querySelector('.error-state')).toBeTruthy();
  });

  test('should translate status labels correctly', () => {
    const viewCourse = require('../../public/js/modules/view-course.js');
    expect(viewCourse.getStatusLabel('active')).toBe('Ativo');
    expect(viewCourse.getStatusLabel('draft')).toBe('Rascunho');
    expect(viewCourse.getStatusLabel('unknown')).toBe('unknown');
  });

  test('should translate level labels correctly', () => {
    const viewCourse = require('../../public/js/modules/view-course.js');
    expect(viewCourse.getLevelLabel('BEGINNER')).toBe('Iniciante');
    expect(viewCourse.getLevelLabel('INTERMEDIATE')).toBe('Intermediário');
    expect(viewCourse.getLevelLabel('ADVANCED')).toBe('Avançado');
    expect(viewCourse.getLevelLabel('unknown')).toBe('unknown');
  });
});