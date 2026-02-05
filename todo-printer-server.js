require("dotenv").config();
const express = require("express");
const usb = require("usb");
const {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
} = require("node-thermal-printer");

// Printer configuration
const PRINTER_TYPE = process.env.PRINTER_TYPE || "EPSON";

// Check if network or USB mode
const useNetworkPrinter = !!process.env.PRINTER_NETWORK_IP;

// USB configuration
let VENDOR_ID, PRODUCT_ID;
if (!useNetworkPrinter) {
  if (!process.env.PRINTER_VENDOR_ID || !process.env.PRINTER_PRODUCT_ID) {
    throw new Error(
      "For USB mode: PRINTER_VENDOR_ID and PRINTER_PRODUCT_ID environment variables are required. " +
        "For network mode: Set PRINTER_NETWORK_IP instead."
    );
  }
  VENDOR_ID = parseInt(process.env.PRINTER_VENDOR_ID, 16);
  PRODUCT_ID = parseInt(process.env.PRINTER_PRODUCT_ID, 16);
}

// Network configuration
const NETWORK_IP = process.env.PRINTER_NETWORK_IP;
const NETWORK_PORT = process.env.PRINTER_NETWORK_PORT || "9100";

class TodoPrinter {
  constructor() {
    this.printer = null;
  }

  async connect() {
    try {
      if (useNetworkPrinter) {
        // Network printer connection
        console.log(
          `Attempting network connection to ${NETWORK_IP}:${NETWORK_PORT}`
        );

        this.printer = new ThermalPrinter({
          type: PrinterTypes[PRINTER_TYPE],
          interface: `tcp://${NETWORK_IP}:${NETWORK_PORT}`,
          characterSet: CharacterSet.PC852_LATIN2,
          removeSpecialCharacters: false,
          lineCharacter: "=",
        });
      } else {
        // USB printer connection
        const device = usb.findByIds(VENDOR_ID, PRODUCT_ID);

        if (!device) {
          console.log("USB device not found");
          return false;
        }

        console.log("USB device found, connecting...");
        this.printer = new ThermalPrinter({
          type: PrinterTypes[PRINTER_TYPE],
          interface: `usb://${VENDOR_ID.toString(16).padStart(
            4,
            "0"
          )}:${PRODUCT_ID.toString(16).padStart(4, "0")}`,
          characterSet: CharacterSet.PC852_LATIN2,
          removeSpecialCharacters: false,
          lineCharacter: "=",
        });
      }

      // Test connection
      const isConnected = await this.printer.isPrinterConnected();
      return isConnected;
    } catch (error) {
      console.error("Error initializing printer:", error.message);
      return false;
    }
  }

  async printTodoTicket(title, assignee = null, description = null) {
    if (!this.printer) {
      throw new Error("Printer not initialized");
    }

    try {
      // Clear buffer
      this.printer.clear();

      // Top header with emphasis
      this.printer.alignCenter();
      this.printer.setTextSize(2, 2);
      this.printer.bold(true);
      this.printer.invert(true);
      this.printer.println(" TODO ");
      this.printer.invert(false);
      this.printer.bold(false);
      this.printer.setTextNormal();

      // Task title section
      this.printer.alignLeft();
      this.printer.drawLine();

      // Title with large text
      this.printer.setTextSize(1, 2);
      this.printer.bold(true);
      const wrappedTitle = this.wrapText(title, 24);
      wrappedTitle.split("\n").forEach((line) => {
        this.printer.println(line);
      });
      this.printer.bold(false);
      this.printer.setTextNormal();
      this.printer.newLine();

      // Assignee section with highlight
      if (assignee && assignee.trim()) {
        this.printer.setTextSize(1, 1);
        this.printer.bold(true);
        this.printer.print("OWNER: ");
        this.printer.bold(false);
        this.printer.underline(true);
        this.printer.println(assignee.trim());
        this.printer.underline(false);
        this.printer.newLine();
      }

      // Description section with indentation
      if (description && description.trim()) {
        this.printer.bold(true);
        this.printer.println("NOTES:");
        this.printer.bold(false);

        // Indent and wrap description
        const wrappedDesc = this.wrapText(description.trim(), 22); // 24 chars minus "> " prefix
        wrappedDesc.split("\n").forEach((line) => {
          this.printer.println(`> ${line}`);
        });
        this.printer.newLine();
      }

      // Timestamp
      this.printer.alignCenter();
      this.printer.setTextSize(1, 1);
      const now = new Date();

      // Round to nearest hour (9:31 -> 10a, 9:29 -> 9a)
      const roundedHour =
        now.getMinutes() >= 30 ? now.getHours() + 1 : now.getHours();
      const hour12 =
        roundedHour === 0
          ? 12
          : roundedHour > 12
          ? roundedHour - 12
          : roundedHour;
      const ampm = roundedHour >= 12 && roundedHour < 24 ? "p" : "a";

      const timestamp = `${hour12}${ampm} ${now.toLocaleDateString("en-US", {
        weekday: "short",
      })} - ${now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`;
      this.printer.println(timestamp);
      this.printer.setTextNormal();
      this.printer.alignLeft();

      // Cut paper
      this.printer.cut();

      // Execute print job
      await this.printer.execute();

      console.log("✅ Ticket printed successfully");
    } catch (error) {
      throw new Error(`Print error: ${error.message}`);
    }
  }

