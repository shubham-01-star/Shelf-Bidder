const { Client } = require('pg');

async function seed() {
  const c = new Client({
    host: 'localhost', port: 5432, database: 'shelfbidder',
    user: 'postgres', password: 'postgres'
  });
  await c.connect();

  // Clean existing test data
  await c.query('DELETE FROM wallet_transactions');
  await c.query('DELETE FROM tasks');
  await c.query('DELETE FROM shelf_spaces');
  await c.query('DELETE FROM campaigns');
  console.log('Cleaned existing data');

  const skId = '7f4e7418-ce32-4d6c-8604-6c01d06a5db2'; // existing shopkeeper UUID

  // Campaign 1
  const camp1 = await c.query(
    `INSERT INTO campaigns (agent_id, brand_name, product_name, product_category, budget, remaining_budget, payout_per_task, target_locations, placement_requirements, product_dimensions, start_date, end_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW() + INTERVAL '30 days', 'active')
     RETURNING id`,
    ['agent-001', 'PepsiCo', 'Pepsi 500ml', 'beverages', 50000, 45000, 150,
     ['Gurgaon','Delhi'],
     JSON.stringify({type:'position',description:'Eye level',required:true}),
     JSON.stringify({width:7,height:22,depth:7,unit:'cm'})]
  );
  const campId = camp1.rows[0].id;
  console.log('Campaign 1:', campId);

  // Campaign 2
  const camp2 = await c.query(
    `INSERT INTO campaigns (agent_id, brand_name, product_name, product_category, budget, remaining_budget, payout_per_task, target_locations, placement_requirements, product_dimensions, start_date, end_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW() + INTERVAL '15 days', 'active')
     RETURNING id`,
    ['agent-002', 'Coca-Cola India', 'Coca-Cola 330ml', 'beverages', 75000, 60000, 200,
     ['Gurgaon','Noida'],
     JSON.stringify({type:'visibility',description:'High visibility',required:true}),
     JSON.stringify({width:6,height:15,depth:6,unit:'cm'})]
  );
  console.log('Campaign 2:', camp2.rows[0].id);

  // Shelf Space (correct columns: shopkeeper_id, photo_url, empty_spaces, current_inventory, analysis_confidence)
  const ss = await c.query(
    `INSERT INTO shelf_spaces (shopkeeper_id, photo_url, empty_spaces, current_inventory, analysis_confidence, analysis_date)
     VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
    [skId, 'https://staging-shelf-bidder-photos-338261675242.s3.amazonaws.com/shelf/test/sample.jpg',
     JSON.stringify([
       {id:'space-1',coordinates:{x:10,y:20,width:30,height:15},shelf_level:2,visibility:'high',accessibility:'easy'},
       {id:'space-2',coordinates:{x:50,y:20,width:25,height:15},shelf_level:2,visibility:'medium',accessibility:'easy'}
     ]),
     JSON.stringify([
       {name:'Parle-G Biscuits',category:'snacks',confidence:92,coordinates:{x:0,y:20,width:10,height:15}},
       {name:'Amul Butter',category:'dairy',confidence:88,coordinates:{x:40,y:20,width:10,height:15}}
     ]),
     85]
  );
  const ssId = ss.rows[0].id;
  console.log('ShelfSpace:', ssId);

  // Task 1 - assigned
  const t1 = await c.query(
    `INSERT INTO tasks (campaign_id, shopkeeper_id, shelf_space_id, instructions, status, assigned_date, earnings)
     VALUES ($1, $2, $3, $4, 'assigned', NOW(), 150) RETURNING id, status`,
    [campId, skId, ssId,
     JSON.stringify({productName:'Pepsi 500ml',steps:['Place 3 bottles on eye-level shelf','Ensure label faces front','Take photo as proof'],targetLocation:'Main Counter',shelfLevel:2})]
  );
  console.log('Task1 (assigned):', t1.rows[0]);

  // Task 2 - completed
  const t2 = await c.query(
    `INSERT INTO tasks (campaign_id, shopkeeper_id, shelf_space_id, instructions, status, assigned_date, completed_date, earnings)
     VALUES ($1, $2, $3, $4, 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 200) RETURNING id, status`,
    [campId, skId, ssId,
     JSON.stringify({productName:'Coca-Cola 330ml',steps:['Place on counter','Face label forward'],targetLocation:'Counter',shelfLevel:1})]
  );
  console.log('Task2 (completed):', t2.rows[0]);

  // Task 3 - in_progress
  const t3 = await c.query(
    `INSERT INTO tasks (campaign_id, shopkeeper_id, shelf_space_id, instructions, status, assigned_date, earnings)
     VALUES ($1, $2, $3, $4, 'in_progress', NOW() - INTERVAL '1 hour', 100) RETURNING id, status`,
    [campId, skId, ssId,
     JSON.stringify({productName:'Lays Classic 50g',steps:['Place 5 packets on snack shelf','Remove expired stock','Take before and after photo'],targetLocation:'Snack Aisle',shelfLevel:3})]
  );
  console.log('Task3 (in_progress):', t3.rows[0]);

  // Wallet Transactions
  await c.query(
    `INSERT INTO wallet_transactions (shopkeeper_id, task_id, type, amount, description, status, transaction_date)
     VALUES
       ($1, $2, 'earning', 200, 'Task completed: Coca-Cola placement', 'completed', NOW() - INTERVAL '1 day'),
       ($1, NULL, 'earning', 245, 'Task completed: Pepsi promotion', 'completed', NOW() - INTERVAL '2 hours'),
       ($1, NULL, 'earning', 100, 'Bonus: First week completion', 'completed', NOW() - INTERVAL '3 days'),
       ($1, NULL, 'payout', 500, 'Withdrawal to UPI', 'completed', NOW() - INTERVAL '5 days'),
       ($1, NULL, 'earning', 95, 'Task completed: Lays display', 'pending', NOW())`,
    [skId, t2.rows[0].id]
  );
  console.log('Transactions: 5 created');

  // Verify counts
  const counts = await c.query(`
    SELECT
      (SELECT COUNT(*) FROM shopkeepers) as shopkeepers,
      (SELECT COUNT(*) FROM campaigns) as campaigns,
      (SELECT COUNT(*) FROM shelf_spaces) as shelf_spaces,
      (SELECT COUNT(*) FROM tasks) as tasks,
      (SELECT COUNT(*) FROM wallet_transactions) as transactions
  `);
  console.log('\nFinal counts:', counts.rows[0]);
  console.log('\n=== DATABASE SEEDED SUCCESSFULLY ===');
  await c.end();
}

seed().catch(e => { console.error('Seed error:', e.message); process.exit(1); });
