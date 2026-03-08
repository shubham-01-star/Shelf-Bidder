# Bugfix Requirements Document

## Introduction

The ShelfBidder app's campaign matching flow (Scene 4) fails to complete after successful AI analysis of shelf photos. When the AI detects empty shelf spaces (e.g., "2 gaps" with "95% confidence"), the system should query matching campaigns from PostgreSQL and present offers to the shopkeeper. However, the flow stops after analysis and no campaigns are matched, preventing shopkeepers from receiving task offers.

This bug prevents the core value proposition of the app - connecting shopkeepers with brand campaigns to earn money by placing products on empty shelf spaces.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN AI analysis successfully detects empty shelf spaces (e.g., 2 gaps, 95% confidence) THEN the system fails to match any campaigns and the flow stops at the "done" state without presenting offers

1.2 WHEN the `/api/campaigns/match` endpoint is called with a hardcoded location ('Gurgaon') THEN the system only finds campaigns that have exactly 'Gurgaon' in their `target_locations` array, missing campaigns with similar or nearby locations

1.3 WHEN no campaigns match the exact hardcoded location string THEN the system shows "No campaigns matched your current shelf availability" even though active campaigns may exist for nearby locations

1.4 WHEN the shopkeeper's actual location differs from the hardcoded 'Gurgaon' value THEN the system fails to match campaigns relevant to the shopkeeper's actual location

### Expected Behavior (Correct)

2.1 WHEN AI analysis successfully detects empty shelf spaces with sufficient confidence (≥85%) THEN the system SHALL query the database for matching campaigns and present the highest-paying offer to the shopkeeper

2.2 WHEN the `/api/campaigns/match` endpoint is called THEN the system SHALL use the shopkeeper's actual location from their profile (store_address) instead of a hardcoded value

2.3 WHEN querying for matching campaigns THEN the system SHALL use flexible location matching that finds campaigns for the shopkeeper's city/region, not requiring exact string matches

2.4 WHEN multiple campaigns match the location and have available budget THEN the system SHALL select and present the highest-paying campaign first

2.5 WHEN a matching campaign is found THEN the system SHALL transition to the 'offer' state and display the campaign details with "YES, Accept Task" and "NO, Out of Stock" options

### Unchanged Behavior (Regression Prevention)

3.1 WHEN AI analysis detects no empty spaces or confidence is below threshold THEN the system SHALL CONTINUE TO show the "done" state without attempting campaign matching

3.2 WHEN the photo upload or AI analysis fails THEN the system SHALL CONTINUE TO show appropriate error messages and allow retake

3.3 WHEN a campaign is successfully matched and the shopkeeper accepts THEN the system SHALL CONTINUE TO create a task with atomic budget deduction using ACID transactions

3.4 WHEN the shopkeeper clicks "NO, Out of Stock" on an offer THEN the system SHALL CONTINUE TO transition to the "done" state (future enhancement: show next best campaign)

3.5 WHEN operating in offline mode THEN the system SHALL CONTINUE TO queue photos for later sync without attempting campaign matching
