import { describe, it, expect } from 'vitest';
import { appPagesCacheTag, pageCacheTag } from '../page-cache-tags';

describe('page-cache-tags', () => {
  it('builds an app-scoped tag', () => {
    expect(appPagesCacheTag('app1')).toBe('app-pages:app1');
  });

  it('builds a slug-scoped tag', () => {
    expect(pageCacheTag('app1', 'home')).toBe('app-page:app1:home');
  });

  it('different inputs always produce different tags', () => {
    expect(appPagesCacheTag('a')).not.toBe(appPagesCacheTag('b'));
    expect(pageCacheTag('a', 'x')).not.toBe(pageCacheTag('a', 'y'));
    expect(pageCacheTag('a', 'x')).not.toBe(pageCacheTag('b', 'x'));
  });
});
