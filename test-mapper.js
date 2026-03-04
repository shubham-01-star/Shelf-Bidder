// Test shopkeeper mapper
const shopkeeper = {
  id: '54d83438-e051-70de-6b80-df6ab6dfc9c6',
  name: 'Ramesh Kumar',
  phoneNumber: '+919876543210',
  storeAddress: '',
  preferredLanguage: 'en',
  timezone: 'Asia/Kolkata',
  walletBalance: 0,
  registrationDate: new Date().toISOString(),
  lastActiveDate: new Date().toISOString(),
};

// Simulate mapper
const now = new Date().toISOString();
const item = {
  PK: `SHOPKEEPER#${shopkeeper.id}`,
  SK: 'METADATA',
  EntityType: 'SHOPKEEPER',
  ShopkeeperId: shopkeeper.id,
  Name: shopkeeper.name,
  PhoneNumber: shopkeeper.phoneNumber,
  StoreAddress: shopkeeper.storeAddress,
  PreferredLanguage: shopkeeper.preferredLanguage,
  Timezone: shopkeeper.timezone,
  WalletBalance: shopkeeper.walletBalance,
  RegistrationDate: shopkeeper.registrationDate,
  LastActiveDate: shopkeeper.lastActiveDate,
  CreatedAt: now,
  UpdatedAt: now,
};

console.log('\n=== MAPPED ITEM ===');
console.log(JSON.stringify(item, null, 2));
console.log('\n=== KEYS ===');
console.log('PK:', item.PK);
console.log('SK:', item.SK);
console.log('ShopkeeperId:', item.ShopkeeperId);
console.log('\n==================\n');
