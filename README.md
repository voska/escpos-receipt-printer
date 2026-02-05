# Receipt Print Server with Web UI

Node.js application for printing TODO tickets and shopping lists on thermal receipt printers.

## Features

- 🎫 Print todo tickets with title, assignee, and description
- 🛒 Print shopping lists with checkboxes and quantities
- 🌐 Beautiful web UI for easy printing
- 🖨️ Support for USB and network thermal printers
- 📋 RESTful API endpoints
- 🐳 Docker support (recommended for network printers)
- 📱 Easy to integrate with other applications

## Quick Start

### Docker (Recommended for Network Printers, USB on Linux only)

1. **Configure your printer:**

   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` for your printer:**

   **For Network Printer (recommended):**

   ```bash
   PRINTER_NETWORK_IP=10.0.0.237  # Your printer's IP
   PRINTER_NETWORK_PORT=9100      # Usually 9100
   ```

   **For USB Printer (Linux only):**

   ```bash
   # Find your printer's USB IDs with: lsusb
   PRINTER_VENDOR_ID=0x20d1
   PRINTER_PRODUCT_ID=0x7008
   ```

3. **Run with Docker Compose:**

   ```bash
   docker-compose up -d
   ```

4. **Open the Web UI:**

   Navigate to `http://localhost:3000` in your browser to use the interface.

5. **Or test the API directly:**
   ```bash
   curl -X POST http://localhost:3000/api/print-todo \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test the printer setup",
       "assignee": "John Doe",
       "description": "Make sure the printer is working correctly"
     }'
   ```

### Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your printer settings
   ```

3. **Run the server:**
   ```bash
   npm run todo-server
   ```

4. **Open the Web UI:**

   Navigate to `http://localhost:3000` in your browser.

## Web UI

The application includes a modern web interface for easy printing:

- **Access:** `http://localhost:3000`
- **Features:**
  - Real-time printer status indicator
  - Todo ticket form with title, assignee, and description fields
  - Shopping list form with dynamic item management
  - Add/remove items with optional quantities
  - Toast notifications for success/error messages
  - Responsive design for mobile and desktop

## API Endpoints

### GET /

Web UI for printing tickets and shopping lists.

### POST /api/print-todo

Print a TODO ticket.

**Request Body:**

```json
{
  "title": "Fix the login bug", // Required: Main task title
  "assignee": "John Doe", // Optional: Person assigned
  "description": "Users cannot login..." // Optional: Task details
}
```

**Response:**

```json
{
  "success": true,
  "message": "Todo ticket printed successfully",
  "ticket": {
    "title": "Fix the login bug",
    "assignee": "John Doe",
    "description": "Users cannot login...",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### POST /api/print-shopping-list

Print a shopping list with checkboxes.

**Request Body:**

```json
{
  "title": "Grocery Shopping", // Optional: List title (default: "Shopping List")
  "items": [ // Required: Array of items
    "Milk",
    "Bread",
    { "name": "Eggs", "quantity": "12" },
    { "name": "Apples", "quantity": "6" },
    "Butter"
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Shopping list printed successfully",
  "list": {
    "title": "Grocery Shopping",
    "items": [...],
    "itemCount": 5,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /api

API documentation and usage examples.

### GET /health

Check server and printer status.

### GET /printer-status

Get detailed printer connection information.

## Configuration

Configure your printer in the `.env` file. Choose either USB or Network mode:

#### USB Mode

- `PRINTER_VENDOR_ID`: USB Vendor ID (hex format, e.g., `0x20d1`)
- `PRINTER_PRODUCT_ID`: USB Product ID (hex format, e.g., `0x7008`)

#### Network Mode

- `PRINTER_NETWORK_IP`: Network printer IP address
- `PRINTER_NETWORK_PORT`: Network printer port (default: 9100)

## Examples

### Using the Web UI (Easiest)

1. Navigate to `http://localhost:3000`
2. Fill out the form for either a todo or shopping list
3. Click the print button
4. Your receipt will print automatically!

### Using curl

**Print a todo ticket:**

```bash
# Simple ticket with just a title
curl -X POST http://localhost:3000/api/print-todo \
  -H "Content-Type: application/json" \
  -d '{"title":"Review pull request #123"}'

# Full ticket with assignee and description
curl -X POST http://localhost:3000/api/print-todo \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login bug",
    "assignee": "John Doe",
    "description": "Users are unable to login with special characters in their passwords"
  }'
```

**Print a shopping list:**

```bash
# Shopping list with items
curl -X POST http://localhost:3000/api/print-shopping-list \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Grocery Shopping",
    "items": [
      "Milk",
      "Bread",
      {"name": "Eggs", "quantity": "12"},
      {"name": "Apples", "quantity": "6"}
    ]
  }'
```

### Using the test client

```bash
# Simple ticket
node test-client.js "Fix login bug"

# With assignee
node test-client.js "Fix login bug" "John Doe"

# Full ticket
node test-client.js "Fix login bug" "John Doe" "Users cannot login with special chars"
```

### Using JavaScript fetch

**Print a todo ticket:**

```javascript
const response = await fetch("http://localhost:3000/api/print-todo", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Update documentation",
    assignee: "Alice Smith",
    description: "Add API documentation for the new endpoints",
  }),
});

const result = await response.json();
console.log(result);
```

**Print a shopping list:**

```javascript
const response = await fetch("http://localhost:3000/api/print-shopping-list", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Grocery Shopping",
    items: [
      "Milk",
      "Bread",
      { name: "Eggs", quantity: "12" },
      { name: "Apples", quantity: "6" }
    ],
  }),
});

const result = await response.json();
console.log(result);
```

## Docker Notes

### Recommended: Network Mode

For best compatibility across all platforms, use network-connected printers:

1. Configure your printer for network access
2. Set `PRINTER_NETWORK_IP` in your `.env` file
3. Run with Docker: `docker-compose up -d`

### USB Mode Limitations

⚠️ **USB passthrough has platform-specific limitations:**

- **Linux**: Full USB support with privileged mode
- **macOS/Windows**: USB passthrough not supported with Docker Desktop due to virtualization

**For USB printers on macOS/Windows:**

1. Run natively: `npm run todo-server`
2. Use a Linux host for Docker deployment
3. Convert to network printer (recommended)

## Troubleshooting

### Printer Not Found

1. Ensure printer is powered on and connected
2. For USB: Check USB IDs with `lsusb`
3. For Network: Verify IP address is reachable
4. Check your `.env` configuration

### Print Quality

- Ensure printer has paper loaded
- Check paper width matches expectations

## Related Files

- `todo-printer-server.js` - Main server file
- `printer.js` - Simple print test utility
- `test-client.js` - Test client for trying the API
