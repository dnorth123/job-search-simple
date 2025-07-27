# End-to-End Testing with Playwright

This directory contains comprehensive automated responsive design and mobile testing using Playwright.

## Test Categories

### 1. Responsive Layout Testing (`responsiveLayout.test.ts`)
- **Component rendering across breakpoints** (mobile, tablet, desktop)
- **Navigation menu behavior** on different screen sizes
- **Touch interaction testing** for mobile devices
- **Orientation change handling**
- **Edge cases and boundary conditions**

### 2. Progressive Web App (PWA) Testing (`pwa.test.ts`)
- **Service worker functionality** and offline capabilities
- **App installation and icon behavior**
- **Push notification testing** (mocked)
- **Background sync validation**
- **Performance and reliability testing**

### 3. Performance Testing (`performance.test.ts`)
- **Bundle size analysis** and optimization validation
- **Image loading and optimization** testing
- **API call efficiency** and caching validation
- **Memory usage profiling**
- **Core Web Vitals tracking**

### 4. Cross-Browser Compatibility (`crossBrowser.test.ts`)
- **Chrome, Firefox, Safari, Edge** rendering consistency
- **JavaScript feature compatibility** testing
- **CSS feature support** validation
- **Browser-specific features** and workarounds

## Test Configuration

### Playwright Configuration (`playwright.config.ts`)
- **Multiple browser projects**: Chrome, Firefox, Safari, Edge
- **Mobile devices**: Pixel 5, iPhone 12
- **Tablet devices**: iPad Pro 11
- **Custom viewport sizes**: Mobile Small/Medium/Large, Tablet, Desktop Small/Medium/Large
- **Parallel execution** with retry logic
- **Screenshot and video capture** on failure

### Browser Coverage
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Chrome Mobile, Safari Mobile, Firefox Mobile
- **Tablet**: iPad (landscape and portrait)
- **Custom viewports**: 320px to 1920px width

## Running Tests

### Basic Commands
```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

### Running Specific Tests
```bash
# Run only responsive layout tests
npx playwright test responsiveLayout.test.ts

# Run only PWA tests
npx playwright test pwa.test.ts

# Run only performance tests
npx playwright test performance.test.ts

# Run only cross-browser tests
npx playwright test crossBrowser.test.ts
```

### Running on Specific Browsers
```bash
# Run tests only on Chrome
npx playwright test --project=chromium

# Run tests only on mobile devices
npx playwright test --project="Mobile Chrome"

# Run tests on specific viewport
npx playwright test --project="Mobile Small"
```

## Test Structure

### Responsive Layout Tests
- **Component Rendering**: Tests layout across different screen sizes
- **Navigation Behavior**: Tests menu behavior and transitions
- **Touch Interactions**: Tests mobile gestures and interactions
- **Orientation Changes**: Tests portrait/landscape transitions
- **Edge Cases**: Tests extreme viewport sizes and rapid changes

### PWA Tests
- **Service Worker**: Registration, lifecycle, caching, updates
- **Offline Capabilities**: Offline functionality, data caching, sync
- **App Installation**: Install prompts, icons, theme colors
- **Push Notifications**: Permission handling, notification display
- **Background Sync**: Sync registration and error handling

### Performance Tests
- **Bundle Analysis**: Load times, bundle sizes, code splitting
- **Image Optimization**: Loading times, formats, lazy loading
- **API Efficiency**: Response times, caching, debouncing
- **Memory Profiling**: Memory leaks, large datasets, cleanup
- **Core Web Vitals**: LCP, FID, CLS tracking

### Cross-Browser Tests
- **Rendering Consistency**: Layout, fonts, positioning across browsers
- **JavaScript Compatibility**: Modern features, DOM APIs, events
- **CSS Feature Support**: Grid, Flexbox, Custom Properties, Transforms
- **Browser-Specific Features**: Vendor prefixes, APIs, workarounds
- **Functionality Testing**: Forms, navigation, search, errors

## Test Data Attributes

The tests use the following `data-testid` attributes:

### Layout Elements
- `app-container`: Main application container
- `dashboard`: Dashboard component
- `application-list`: List of applications
- `application-card`: Individual application card
- `main-content`: Main content area
- `sidebar`: Sidebar navigation

### Navigation Elements
- `nav-link`: Navigation links
- `hamburger-menu`: Mobile hamburger menu
- `mobile-nav`: Mobile navigation menu
- `desktop-nav`: Desktop navigation menu

### Form Elements
- `add-application`: Add application button
- `application-form`: Application form
- `job-title-input`: Job title input field
- `submit-form`: Form submit button
- `search-input`: Search input field

### Status Indicators
- `offline-indicator`: Offline status indicator
- `error-indicator`: Error status indicator
- `sync-indicator`: Sync status indicator
- `loading-indicator`: Loading status indicator

## Performance Benchmarks

### Load Time Targets
- **Initial Load**: < 3 seconds
- **JavaScript Load**: < 2 seconds
- **CSS Load**: < 1 second
- **Image Load**: < 2 seconds

### Bundle Size Targets
- **Total Bundle**: < 5MB
- **JavaScript Chunks**: Multiple chunks for code splitting
- **Image Formats**: WebP, AVIF, or SVG with fallbacks

### Memory Usage Targets
- **Memory Leaks**: < 50MB increase after operations
- **Large Datasets**: < 100MB for 10,000 items
- **DOM Manipulation**: < 100ms for 1,000 elements

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: < 2.5 seconds
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

## Browser Support Matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Grid | ✅ | ✅ | ✅ | ✅ |
| CSS Flexbox | ✅ | ✅ | ✅ | ✅ |
| CSS Custom Properties | ✅ | ✅ | ✅ | ✅ |
| Service Workers | ✅ | ✅ | ✅ | ✅ |
| Fetch API | ✅ | ✅ | ✅ | ✅ |
| Local Storage | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ✅ | ✅ |
| Background Sync | ✅ | ✅ | ✅ | ✅ |

## Continuous Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tests

### Common Issues
1. **Element not found**: Check if `data-testid` attributes are present
2. **Timing issues**: Add appropriate `waitFor` calls
3. **Browser differences**: Use feature detection instead of browser detection
4. **Performance flakiness**: Increase timeouts for slow operations

### Debug Commands
```bash
# Run single test with debug
npx playwright test test-name.spec.ts --debug

# Run with headed mode
npx playwright test --headed

# Run with slow motion
npx playwright test --headed --timeout=0
```

## Best Practices

### Test Organization
- Group related tests using `test.describe()`
- Use descriptive test names
- Keep tests independent and isolated
- Use `beforeEach` for common setup

### Selectors
- Prefer `data-testid` over CSS selectors
- Use semantic selectors when possible
- Avoid brittle selectors (class names, text content)

### Performance Testing
- Measure actual performance metrics
- Test with realistic data sizes
- Monitor memory usage over time
- Test on actual devices when possible

### Cross-Browser Testing
- Test feature support, not browser detection
- Use progressive enhancement
- Handle vendor prefixes appropriately
- Test on actual browsers, not just engines 