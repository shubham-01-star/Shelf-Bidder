#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ShelfBidderStack } from '../lib/shelf-bidder-stack';

const app = new cdk.App();

new ShelfBidderStack(app, 'ShelfBidderStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Shelf-Bidder Autonomous Retail Ad-Network Infrastructure',
});

app.synth();
