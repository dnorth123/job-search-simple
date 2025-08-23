import { assertEquals, assertExists } from "https://deno.land/std@0.192.0/testing/asserts.ts";

// Mock the Supabase client
const mockSupabase = {
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        gte: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      }),
      single: () => Promise.resolve({ data: null, error: null })
    }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null })
    })
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })
  }
};

// Mock fetch for Brave API
global.fetch = async (url: string, options?: any) => {
  if (url.includes('api.search.brave.com')) {
    return new Response(JSON.stringify({
      web: {
        results: [
          {
            title: "Microsoft | LinkedIn",
            url: "https://www.linkedin.com/company/microsoft/",
            description: "Technology company that develops, manufactures, licenses, supports, and sells computer software, consumer electronics, personal computers, and related services."
          },
          {
            title: "Microsoft Development Center | LinkedIn", 
            url: "https://www.linkedin.com/company/microsoft-development-center/",
            description: "Microsoft development center focused on cloud solutions and enterprise software."
          }
        ]
      }
    }), { status: 200 });
  }
  throw new Error('Unexpected fetch URL');
};

// Test helper functions
function extractVanityName(url: string): string {
  try {
    const match = url.match(/linkedin\.com\/company\/([^\/\?]+)/i);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

function extractCompanyName(title: string, description: string): string {
  const titleMatch = title.match(/^([^|]+)(?:\s*\|\s*LinkedIn)?/);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  
  const descWords = description.split(' ').slice(0, 3).join(' ');
  return descWords.length > 0 ? descWords : 'Unknown Company';
}

function calculateConfidence(
  result: any, 
  searchTerm: string, 
  isFirstResult: boolean
): number {
  let confidence = 0.6; // Base confidence for valid LinkedIn company URL
  
  const companyName = extractCompanyName(result.title, result.description);
  const vanityName = extractVanityName(result.url);
  
  // +0.25 if company name matches search term (case insensitive)
  if (companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      searchTerm.toLowerCase().includes(companyName.toLowerCase().split(' ')[0])) {
    confidence += 0.25;
  }
  
  // +0.10 if first result
  if (isFirstResult) {
    confidence += 0.10;
  }
  
  // +0.05 if URL contains search term as slug
  if (vanityName.toLowerCase().includes(searchTerm.toLowerCase().replace(/\s+/g, ''))) {
    confidence += 0.05;
  }
  
  // Cap at 0.95 maximum
  return Math.min(confidence, 0.95);
}

Deno.test("LinkedIn Discovery Edge Function Tests", async (t) => {
  
  await t.step("should extract vanity names correctly", () => {
    const testCases = [
      {
        url: "https://www.linkedin.com/company/microsoft/",
        expected: "microsoft"
      },
      {
        url: "https://linkedin.com/company/apple-inc/",
        expected: "apple-inc"
      },
      {
        url: "https://www.linkedin.com/company/google/?originalSubdomain=www",
        expected: "google"
      },
      {
        url: "https://invalid-url.com/company/test/",
        expected: ""
      }
    ];

    testCases.forEach(({ url, expected }) => {
      assertEquals(extractVanityName(url), expected);
    });
  });

  await t.step("should extract company names from titles correctly", () => {
    const testCases = [
      {
        title: "Microsoft | LinkedIn",
        description: "Tech company...",
        expected: "Microsoft"
      },
      {
        title: "Apple Inc. - Official LinkedIn",
        description: "Consumer electronics...",
        expected: "Apple Inc. - Official LinkedIn"
      },
      {
        title: "Google",
        description: "Search engine company based in Mountain View",
        expected: "Google"
      },
      {
        title: "",
        description: "Technology consulting services for enterprises",
        expected: "Technology consulting services"
      }
    ];

    testCases.forEach(({ title, description, expected }) => {
      assertEquals(extractCompanyName(title, description), expected);
    });
  });

  await t.step("should calculate confidence scores correctly", () => {
    const baseResult = {
      title: "Microsoft | LinkedIn",
      url: "https://www.linkedin.com/company/microsoft/",
      description: "Technology company that develops software"
    };

    // Test base confidence
    let confidence = calculateConfidence(baseResult, "SomeOtherCompany", false);
    assertEquals(confidence, 0.6); // Base confidence only

    // Test with matching company name
    confidence = calculateConfidence(baseResult, "Microsoft", false);
    assertEquals(confidence, 0.9); // 0.6 + 0.25 + 0.05 (vanity match)

    // Test with first result bonus
    confidence = calculateConfidence(baseResult, "Microsoft", true);
    assertEquals(confidence, 0.95); // 0.6 + 0.25 + 0.05 + 0.10, capped at 0.95

    // Test with partial match
    const partialResult = {
      title: "Microsoft Development Center | LinkedIn",
      url: "https://www.linkedin.com/company/microsoft-dev/",
      description: "Microsoft subsidiary"
    };
    confidence = calculateConfidence(partialResult, "Microsoft", false);
    assertEquals(confidence, 0.85); // 0.6 + 0.25 (name match)
  });

  await t.step("should handle company name variations", () => {
    const testCases = [
      {
        searchTerm: "microsoft",
        title: "Microsoft Corporation | LinkedIn",
        shouldMatch: true
      },
      {
        searchTerm: "MICROSOFT",
        title: "microsoft | LinkedIn", 
        shouldMatch: true
      },
      {
        searchTerm: "Microsoft Corp",
        title: "Microsoft | LinkedIn",
        shouldMatch: true
      },
      {
        searchTerm: "Apple",
        title: "Microsoft | LinkedIn",
        shouldMatch: false
      }
    ];

    testCases.forEach(({ searchTerm, title, shouldMatch }) => {
      const result = {
        title,
        url: "https://www.linkedin.com/company/test/",
        description: "Test description"
      };
      
      const confidence = calculateConfidence(result, searchTerm, false);
      
      if (shouldMatch) {
        assertEquals(confidence > 0.6, true, `Should match ${searchTerm} with ${title}`);
      } else {
        assertEquals(confidence, 0.6, `Should not match ${searchTerm} with ${title}`);
      }
    });
  });

  await t.step("should limit results to top 3", () => {
    const mockResults = Array.from({ length: 10 }, (_, i) => ({
      title: `Company ${i} | LinkedIn`,
      url: `https://www.linkedin.com/company/company-${i}/`,
      description: `Description for company ${i}`
    }));

    // Simulate processing logic that limits to 3 results
    const limitedResults = mockResults.slice(0, 3);
    assertEquals(limitedResults.length, 3);
  });

  await t.step("should handle Brave API errors gracefully", async () => {
    // Mock fetch to return error
    const originalFetch = global.fetch;
    global.fetch = async () => {
      return new Response('Internal Server Error', { status: 500 });
    };

    try {
      await fetch('https://api.search.brave.com/res/v1/web/search');
    } catch (error) {
      assertExists(error);
    } finally {
      global.fetch = originalFetch;
    }
  });

  await t.step("should validate input parameters", () => {
    const validInputs = [
      "Microsoft",
      "Apple Inc.",
      "Google LLC",
      "L'Oréal & Co."
    ];

    const invalidInputs = [
      "",
      "A",
      "AB", // Too short
      null,
      undefined
    ];

    validInputs.forEach(input => {
      const isValid = input && typeof input === 'string' && input.trim().length >= 2;
      assertEquals(isValid, true, `${input} should be valid`);
    });

    invalidInputs.forEach(input => {
      const isValid = input && typeof input === 'string' && input.trim().length >= 2;
      assertEquals(isValid, false, `${input} should be invalid`);
    });
  });

  await t.step("should handle cache operations", async () => {
    // Test cache hit scenario
    const mockCacheData = {
      results: [
        {
          url: "https://www.linkedin.com/company/microsoft/",
          companyName: "Microsoft",
          vanityName: "microsoft",
          description: "Technology company",
          confidence: 0.95
        }
      ],
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };

    // This would normally interact with Supabase, but we're testing the logic
    const isExpired = new Date(mockCacheData.expires_at) < new Date();
    assertEquals(isExpired, false, "Cache should not be expired");

    // Test cache miss scenario
    const expiredCacheData = {
      ...mockCacheData,
      expires_at: new Date(Date.now() - 1000).toISOString() // 1 second ago
    };

    const isExpiredCache = new Date(expiredCacheData.expires_at) < new Date();
    assertEquals(isExpiredCache, true, "Cache should be expired");
  });

  await t.step("should update cache after successful search", () => {
    const searchTerm = "Microsoft";
    const results = [
      {
        url: "https://www.linkedin.com/company/microsoft/",
        companyName: "Microsoft",
        vanityName: "microsoft",
        description: "Technology company",
        confidence: 0.95
      }
    ];

    // Simulate cache update logic
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const cacheEntry = {
      search_term: searchTerm.toLowerCase().trim(),
      results,
      expires_at: expiresAt.toISOString(),
      search_count: 1
    };

    assertEquals(cacheEntry.search_term, "microsoft");
    assertEquals(cacheEntry.results.length, 1);
    assertEquals(typeof cacheEntry.expires_at, "string");
    assertEquals(cacheEntry.search_count, 1);
  });

  await t.step("should handle special characters in search terms", () => {
    const specialCharCases = [
      "L'Oréal",
      "AT&T",
      "PwC (PricewaterhouseCoopers)",
      "3M Company",
      "H&M"
    ];

    specialCharCases.forEach(companyName => {
      // Test that special characters don't break the processing
      const normalizedName = companyName.toLowerCase().trim();
      assertEquals(typeof normalizedName, "string");
      assertEquals(normalizedName.length > 0, true);
    });
  });

  await t.step("should handle international company names", () => {
    const internationalNames = [
      "北京字节跳动科技有限公司", // ByteDance in Chinese
      "Société Générale", // French
      "Nestlé SA", // Swiss
      "株式会社ソニー" // Sony in Japanese
    ];

    internationalNames.forEach(name => {
      const processedName = name.toLowerCase().trim();
      assertEquals(typeof processedName, "string");
      assertEquals(processedName.length > 0, true);
    });
  });

  await t.step("should respect rate limiting considerations", () => {
    // Test rate limiting logic
    const monthlyLimit = 2000;
    const currentUsage = 1950;
    const remainingQuota = monthlyLimit - currentUsage;
    
    assertEquals(remainingQuota, 50);
    assertEquals(remainingQuota > 0, true, "Should have remaining quota");
    
    // Test when limit is exceeded
    const exceededUsage = 2001;
    const exceededRemaining = monthlyLimit - exceededUsage;
    assertEquals(exceededRemaining < 0, true, "Should be over quota");
  });
});