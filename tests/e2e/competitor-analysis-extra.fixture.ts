import { transparentPixel, type MockDetail } from './competitor-analysis.types';

export const extraCompetitorDetails = {
    180002: {
      watchProduct: {
        id: 180002,
        ownerUserId: 501,
        storeCode: 'STR245027-NAE',
        siteCode: 'AE',
        productSiteOfferId: 170002,
        skuParent: 'API-ORG-AE',
        partnerSku: 'API-ORG-AE-207',
        childSku: 'Z8C2ORG207-1',
        selfNoonProductCode: 'N43008765A',
        selfCodeType: 'N_CODE',
        title: 'API Acrylic Cosmetic Organizer',
        brand: 'Nuono Beauty',
        imageUrl: transparentPixel,
        productFulltype: 'beauty_accessories-cosmetic_organizers',
        status: 'ACTIVE',
        latestRunId: 3002,
        latestRunStatus: 'SUCCEEDED',
        latestRunAt: '2026-06-05T08:11:00'
      },
      keywords: [
        {
          id: 190003,
          watchProductId: 180002,
          keyword: 'makeup organizer',
          keywordNorm: 'makeup organizer',
          locale: 'en-AE',
          status: 'ACTIVE',
          displayOrder: 1,
          lastProviderStatus: 'SUCCEEDED',
          lastSucceededAt: '2026-06-05T08:11:00'
        }
      ],
      candidates: [
        {
          id: 200004,
          watchProductId: 180002,
          noonProductCode: 'N60004567A',
          codeType: 'N_CODE',
          canonicalUrl: 'https://www.noon.com/uae-en/p/N60004567A/p/',
          titleSnapshot: 'Clear Makeup Storage Box',
          brandSnapshot: 'BeautyBox',
          imageUrlSnapshot: transparentPixel,
          priceAmountSnapshot: 39,
          currencyCodeSnapshot: 'AED',
          ratingSnapshot: 4.2,
          reviewCountSnapshot: 73,
          sourceType: 'SEARCH_DISCOVERY',
          reviewStatus: 'CONFIRMED',
          lastSeenAt: '2026-06-05T08:11:00'
        }
      ],
      keywordRelations: [
        {
          id: 210006,
          keywordId: 190003,
          competitorProductId: 200004,
          relationStatus: 'CONFIRMED',
          lastSeenRunId: 3002,
          lastSeenRankNo: 7,
          lastSeenSponsored: true,
          lastSeenAt: '2026-06-05T08:11:00'
        }
      ],
      latestRankPoints: [
        {
          keywordId: 190003,
          keyword: 'makeup organizer',
          trackedProductType: 'SELF',
          noonProductCode: 'N43008765A',
          rankStatus: 'RANKED',
          rankNo: 11,
          sponsored: false,
          priceAmount: 44,
          currencyCode: 'AED',
          factTime: '2026-06-05T08:11:00'
        },
        {
          keywordId: 190003,
          keyword: 'makeup organizer',
          trackedProductType: 'COMPETITOR',
          noonProductCode: 'N60004567A',
          rankStatus: 'RANKED',
          rankNo: 7,
          sponsored: true,
          priceAmount: 39,
          currencyCode: 'AED',
          factTime: '2026-06-05T08:11:00'
        }
      ]
    },
    180003: {
      watchProduct: {
        id: 180003,
        ownerUserId: 501,
        storeCode: 'STR108065-NSA',
        siteCode: 'SA',
        productSiteOfferId: 170003,
        skuParent: 'API-NOKEY-SA',
        partnerSku: 'API-NOKEY-SA-001',
        childSku: 'Z8C2NOKEY001-1',
        selfNoonProductCode: 'N51009999A',
        selfCodeType: 'N_CODE',
        title: 'API Product Without Keywords',
        brand: 'Nuono Home',
        imageUrl: transparentPixel,
        productFulltype: 'home_storage-boxes',
        status: 'ACTIVE',
        latestRunStatus: 'FAILED',
        latestRunAt: ''
      },
      keywords: [],
      candidates: [],
      keywordRelations: [],
      latestRankPoints: []
    }
} satisfies Record<number, MockDetail>;
