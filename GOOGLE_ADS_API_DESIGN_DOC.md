# Google Ads API Integration - Design Document
**Smart Defence - Martial Arts Academy Management Platform**

---

## 1. Executive Summary

Smart Defence is a comprehensive SaaS platform designed for martial arts academies (specializing in Krav Maga). Our Google Ads API integration enables academies to track marketing performance, optimize advertising spend, and attribute student enrollments to specific campaigns.

---

## 2. Company Information

- **Company Name**: Smart Defence
- **Website**: https://smartdefence.com.br/
- **Industry**: SaaS - Education Management Software
- **Target Market**: Martial Arts Academies (Krav Maga focus)
- **Contact**: trcampos@gmail.com

---

## 3. Use Cases

### 3.1 Primary Use Case: Marketing Attribution
**Goal**: Track which Google Ads campaigns generate qualified leads and paying students.

**User Flow**:
1. Academy owner creates Google Ads campaign
2. Potential student clicks ad → lands on academy website
3. Student books trial class (conversion tracked via Google Ads API)
4. Student enrolls in membership (conversion value updated)
5. Platform calculates ROI: Customer Acquisition Cost vs Lifetime Value

### 3.2 Secondary Use Case: Campaign Optimization
**Goal**: Provide academy owners with insights to optimize ad spend.

**Features**:
- Dashboard showing cost-per-lead by campaign
- A/B testing results visualization
- Budget allocation recommendations based on performance
- Automated pause/resume of underperforming ads

### 3.3 Tertiary Use Case: Lead Nurturing Automation
**Goal**: Automatically engage leads from Google Ads.

**Workflow**:
1. Lead captured from Google Ads click
2. CRM creates lead record with UTM parameters
3. Automated email/SMS sequence triggered
4. Lead status updated in CRM
5. Conversion reported back to Google Ads

---

## 4. Technical Architecture

### 4.1 System Components

```
┌─────────────────┐
│  Google Ads API │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Smart Defence  │◄────►│  PostgreSQL  │
│  Backend API    │      │   Database   │
│  (Node.js)      │      └──────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CRM Frontend   │
│  (Vanilla JS)   │
└─────────────────┘
```

### 4.2 Integration Points

| API Endpoint | Purpose | Frequency |
|--------------|---------|-----------|
| `/api/crm/leads` | Create lead from ad click | Real-time |
| `/api/googleads/campaigns` | Fetch campaign performance | Hourly |
| `/api/googleads/conversions` | Report conversions | Event-based |
| `/api/analytics/roi` | Calculate marketing ROI | Daily |

### 4.3 Data Flow

**Step 1: Ad Click Capture**
```javascript
// Capture UTM parameters from Google Ads
const leadData = {
  source: 'google_ads',
  campaignId: utm_campaign,
  adGroupId: utm_adgroup,
  keyword: utm_term,
  gclid: google_click_id
};
```

**Step 2: Conversion Tracking**
```javascript
// Report conversion to Google Ads API
await googleAdsApi.conversions.upload({
  customerId: academyGoogleAdsId,
  conversions: [{
    gclid: lead.gclid,
    conversionAction: 'Trial_Class_Booking',
    conversionValue: 50.00,
    conversionDateTime: new Date()
  }]
});
```

**Step 3: ROI Calculation**
```javascript
// Calculate campaign ROI
const roi = {
  adSpend: campaignCost,
  revenue: studentLifetimeValue,
  profit: revenue - adSpend,
  roiPercentage: (profit / adSpend) * 100
};
```

---

## 5. API Usage Details

### 5.1 API Methods Used

- **CustomerService**: Retrieve customer account information
- **CampaignService**: List campaigns, get performance metrics
- **AdGroupService**: Fetch ad group details
- **ConversionUploadService**: Upload offline conversions
- **ReportingService**: Generate performance reports

### 5.2 Data Access Scope

- **READ**: Campaign performance data, ad group metrics
- **WRITE**: Offline conversion uploads
- **NO ACCESS**: Sensitive billing information, credit card data

### 5.3 Rate Limiting Strategy

- Maximum 1,000 API calls per hour
- Caching strategy: Performance data cached for 1 hour
- Batch conversion uploads (max 100 per request)

---

## 6. Security & Compliance

### 6.1 Authentication
- OAuth 2.0 authorization flow
- Refresh tokens stored encrypted in database
- Access tokens rotated every 60 minutes

