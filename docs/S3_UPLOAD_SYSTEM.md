# S3 Direct Upload System

## Overview

The Shelf-Bidder S3 direct upload system enables efficient photo uploads from the frontend directly to S3, bypassing the VPS server for file transfer. This reduces server load, improves upload speed, and scales better.

## Architecture

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │ 1. Request presigned URL
       ↓
┌─────────────────────┐
│   VPS API Server    │
│ /api/photos/        │
│   upload-url        │
└──────┬──────────────┘
       │ 2. Generate presigned URL
       ↓
┌─────────────────────┐
│    AWS S3 Bucket    │
│ shelf-bidder-photos