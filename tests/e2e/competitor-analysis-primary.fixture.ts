import { transparentPixel, type MockDetail } from './competitor-analysis.types';

export const primaryCompetitorDetails = {
    180001: {
      watchProduct: {
        id: 180001,
        ownerUserId: 501,
        storeCode: 'STR108065-NSA',
        siteCode: 'SA',
        productSiteOfferId: 170001,
        skuParent: 'API-BASKET-SA',
        partnerSku: 'API-BASKET-SA-001',
        childSku: 'Z8C2BASKET001-1',
        selfNoonProductCode: 'N51004211A',
        selfCodeType: 'N_CODE',
        title: 'API Foldable Laundry Basket',
        brand: 'Nuono Home',
        imageUrl: transparentPixel,
        productFulltype: 'home_storage-laundry_baskets',
        status: 'ACTIVE',
        latestRunId: 3000,
        latestRunStatus: 'SUCCEEDED',
        latestRunAt: '2026-06-05T08:04:00'
      },
      keywords: [
        {
          id: 190001,
          watchProductId: 180001,
          keyword: 'laundry basket',
          keywordNorm: 'laundry basket',
          locale: 'en-SA',
          status: 'ACTIVE',
          displayOrder: 1,
          lastProviderStatus: 'SUCCEEDED',
          lastSucceededAt: '2026-06-05T08:04:00'
        },
        {
          id: 190002,
          watchProductId: 180001,
          keyword: 'foldable hamper',
          keywordNorm: 'foldable hamper',
          locale: 'en-SA',
          status: 'ACTIVE',
          displayOrder: 2,
          lastProviderStatus: 'SUCCEEDED',
          lastSucceededAt: '2026-06-05T08:05:00'
        }
      ],
      candidates: [
        {
          id: 200001,
          watchProductId: 180001,
          noonProductCode: 'N70011234A',
          codeType: 'N_CODE',
          canonicalUrl: 'https://www.noon.com/saudi-en/p/N70011234A/p/',
          titleSnapshot: 'Collapsible Laundry Hamper With Lid',
          brandSnapshot: 'HomePlus',
          imageUrlSnapshot: transparentPixel,
          priceAmountSnapshot: 54.9,
          currencyCodeSnapshot: 'SAR',
          ratingSnapshot: 4.4,
          reviewCountSnapshot: 218,
          sourceType: 'SEARCH_DISCOVERY',
          reviewStatus: 'PENDING',
          lastSeenAt: '2026-06-05T08:05:00'
        },
        {
          id: 200002,
          watchProductId: 180001,
          noonProductCode: 'Z6122BASKETSA',
          codeType: 'Z_CODE',
          canonicalUrl: 'https://www.noon.com/saudi-en/p/Z6122BASKETSA/p/',
          titleSnapshot: 'Large Fabric Laundry Basket Organizer',
          brandSnapshot: 'Casa Line',
          imageUrlSnapshot: transparentPixel,
          priceAmountSnapshot: 48,
          currencyCodeSnapshot: 'SAR',
          ratingSnapshot: 4.1,
          reviewCountSnapshot: 94,
          sourceType: 'SEARCH_DISCOVERY',
          reviewStatus: 'CONFIRMED',
          lastSeenAt: '2026-06-05T08:04:00'
        },
        {
          id: 200003,
          watchProductId: 180001,
          noonProductCode: 'N88990123A',
          codeType: 'N_CODE',
          canonicalUrl: 'https://www.noon.com/saudi-en/p/N88990123A/p/',
          titleSnapshot: 'Premium Woven Storage Basket',
          brandSnapshot: 'OrganizeIt',
          imageUrlSnapshot: transparentPixel,
          priceAmountSnapshot: 72.5,
          currencyCodeSnapshot: 'SAR',
          ratingSnapshot: 4.7,
          reviewCountSnapshot: 311,
          sourceType: 'SEARCH_DISCOVERY',
          reviewStatus: 'PENDING',
          lastSeenAt: '2026-06-05T08:05:00'
        }
      ],
      keywordRelations: [
        {
          id: 210001,
          keywordId: 190001,
          competitorProductId: 200001,
          relationStatus: 'DISCOVERED',
          lastSeenRunId: 3000,
          lastSeenRankNo: 3,
          lastSeenSponsored: true,
          lastSeenAt: '2026-06-05T08:04:00'
        },
        {
          id: 210002,
          keywordId: 190001,
          competitorProductId: 200002,
          relationStatus: 'CONFIRMED',
          lastSeenRunId: 3000,
          lastSeenRankNo: 8,
          lastSeenSponsored: false,
          lastSeenAt: '2026-06-05T08:04:00'
        },
        {
          id: 210003,
          keywordId: 190002,
          competitorProductId: 200001,
          relationStatus: 'DISCOVERED',
          lastSeenRunId: 3000,
          lastSeenRankNo: 3,
          lastSeenSponsored: true,
          lastSeenAt: '2026-06-05T08:05:00'
        },
        {
          id: 210004,
          keywordId: 190002,
          competitorProductId: 200002,
          relationStatus: 'CONFIRMED',
          lastSeenRunId: 3000,
          lastSeenRankNo: 5,
          lastSeenSponsored: false,
          lastSeenAt: '2026-06-05T08:05:00'
        },
        {
          id: 210005,
          keywordId: 190002,
          competitorProductId: 200003,
          relationStatus: 'DISCOVERED',
          lastSeenRunId: 3000,
          lastSeenRankNo: 16,
          lastSeenSponsored: false,
          lastSeenAt: '2026-06-05T08:05:00'
        }
      ],
      latestRankPoints: [
        {
          keywordId: 190001,
          keyword: 'laundry basket',
          trackedProductType: 'SELF',
          noonProductCode: 'N51004211A',
          rankStatus: 'RANKED',
          rankNo: 9,
          sponsored: false,
          priceAmount: 59.9,
          currencyCode: 'SAR',
          factTime: '2026-06-05T08:04:00'
        },
        {
          keywordId: 190001,
          keyword: 'laundry basket',
          trackedProductType: 'COMPETITOR',
          noonProductCode: 'Z6122BASKETSA',
          rankStatus: 'RANKED',
          rankNo: 8,
          sponsored: false,
          priceAmount: 48,
          currencyCode: 'SAR',
          factTime: '2026-06-05T08:04:00'
        },
        {
          keywordId: 190002,
          keyword: 'foldable hamper',
          trackedProductType: 'SELF',
          noonProductCode: 'N51004211A',
          rankStatus: 'RANKED',
          rankNo: 18,
          sponsored: true,
          priceAmount: 59.9,
          currencyCode: 'SAR',
          factTime: '2026-06-05T08:05:00'
        },
        {
          keywordId: 190002,
          keyword: 'foldable hamper',
          trackedProductType: 'COMPETITOR',
          noonProductCode: 'Z6122BASKETSA',
          rankStatus: 'RANKED',
          rankNo: 5,
          sponsored: false,
          priceAmount: 48,
          currencyCode: 'SAR',
          factTime: '2026-06-05T08:05:00'
        }
      ]
    },
} satisfies Record<number, MockDetail>;
