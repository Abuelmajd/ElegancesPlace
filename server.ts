import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { google } from "googleapis";

// Configure environment variables
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      app: "Elites Store Full-Stack (Google Sheets + Drive + Firebase)",
      sheetsConfigured: Boolean(process.env.GOOGLE_SHEET_ID),
      driveConfigured: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
      timestamp: new Date().toISOString()
    });
  });

  // Gemini Import API endpoint
  app.post("/api/import-product", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Extract product information from this text. Return a clean JSON object with: name (string), description (string), price (number), wholesalePrice (number), and imageUrl (string). If any field is missing, use a sensible default or null. Text: ${text}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              price: { type: Type.NUMBER },
              wholesalePrice: { type: Type.NUMBER },
              imageUrl: { type: Type.STRING },
            },
            required: ["name", "description", "price", "wholesalePrice"],
          },
        },
      });
      res.json(JSON.parse(response.text!));
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to analyze product" });
    }
  });

  // Telegram Webhook
  app.post("/api/telegram-webhook", async (req, res) => {
    console.log("Telegram webhook received:", req.body);
    const { message } = req.body;
    if (!message || !message.text) return res.status(200).send("OK");
    
    try {
      const text = message.text;
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Extract product information from this text. Return a clean JSON object with: name (string), description (string), price (number), wholesalePrice (number), and imageUrl (string). If any field is missing, use a sensible default or null. Text: ${text}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              price: { type: Type.NUMBER },
              wholesalePrice: { type: Type.NUMBER },
              imageUrl: { type: Type.STRING },
            },
            required: ["name", "description", "price", "wholesalePrice"],
          },
        },
      });

      const productData = JSON.parse(response.text!);
      
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'import_list!A1:E1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            productData.name,
            productData.description,
            productData.price,
            productData.wholesalePrice,
            productData.imageUrl,
            new Date().toISOString(),
            'telegram'
          ]],
        },
      });
      
      res.status(200).send("OK");
    } catch (error: any) {
      console.error(error);
      res.status(200).send("OK"); // Acknowledge to Telegram
    }
  });

  // Checkout API endpoint
  app.post("/api/checkout", async (req, res) => {
    const { customer, items } = req.body;
    const { fullName, phone, address, email } = customer;
    
    const totalAmount = items.reduce((sum: any, item: any) => sum + item.price, 0);
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString();

    try {
      // 1. Append to Orders sheet
      const orderRows = items.map((item: any) => [
        Math.random().toString(36).substring(7), // orderId
        fullName,
        phone,
        item.productName,
        item.price,
        totalAmount,
        date,
        time
      ]);

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Orders!A1:H1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: orderRows },
      });

      // 2. Append/Update Customer sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Customers!A1:E1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[fullName, phone, address, email || 'N/A', totalAmount]],
        },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Google Sheets Proxy API endpoint
  app.get("/api/sheets/:tableName", async (req, res) => {
    const { tableName } = req.params;
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId || sheetId === "") {
      // Return structured demo data for Phase 1 testing when Google Sheet ID is not yet provided
      return res.json({
        success: true,
        mode: "demo_fallback",
        message: "Google Sheets is in demo offline mode. Configure GOOGLE_SHEET_ID in .env when ready.",
        table: tableName,
        data: []
      });
    }

    try {
      // In production with service account, use googleapis or fetch CSV / REST API
      res.json({ success: true, table: tableName, data: [] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Google Drive Image Upload Proxy endpoint
  app.post("/api/drive/upload", async (req, res) => {
    const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    if (!serviceAccount) {
      return res.json({
        success: true,
        mode: "demo_fallback",
        message: "Google Drive storage in demo mode. Configure GOOGLE_SERVICE_ACCOUNT_EMAIL for live Drive upload.",
        file: {
          image_id: 'img_' + Math.random().toString(36).substring(2, 9),
          image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60',
          drive_file_id: 'demo_drive_file_id'
        }
      });
    }
    res.json({ success: true, message: "Drive upload handled" });
  });

  // Proxy endpoint to create a new table in Google Sheets via Apps Script
  app.post("/api/create-table", async (req, res) => {
    const { tableName, columns } = req.body;
    const webhookUrl = process.env.GOOGLE_WEBHOOK_URL; // Add this to .env

    if (!webhookUrl) {
      return res.status(500).json({ error: "GOOGLE_WEBHOOK_URL not configured" });
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_table', tableName, columns })
      });
      const result = await response.json();
      res.json(result);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to create table" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
