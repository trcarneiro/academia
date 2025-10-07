# Google Ads API Integration - Design Document
**Academia de Valdocarneiro - CRM System**

---

## 1. Executive Summary

**Company:** SmartDefence
**Application Name:** CRM with Google Ads Integration  
**API Token ID:** Xph0niG06NhkFI8VpTyCEQ  
**Customer ID:** 411-893-6474  
**Contact Email:** TRCampos@gmail.com  
**Date:** October 3, 2025

### Purpose
This document describes the integration between our custom-built CRM system and the Google Ads API for automated conversion tracking and campaign performance optimization.

---

## 2. Business Context

### 2.1 Company Overview
Academia de Valdocarneiro is a martial arts training facility specializing in Krav Maga self-defense instruction. We serve the local community in the Greater São Paulo area, Brazil, with:
- Monthly membership subscriptions
- Trial class programs for prospective students
- Specialized training courses for different skill levels

### 2.2 Marketing Strategy
Our primary customer acquisition channel is Google Ads, focusing on:
- **Search campaigns** targeting keywords like "Krav Maga classes", "self-defense training", "martial arts near me"
- **Display campaigns** for brand awareness in our service area (Greater São Paulo)
- **Performance Max campaigns** for automated multi-channel optimization
- Conversion tracking for trial class bookings and membership sign-ups

**Supported Campaign Types:**
- Search (text ads on Google Search results)
- Display (banner ads on Google Display Network)
- Performance Max (automated campaigns across all Google properties)

---

## 3. Integration Architecture

### 3.1 System Overview

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  Student/Lead   │──────>│  Academia CRM    │──────>│  Google Ads API  │
│  Actions        │       │  System          │       │                  │
└─────────────────┘       └──────────────────┘       └──────────────────┘
                                    │
                                    v
                          ┌──────────────────┐
                          │  PostgreSQL DB   │
                          │  (Conversion     │
                          │   Tracking)      │
                          └──────────────────┘
