# Bugfix Requirements Document

## Introduction

This document addresses issues with the "Launch Campaign" functionality in the brand dashboard system. After a brand fills out the campaign creation form and clicks "Launch Campaign", the system should redirect to the dashboard with correct data displayed, including wallet balance, campaign information, and transaction history. Currently, the dashboard is not displaying the correct data after campaign launch, and the wallet recharge history is not visible.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a brand launches a campaign THEN the system redirects to `/brand/dashboard` but the dashboard data does not reflect the newly created campaign

1.2 WHEN a brand views the dashboard after launching a campaign THEN the wallet balance may not be updated to reflect the budget deduction

1.3 WHEN a brand views the wallet page THEN the recharge history is not displayed (transactions array is empty)

1.4 WHEN a brand views the dashboard THEN the "Recent Activity" section may show campaigns instead of actual completed tasks with proof images

1.5 WHEN the brand dashboard API is called THEN it may return incomplete or incorrect data for wallet balance, active campaigns, or transaction history

### Expected Behavior (Correct)

2.1 WHEN a brand launches a campaign THEN the system SHALL redirect to `/brand/dashboard` and display the updated wallet balance reflecting the budget deduction

2.2 WHEN a brand views the dashboard after launching a campaign THEN the system SHALL show the newly created campaign in the active campaigns count and update the "Escrowed (Active Bids)" amount

2.3 WHEN a brand views the wallet page THEN the system SHALL display the complete recharge history including all wallet recharge transactions with timestamps, amounts, and payment methods

2.4 WHEN a brand views the dashboard THEN the "Recent Activity" section SHALL display actual completed tasks with real proof images from shopkeepers, not campaign data

2.5 WHEN the brand dashboard API is called THEN it SHALL return accurate and complete data including current wallet balance, active campaigns count, escrowed budget, total spent, successful placements, and recent activity with proof images

2.6 WHEN a brand recharges their wallet THEN the system SHALL record the transaction and display it in the wallet transaction history

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a brand creates a campaign with valid data THEN the system SHALL CONTINUE TO save the campaign to the PostgreSQL database correctly

3.2 WHEN a brand creates a campaign THEN the system SHALL CONTINUE TO deduct the campaign budget from the brand's wallet balance

3.3 WHEN a brand has insufficient wallet balance THEN the system SHALL CONTINUE TO return a 402 error with an appropriate message

3.4 WHEN a brand recharges their wallet THEN the system SHALL CONTINUE TO update the brand's wallet balance in the database

3.5 WHEN a brand views the campaign creation form THEN the system SHALL CONTINUE TO display the form with all required fields (Product Name, Category, Total Budget, Reward per Placement)
