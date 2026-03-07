# Task Instructions Format

**How to structure task instructions for proper AI verification**

---

## 📋 Database Schema

### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  shopkeeper_id UUID REFERENCES shopkeepers(id),
  shelf_space_id UUID REFERENCES shelf_spaces(id),
  
  -- Instructions stored as JSONB
  instructions JSONB NOT NULL,
  
  status VARCHAR(20) DEFAULT 'assigned',
  earnings DECIMAL(10,2) NOT NULL,
  proof_photo_url TEXT,
  verification_result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Campaigns Table
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  product_category VARCHAR(100) NOT NULL,
  placement_requirements JSONB NOT NULL,
  product_dimensions JSONB NOT NULL,
  ...
);
```

---

## 📝 Task Instructions JSONB Format

### Required Structure
```json
{
  "description": "Place 2 Coca-Cola 500ml bottles on the top shelf at eye level",
  "product_name": "Coca-Cola 500ml Bottle",
  "category": "Beverages",
  "quantity": 2,
  "location": "Top shelf, eye level",
  "placement_details": {
    "shelf_level": "top",
    "position": "eye level",
    "alignment": "vertical",
    "spacing": "evenly spaced"
  },
  "requirements": [
    "Products must be clearly visible",
    "Labels facing forward",
    "No obstruction from other items"
  ]
}
```

### Minimal Structure (Backward Compatible)
```json
{
  "text": "Place products on shelf",
  "productName": "Coca-Cola",
  "count": 2
}
```

---

## 🔄 How It Works

### 1. Task Creation (Campaign Matching)
```typescript
// When creating a task from campaign
const task = {
  campaign_id: campaign.id,
  shopkeeper_id: shopkeeper.id,
  shelf_space_id: space.id,
  earnings: campaign.payout_per_task,
  
  // Build instructions from campaign data
  instructions: {
    description: `Place ${campaign.placement_requirements.quantity} ${campaign.product_name} on ${campaign.placement_requirements.location}`,
    product_name: campaign.product_name,
    category: campaign.product_category,
    quantity: campaign.placement_requirements.quantity,
    location: campaign.placement_requirements.location,
    placement_details: campaign.placement_requirements.details,
    requirements: campaign.placement_requirements.requirements
  }
};

await TaskOperations.create(task);
```

### 2. Task Verification (API Route)
```typescript
// Fetch task from database
const task = await TaskOperations.getById(taskId);

// Parse JSONB instructions
const instructions = typeof task.instructions === 'string' 
  ? JSON.parse(task.instructions) 
  : task.instructions;

// Extract for AI verification
const taskInstructions = instructions.description || instructions.text;
const productDetails = {
  name: instructions.product_name || instructions.productName,
  category: instructions.category || instructions.product_category,
  quantity: instructions.quantity || instructions.count,
  location: instructions.location || instructions.target_location
};

// Call Bedrock with context
const result = await verifyTaskCompletion(
  beforePhoto,
  afterPhoto,
  'image/jpeg',
  shopkeeperId,
  taskInstructions,
  productDetails
);
```

### 3. Bedrock Prompt Generation
```typescript
function generateProofVerificationPrompt(
  taskInstructions: string,
  productDetails: ProductDetails
): string {
  return `
Compare these two retail shelf photos (before and after).

TARGET PRODUCT SPECIFICATION:
- Product Name: ${productDetails.name}
- Category: ${productDetails.category}
- Required Quantity: ${productDetails.quantity}
- Target Location: ${productDetails.location}

TASK INSTRUCTIONS:
${taskInstructions}

Verify the placement matches these specifications.
`;
}
```

---

## 📊 Example Scenarios

### Scenario 1: Beverage Placement
```json
{
  "description": "Place 2 Coca-Cola 500ml bottles on the top shelf at eye level, labels facing forward",
  "product_name": "Coca-Cola 500ml Bottle",
  "category": "Beverages",
  "quantity": 2,
  "location": "Top shelf, eye level",
  "placement_details": {
    "shelf_level": "top",
    "position": "eye level",
    "alignment": "vertical",
    "spacing": "5cm apart",
    "orientation": "labels forward"
  },
  "requirements": [
    "Products must be clearly visible",
    "Labels facing forward",
    "No obstruction from other items",
    "Bottles upright and stable"
  ]
}
```

**Bedrock Verification:**
```
✅ Check: 2 Coca-Cola bottles present
✅ Check: On top shelf
✅ Check: At eye level
✅ Check: Labels facing forward
✅ Check: Clearly visible
```

### Scenario 2: Snack Placement
```json
{
  "description": "Place 3 Lays chips packets on middle shelf, left side",
  "product_name": "Lays Classic Chips 50g",
  "category": "Snacks",
  "quantity": 3,
  "location": "Middle shelf, left side",
  "placement_details": {
    "shelf_level": "middle",
    "position": "left side",
    "alignment": "horizontal",
    "spacing": "touching"
  },
  "requirements": [
    "Packets must be visible",
    "No damage to packaging",
    "Expiry date visible"
  ]
}
```

**Bedrock Verification:**
```
✅ Check: 3 Lays chips packets present
✅ Check: On middle shelf
✅ Check: On left side
✅ Check: Packets undamaged
✅ Check: Expiry dates visible
```

### Scenario 3: Household Products
```json
{
  "description": "Place 1 Surf Excel 1kg detergent box on bottom shelf, right corner",
  "product_name": "Surf Excel Matic 1kg",
  "category": "Household",
  "quantity": 1,
  "location": "Bottom shelf, right corner",
  "placement_details": {
    "shelf_level": "bottom",
    "position": "right corner",
    "alignment": "standing",
    "spacing": "N/A"
  },
  "requirements": [
    "Box must be upright",
    "Brand logo visible",
    "Easy to reach"
  ]
}
```

**Bedrock Verification:**
```
✅ Check: 1 Surf Excel box present
✅ Check: On bottom shelf
✅ Check: In right corner
✅ Check: Box upright
✅ Check: Logo visible
```

---

## 🔧 Implementation Guide

### Step 1: Campaign Creation
```typescript
// Brand creates campaign
const campaign = {
  product_name: "Coca-Cola 500ml Bottle",
  product_category: "Beverages",
  placement_requirements: {
    quantity: 2,
    location: "Top shelf, eye level",
    details: {
      shelf_level: "top",
      position: "eye level",
      alignment: "vertical"
    },
    requirements: [
      "Products must be clearly visible",
      "Labels facing forward"
    ]
  }
};
```

### Step 2: Task Assignment
```typescript
// System creates task when campaign matches
const task = {
  campaign_id: campaign.id,
  shopkeeper_id: shopkeeper.id,
  instructions: {
    description: `Place ${campaign.placement_requirements.quantity} ${campaign.product_name} on ${campaign.placement_requirements.location}`,
    product_name: campaign.product_name,
    category: campaign.product_category,
    quantity: campaign.placement_requirements.quantity,
    location: campaign.placement_requirements.location,
    placement_details: campaign.placement_requirements.details,
    requirements: campaign.placement_requirements.requirements
  },
  earnings: campaign.payout_per_task
};
```

### Step 3: Shopkeeper Views Task
```typescript
// Frontend displays task
<TaskCard>
  <h3>{task.instructions.description}</h3>
  <div>
    <p>Product: {task.instructions.product_name}</p>
    <p>Quantity: {task.instructions.quantity}</p>
    <p>Location: {task.instructions.location}</p>
    <p>Reward: ₹{task.earnings}</p>
  </div>
  <ul>
    {task.instructions.requirements.map(req => (
      <li key={req}>{req}</li>
    ))}
  </ul>