  async printShoppingList(title = "Shopping List", items = []) {
    if (!this.printer) {
      throw new Error("Printer not initialized");
    }

    try {
      // Clear buffer
      this.printer.clear();

      // Top header with emphasis
      this.printer.alignCenter();
      this.printer.setTextSize(2, 2);
      this.printer.bold(true);
      this.printer.invert(true);
      this.printer.println(" SHOPPING ");
      this.printer.invert(false);
      this.printer.bold(false);
      this.printer.setTextNormal();

      // List title section
      this.printer.alignLeft();
      this.printer.drawLine();

      // Title with large text
      this.printer.setTextSize(1, 2);
      this.printer.bold(true);
      const wrappedTitle = this.wrapText(title, 24);
      wrappedTitle.split("\n").forEach((line) => {
        this.printer.println(line);
      });
      this.printer.bold(false);
      this.printer.setTextNormal();
      this.printer.newLine();

      // Items section with checkboxes
      if (items && items.length > 0) {
        this.printer.setTextSize(1, 1);
        items.forEach((item, index) => {
          const itemText = typeof item === 'string' ? item : item.name || item.item || String(item);
          const quantity = item.quantity ? ` (${item.quantity})` : '';
          
          // Checkbox and item
          this.printer.bold(false);
          this.printer.print("[ ] ");
          
          // Wrap long item names
          const wrappedItem = this.wrapText(`${itemText}${quantity}`, 28); // 32 chars minus "[ ] " prefix
          const lines = wrappedItem.split("\n");
          
          // First line
          this.printer.println(lines[0]);
          
          // Additional lines with indentation
          for (let i = 1; i < lines.length; i++) {
            this.printer.println(`    ${lines[i]}`);
          }
        });
        this.printer.newLine();
      }

      // Item count
      this.printer.alignCenter();
      this.printer.setTextSize(1, 1);
      this.printer.bold(true);
      this.printer.println(`Total Items: ${items.length}`);
      this.printer.bold(false);
      this.printer.newLine();

      // Timestamp
      const now = new Date();
      const roundedHour =
        now.getMinutes() >= 30 ? now.getHours() + 1 : now.getHours();
      const hour12 =
        roundedHour === 0
          ? 12
          : roundedHour > 12
          ? roundedHour - 12
          : roundedHour;
      const ampm = roundedHour >= 12 && roundedHour < 24 ? "p" : "a";

      const timestamp = `${hour12}${ampm} ${now.toLocaleDateString("en-US", {
        weekday: "short",
      })} - ${now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`;
      this.printer.println(timestamp);
      this.printer.setTextNormal();
      this.printer.alignLeft();

      // Cut paper
      this.printer.cut();

      // Execute print job
      await this.printer.execute();

      console.log("✅ Shopping list printed successfully");
    } catch (error) {
      throw new Error(`Print error: ${error.message}`);
    }
  }

  // Simple word-wrap function
  wrapText(text, width) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= width) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines.join("\n");
  }

  disconnect() {
    // Cleanup method for graceful shutdown
    if (this.printer) {
      console.log("Printer disconnected");
    }
  }
}

// Create Express app
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Initialize printer
const printer = new TodoPrinter();
let printerConnected = false;

