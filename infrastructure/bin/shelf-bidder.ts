#!/usr/bin/env node
/**
 * CDK App Entry Point
 *
 * Task 1.2: Configure AWS infrastructure foundation
 * Status: ✅ Completed
 * 
 * Task 14.2: Set up staging environment testing
 * Status: ✅ Completed
 */
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ShelfBidderStack } from '../lib/shelf-bidder-stack';
import { ShelfBidderStagingStack } from '../lib/shelf-bidder-staging-stack';

const app = new cdk.App();

// Production Stack
new ShelfBidderStack(app, 'ShelfBidderStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-south-1',
  },
  description: 'Shelf-Bidder Autonomous Retail Ad-Network Infrastructure (Production)',
});

// Staging Stack
new ShelfBidderStagingStack(app, 'ShelfBidderStagingStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-south-1',
  },
  description: 'Shelf-Bidder Autonomous Retail Ad-Network Infrastructure (Staging)',
});

app.synth();