```

### 3.2 Technology Stack
- **Backend:** Node.js (Fastify framework)
- **Database:** PostgreSQL with Prisma ORM
- **Frontend:** Vanilla JavaScript (modular architecture)
- **Google Ads Library:** googleapis npm package (Google Auth OAuth2)
- **Authentication:** OAuth 2.0 with offline access tokens

### 3.3 Data Flow
1. User submits trial class booking form or purchases membership
2. CRM system records conversion in PostgreSQL database
3. Backend API sends conversion data to Google Ads API via OAuth2
4. Google Ads receives conversion and attributes it to the originating ad/campaign
5. Campaign performance metrics are updated in real-time

---

## 4. API Usage Details

### 4.1 Google Ads Capabilities Provided
Our tool provides the following Google Ads API capabilities:

1. **Campaign Management** - Monitor campaign performance and adjust conversion tracking
2. **Reporting** - Generate custom reports on conversion rates, ROI, and lead attribution
3. **Conversion Tracking** - Automated upload of offline conversions from CRM to Google Ads

**Primary Use Case:** Conversion tracking integration between CRM and Google Ads for accurate campaign attribution and optimization.

### 4.2 Authentication Method
- **OAuth 2.0** with offline access tokens
- Tokens are securely stored in encrypted database fields
- Automatic token refresh implemented for continuous operation

### 4.3 API Endpoints Used
- **Google Ads API v17**
- Primary endpoint: `googleads.googleapis.com/v17/customers/{customer_id}/conversions:upload`
- Reporting endpoint: `googleads.googleapis.com/v17/customers/{customer_id}/googleAds:search`

### 4.4 Data Submitted
**Conversion Upload Payload:**
```json
{
  "conversionAction": "customers/411893674/conversionActions/{action_id}",
  "gclid": "{click_id}",
  "conversionDateTime": "2025-10-03 10:30:00-03:00",
  "conversionValue": 149.90,
  "currencyCode": "BRL"
}
```

**Conversion Types Tracked:**
1. **Trial Class Booking** - When a prospect schedules a trial class
2. **Membership Purchase** - When a trial converts to paid membership
3. **Course Enrollment** - When existing member enrolls in specialized courses

**Campaign Types Supported:**
- **Search Campaigns** - Text ads triggered by user search queries
- **Display Campaigns** - Visual banner ads across Google Display Network
- **Performance Max Campaigns** - AI-driven campaigns optimized across all Google channels

### 4.5 Request Volume
- **Estimated daily API calls:** 10-50 conversions
- **Peak usage:** 100-200 conversions/day during promotional campaigns
- **Batch processing:** Conversions are queued and uploaded in batches every 15 minutes

---

## 5. Security & Compliance

### 5.1 Data Protection
- OAuth2 credentials stored in encrypted database fields
- HTTPS/TLS encryption for all API communications
- Environment variables for sensitive configuration
- No PII (Personally Identifiable Information) sent to Google Ads API beyond conversion data

### 5.2 User Privacy
- Users are informed about conversion tracking via Privacy Policy
- Compliance with LGPD (Brazilian General Data Protection Law)
- Users can opt-out of tracking via CRM settings

### 5.3 Error Handling
- Failed conversions are logged and retried (3 attempts with exponential backoff)
- Admin dashboard displays API connection status and error logs
- Automated alerts for authentication failures or quota issues

---

## 6. User Access & Permissions

### 6.1 Internal Users
- **Admin Users:** Full access to Google Ads settings and conversion tracking dashboard
- **Instructors/Staff:** Read-only access to lead pipeline and conversion reports
- **Total Internal Users:** 3-5 employees

### 6.2 External Users
- **None** - This is an internal-only tool for managing our own Google Ads account
- No external clients or third parties have access to the API integration

---

## 7. Implementation Timeline

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | OAuth2 authentication setup | ✅ Completed |
| Phase 2 | Conversion tracking backend | ✅ Completed |
| Phase 3 | CRM module frontend | ✅ Completed |
| Phase 4 | Testing & validation | 🔄 In Progress |
| Phase 5 | Production deployment | ⏳ Pending API approval |

---

## 8. Code Samples

### 8.1 OAuth2 Authentication
```typescript
// src/routes/googleAds.ts
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_ADS_CLIENT_ID,
  process.env.GOOGLE_ADS_CLIENT_SECRET,
  'http://localhost:3000/api/google-ads/auth/callback'
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/adwords'],
  prompt: 'consent'
});
```

### 8.2 Conversion Upload
```typescript
// src/services/googleAdsService.ts
async function uploadConversion(conversionData) {
  const request = {
    customerId: '411893674',
    conversions: [{
      gclid: conversionData.gclid,
      conversionAction: conversionData.actionResourceName,
      conversionDateTime: conversionData.timestamp,
      conversionValue: conversionData.value,
      currencyCode: 'BRL'
    }]
  };
  
  const response = await googleAdsClient.conversionUploadService.uploadClickConversions(request);
  return response;
}
```

---

## 9. Monitoring & Reporting

### 9.1 Dashboard Features
- Real-time conversion tracking status
- Failed conversion retry queue
- API connection health monitoring
- Campaign ROI reports (revenue per ad spend)

### 9.2 Logging
- All API requests/responses logged with timestamps
- Error logs include stack traces for debugging
- Weekly summary reports emailed to admin

---

## 10. Support & Maintenance

### 10.1 Technical Support
- **Primary Contact:** TRCampos@gmail.com
- **Response Time:** Within 24 hours for API issues
- **Escalation Path:** Direct contact with Google Ads API support team if needed

### 10.2 System Updates
- Quarterly reviews of API usage and optimization opportunities
- Immediate updates for breaking API changes or deprecations
- Regular security audits and credential rotation

---

## 11. Compliance Declarations

- ✅ We will NOT use this API token with third-party tools
- ✅ We will NOT share API credentials with external parties
- ✅ We will maintain accurate contact information at all times
- ✅ We will respond promptly to Google Ads API team communications
- ✅ We comply with all Google Ads API Terms of Service
- ✅ We comply with LGPD (Brazilian data protection regulations)

---

## 12. Appendices

### Appendix A: Database Schema
```sql
-- CRM Settings table storing Google Ads credentials
CREATE TABLE "CrmSettings" (
  "id" TEXT PRIMARY KEY,
  "googleAdsClientId" TEXT,
  "googleAdsClientSecret" TEXT,
  "googleAdsDeveloperToken" TEXT,
  "googleAdsCustomerId" TEXT,
  "googleAdsRefreshToken" TEXT,
  "googleAdsConnected" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Conversion tracking table
CREATE TABLE "GoogleAdsConversion" (
  "id" TEXT PRIMARY KEY,
  "gclid" TEXT NOT NULL,
  "conversionAction" TEXT NOT NULL,
  "conversionValue" DECIMAL(10,2),
  "conversionDateTime" TIMESTAMP NOT NULL,
  "status" TEXT DEFAULT 'PENDING',
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

### Appendix B: API Scopes Required
- `https://www.googleapis.com/auth/adwords` - Full access to Google Ads account

### Appendix C: Screenshots
*(Note: Screenshots would be attached separately showing)*
1. CRM Dashboard with Google Ads integration section
2. Conversion tracking interface
3. OAuth2 connection flow
4. Admin settings panel

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-03 | Initial document for Standard Access application | TRCampos |

---

**End of Document**

For questions or clarifications, please contact:  
**Email:** TRCampos@gmail.com  
**Google Ads Customer ID:** 411-893-6474  
**Developer Token:** Xph0niG06NhkFI8VpTyCEQ
