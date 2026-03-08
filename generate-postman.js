const fs = require('fs');
const path = require('path');

const srcApiDir = path.join(__dirname, 'src', 'app', 'api');

function getDirectories(srcPath) {
  return fs.readdirSync(srcPath).filter(file => fs.statSync(path.join(srcPath, file)).isDirectory());
}

function findRoutes(dir, baseRoute = '') {
  let routes = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      routes = routes.concat(findRoutes(fullPath, `${baseRoute}/${item}`));
    } else if (item === 'route.ts' || item === 'route.js') {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Basic heuristic to find exported methods
      const methods = [];
      if (content.includes('export async function GET')) methods.push('GET');
      if (content.includes('export async function POST')) methods.push('POST');
      if (content.includes('export async function PUT')) methods.push('PUT');
      if (content.includes('export async function PATCH')) methods.push('PATCH');
      if (content.includes('export async function DELETE')) methods.push('DELETE');
      
      if (methods.length > 0) {
        routes.push({
          path: baseRoute.replace(/\\/g, '/'),
          methods
        });
      }
    }
  }
  return routes;
}

const allRoutes = findRoutes(srcApiDir, '/api');

const postmanCollection = {
  info: {
    _postman_id: require('crypto').randomUUID(),
    name: "Shelf-Bidder API V2 (Auto-Generated)",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    description: "Auto-generated collection of all active APIs in the codebase."
  },
  item: []
};

// Group routes by folder
const folders = {};

allRoutes.forEach(route => {
  const parts = route.path.split('/').filter(Boolean);
  // Using the first path segment after 'api' as folder name
  const folderName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'General';
  
  if (!folders[folderName]) {
    folders[folderName] = {
      name: folderName,
      item: []
    };
  }

  route.methods.forEach(method => {
    // Attempt basic payload generation based on endpoints
    let body = null;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      body = {
        mode: 'raw',
        raw: "{\n  // Add request body here\n}",
        options: {
          raw: { language: 'json' }
        }
      };
      
      // Inject known common payloads
      if (route.path.includes('/auth/signup') && method === 'POST') {
        body.raw = JSON.stringify({
          phoneNumber: "+919902010000",
          password: "Password123!",
          name: "Test User",
          email: "test@example.com"
        }, null, 2);
      } else if (route.path.includes('/auth/signin') && method === 'POST') {
         body.raw = JSON.stringify({
          phoneNumber: "+919902010000",
          password: "Password123!"
        }, null, 2);
      } else if (route.path.includes('brand/auth') && method === 'POST') {
        body.raw = JSON.stringify({
          action: "login",
          email: "work.shubhmkumar@gmail.com",
          password: "Password123!"
        }, null, 2);
      }
    }

    folders[folderName].item.push({
      name: `[${method}] ${route.path}`,
      request: {
        method: method,
        header: [
          {
            key: "Authorization",
            value: "Bearer {{token}}",
            type: "text",
            disabled: !route.path.includes('token') // Enable by default for some
          },
          {
            key: "Content-Type",
            value: "application/json",
            type: "text"
          }
        ],
        body: body,
        url: {
          raw: `{{base_url}}${route.path}`,
          host: [
            "{{base_url}}"
          ],
          path: route.path.split('/').filter(Boolean)
        }
      },
      response: []
    });
  });
});

Object.values(folders).forEach(f => postmanCollection.item.push(f));

// Add variables
postmanCollection.variable = [
  {
    key: "base_url",
    value: "http://localhost:3000"
  },
  {
    key: "token",
    value: "your_jwt_token_here"
  }
];

fs.writeFileSync(path.join(__dirname, 'shelf-bidder-postman-collection.json'), JSON.stringify(postmanCollection, null, 2));

console.log('Postman collection generated at shelf-bidder-postman-collection.json');