</TaskCard>
```

### Step 4: Verification
```typescript
// API extracts and passes to Bedrock
const instructions = task.instructions;
const productDetails = {
  name: instructions.product_name,
  category: instructions.category,
  quantity: instructions.quantity,
  location: instructions.location
};

const result = await verifyTaskCompletion(
  beforePhoto,
  afterPhoto,
  'image/jpeg',
  shopkeeperId,
  instructions.description,
  productDetails
);
```

---

## ✅ Validation Rules

### Required Fields
```typescript
interface TaskInstructions {
  // At least one of these
  description?: string;
  text?: string;
  
  // Product identification
  product_name?: string;
  productName?: string;
  
  // Quantity
  quantity?: number;
  count?: number;
  
  // Location
  location?: string;
  target_location?: string;
  
  // Category (optional but recommended)
  category?: string;
  product_category?: string;
}
```

### Validation Function
```typescript
function validateTaskInstructions(instructions: any): boolean {
  // Must have description or text
  if (!instructions.description && !instructions.text) {
    return false;
  }
  
  // Must have product name
  if (!instructions.product_name && !instructions.productName) {
    return false;
  }
  
  // Must have quantity
  if (!instructions.quantity && !instructions.count) {
    return false;
  }
  
  return true;
}
```

---

## 🎯 Best Practices

### 1. Be Specific
```json
// ❌ Bad
{
  "description": "Place products",
  "product_name": "Coke"
}

// ✅ Good
{
  "description": "Place 2 Coca-Cola 500ml bottles on top shelf at eye level",
  "product_name": "Coca-Cola 500ml Bottle",
  "quantity": 2,
  "location": "Top shelf, eye level"
}
```

### 2. Include Visual Details
```json
{
  "description": "...",
  "placement_details": {
    "orientation": "labels forward",
    "alignment": "vertical",
    "spacing": "evenly spaced"
  }
}
```

### 3. Add Requirements
```json
{
  "requirements": [
    "Products must be clearly visible",
    "Labels facing forward",
    "No obstruction from other items",
    "Products at eye level"
  ]
}
```

### 4. Use Consistent Naming
```json
// Choose one naming convention
{
  "product_name": "...",  // snake_case
  "quantity": 2,
  "location": "..."
}

// OR

{
  "productName": "...",   // camelCase
  "quantity": 2,
  "location": "..."
}
```

---

## 🧪 Testing

### Test Case 1: Complete Instructions
```json
{
  "description": "Place 2 Coca-Cola 500ml bottles on top shelf",
  "product_name": "Coca-Cola 500ml Bottle",
  "category": "Beverages",
  "quantity": 2,
  "location": "Top shelf, eye level"
}
```
**Expected:** AI can verify all aspects

### Test Case 2: Minimal Instructions
```json
{
  "text": "Place Coke",
  "productName": "Coca-Cola",
  "count": 2
}
```
**Expected:** AI can verify basic placement

### Test Case 3: Missing Details
```json
{
  "description": "Place products"
}
```
**Expected:** AI gives generic feedback

---

**Last Updated:** March 7, 2026  
**Status:** Implementation Guide  
**Next:** Test with real campaign data