// Start server first, then connect to printer
app.listen(port, async () => {
  console.log(
    `📋 Todo Ticket Printer Server running on http://localhost:${port}`
  );
  console.log(`🌐 Open http://localhost:${port} in your browser to use the UI`);

  // Connect to printer after server starts
  console.log("🔌 Connecting to printer...");
  printerConnected = await printer.connect();

  if (printerConnected) {
    console.log("🖨️  Printer status: Connected ✅");
  } else {
    console.log("🖨️  Printer status: Not connected ❌");
    console.log(
      "    Make sure the printer is powered on and connected via USB or network"
    );
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    printer: printerConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Print todo ticket endpoint
app.post("/api/print-todo", async (req, res) => {
  try {
    const { title, assignee, description } = req.body;

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        error: "Title is required and must be a non-empty string",
      });
    }

    if (!printerConnected) {
      return res.status(503).json({
        error: "Printer is not connected",
      });
    }

    // Print the ticket
    await printer.printTodoTicket(
      title.trim(),
      assignee ? String(assignee).trim() : null,
      description ? String(description).trim() : null
    );

    res.json({
      success: true,
      message: "Todo ticket printed successfully",
      ticket: {
        title: title.trim(),
        assignee: assignee ? String(assignee).trim() : null,
        description: description ? String(description).trim() : null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Print error:", error);
    res.status(500).json({
      error: "Failed to print ticket",
      details: error.message,
    });
  }
});

// Print shopping list endpoint
app.post("/api/print-shopping-list", async (req, res) => {
  try {
    const { title, items } = req.body;

    // Validate items field
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        error: "Items is required and must be an array",
      });
    }

    if (items.length === 0) {
      return res.status(400).json({
        error: "Items array cannot be empty",
      });
    }

    if (!printerConnected) {
      return res.status(503).json({
        error: "Printer is not connected",
      });
    }

    // Print the shopping list
    await printer.printShoppingList(
      title ? String(title).trim() : "Shopping List",
      items
    );

    res.json({
      success: true,
      message: "Shopping list printed successfully",
      list: {
        title: title ? String(title).trim() : "Shopping List",
        items: items,
        itemCount: items.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Print error:", error);
    res.status(500).json({
      error: "Failed to print shopping list",
      details: error.message,
    });
  }
});

// Get printer status
app.get("/printer-status", (req, res) => {
  const status = {
    connected: printerConnected,
    type: PRINTER_TYPE,
    mode: useNetworkPrinter ? "network" : "usb",
  };

  if (useNetworkPrinter) {
    status.interface = `tcp://${NETWORK_IP}:${NETWORK_PORT}`;
    status.network_ip = NETWORK_IP;
    status.network_port = NETWORK_PORT;
  } else {
    status.interface = `usb://${VENDOR_ID.toString(16).padStart(
      4,
      "0"
    )}:${PRODUCT_ID.toString(16).padStart(4, "0")}`;
    status.vendor_id = `0x${VENDOR_ID.toString(16)}`;
    status.product_id = `0x${PRODUCT_ID.toString(16)}`;
  }

  res.json(status);
});

// Basic usage info endpoint (API documentation)
app.get("/api", (req, res) => {
  res.json({
    name: "Todo Ticket Printer Server",
    version: "1.0.0",
    endpoints: {
      "GET /": "Web UI for printing",
      "GET /api": "API documentation",
      "GET /health": "Health check",
      "GET /printer-status": "Printer connection status",
      "POST /api/print-todo": "Print a todo ticket",
      "POST /api/print-shopping-list": "Print a shopping list",
    },
    usage: {
      "POST /api/print-todo": {
        body: {
          title: "string (required) - The main task title",
          assignee: "string (optional) - Person assigned to the task",
          description: "string (optional) - Additional task details",
        },
      },
      "POST /api/print-shopping-list": {
        body: {
          title: "string (optional) - Shopping list title (default: 'Shopping List')",
          items: "array (required) - List of items to buy. Can be strings or objects with 'name' and 'quantity' fields",
        },
      },
    },
    examples: {
      todo: {
        title: "Fix the login bug",
        assignee: "John Doe",
        description:
          "Users are unable to login with special characters in their passwords",
      },
      shoppingList: {
        title: "Grocery Shopping",
        items: [
          "Milk",
          "Bread",
          { name: "Eggs", quantity: "12" },
          { name: "Apples", quantity: "6" },
          "Butter",
        ],
      },
    },
  });
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down server...");
  printer.disconnect();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down server...");
  printer.disconnect();
  process.exit(0);
});