### 6.2 Data Privacy
- LGPD compliant (Brazilian data protection law)
- User data encrypted at rest and in transit
- PII (personally identifiable information) separated from ad data
- Users can request data deletion (GDPR/LGPD right to be forgotten)

### 6.3 Access Control
- Role-based access: Only academy owners/admins can link Google Ads
- Multi-factor authentication required for API connections
- Audit logs for all API access

---

## 7. User Interface

### 7.1 CRM Dashboard

**Marketing Analytics Tab**:
```
┌──────────────────────────────────────┐
│  Marketing Performance Dashboard     │
├──────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌────────┐│
│  │ Leads   │  │ Cost/   │  │  ROI   ││
│  │   45    │  │ Lead    │  │ 340%   ││
│  │         │  │ R$ 23   │  │        ││
│  └─────────┘  └─────────┘  └────────┘│
├──────────────────────────────────────┤
│  Campaign Performance (Last 30 Days) │
│  ┌────────────────────────────────┐  │
│  │ Krav Maga Trial - 15 leads     │  │
│  │ Self Defense Course - 8 leads  │  │
│  │ Kids Classes - 22 leads        │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### 7.2 Integration Setup Flow

1. User clicks "Connect Google Ads" in CRM
2. OAuth consent screen (Google authorization)
3. Select Google Ads account to link
4. Configure conversion actions mapping
5. Test conversion tracking
6. Go live

---

## 8. API Token Usage Plan

### 8.1 Who Has Access?

**Primary Users**: 
- Academy owners (external clients)
- Smart Defence platform admins (internal)

**Access Level**:
- Academy owners: View their own campaign data only
- Platform admins: System-wide monitoring, no access to client ad accounts

### 8.2 Expected API Call Volume

| Month | Estimated Users | API Calls/Day | API Calls/Month |
|-------|----------------|---------------|-----------------|
| 1-3   | 10 academies   | 500           | 15,000          |
| 6-12  | 50 academies   | 2,500         | 75,000          |
| 12+   | 200 academies  | 10,000        | 300,000         |

### 8.3 Scaling Plan

- Auto-scaling backend infrastructure (AWS/Azure)
- Redis caching layer for frequently accessed data
- Batch processing for non-urgent updates
- Monitoring: Google Cloud Monitoring + custom alerts

---

## 9. Error Handling & Monitoring

### 9.1 Error Recovery

```javascript
try {
  await googleAdsApi.reportConversion(data);
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Queue for retry after backoff period
    await retryQueue.add(data, { delay: 60000 });
  } else {
    // Log error and notify admin
    logger.error('Google Ads API Error', error);
    notifyAdmin(error);
  }
}
```

### 9.2 Monitoring Metrics

- API response times (avg, p95, p99)
- Error rate by endpoint
- Conversion upload success rate
- Daily active users connecting Google Ads

---

## 10. Compliance Checklist

- ✅ OAuth 2.0 implementation
- ✅ Data encryption (TLS 1.3)
- ✅ LGPD compliance (Brazilian data protection)
- ✅ User consent for data collection
- ✅ Audit logging of API access
- ✅ Rate limiting implementation
- ✅ Error handling and retry logic
- ✅ Multi-tenant data isolation
- ✅ Regular security audits
- ✅ Privacy policy disclosure

---

## 11. Support & Maintenance

### 11.1 Support Channels

- In-app help center
- Email: support@smartdefence.com.br
- Response time: 24 hours for critical issues

### 11.2 Maintenance Schedule

- API health checks: Every 5 minutes
- OAuth token refresh: Automated
- Performance reviews: Monthly
- Security patches: As needed (within 48 hours)

---

## 12. Future Enhancements

**Phase 2** (6-12 months):
- Automated budget optimization
- Predictive analytics (ML-based conversion forecasting)
- Multi-platform attribution (Google Ads + Facebook + Instagram)

**Phase 3** (12+ months):
- White-label solution for larger academy networks
- Advanced A/B testing framework
- Custom attribution models

---

## 13. Conclusion

This Google Ads API integration will empower martial arts academies to make data-driven marketing decisions, optimize advertising spend, and grow their student base efficiently. Our platform adheres to Google's API policies, implements industry-standard security practices, and provides measurable value to our users.

---

**Document Version**: 1.0  
**Last Updated**: October 7, 2025  
**Contact**: trcampos@gmail.com  
**Company**: Smart Defence (https://smartdefence.com.br/)
