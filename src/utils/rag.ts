// Client-side RAG Utility for FRIDAY

export interface DocumentChunk {
  id: string;
  fileName: string;
  text: string;
  embedding?: number[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'processing' | 'ready' | 'error';
  chunksCount: number;
}

// Pre-loaded Arduino and IoT Cheat Sheets (acting as a base knowledge base)
export const PRELOADED_ARDUINO_KNOWLEDGE: DocumentChunk[] = [
  {
    id: 'uno-spec',
    fileName: 'System Arduino Uno Specs',
    text: `Arduino Uno R3 Specifications:
- Microcontroller: ATmega328P (8-bit AVR).
- Operating Voltage: 5V (DO NOT exceed 5V on digital pins, power via Vin/USB).
- Input Voltage (recommended): 7-12V.
- Digital I/O Pins: 14 (of which 6 provide PWM output: D3, D5, D6, D9, D10, D11).
- Analog Input Pins: 6 (A0 to A5, 10-bit resolution).
- DC Current per I/O Pin: 20 mA.
- Flash Memory: 32 KB (ATmega328P) of which 0.5 KB used by bootloader.
- SRAM: 2 KB.
- EEPROM: 1 KB.
- Clock Speed: 16 MHz.
- I2C (Wire) pins: SDA (A4), SCL (A5).
- SPI pins: MOSI (11), MISO (12), SCK (13), SS (10).
- UART pins: RX (0), TX (1).`
  },
  {
    id: 'esp32-spec',
    fileName: 'System ESP32 Specs',
    text: `ESP32 DevKit V1 Specifications:
- Microcontroller: ESP32-WROOM-32 (32-bit dual-core Tensilica Xtensa LX6).
- Operating Voltage: 3.3V (All pins are 3.3V logic. Connecting 5V will FRY the board!).
- Input Voltage (VIN): 5V to 9V.
- Flash Memory: 4 MB (external).
- SRAM: 520 KB.
- Clock Speed: 240 MHz.
- WiFi: 802.11 b/g/n (up to 150 Mbps).
- Bluetooth: v4.2 BR/EDR and BLE.
- Digital I/O Pins: 25+ GPIOs, many with PWM capability.
- ADC Pins: 15+ pins (12-bit resolution, GPIO 32-39, 4, 0, 2, 12-15, 25-27). Note: ADC2 cannot be used when WiFi is active.
- DAC Pins: 2 pins (8-bit, GPIO 25, 26).
- I2C pins: SDA (GPIO 21), SCL (GPIO 22) default.
- SPI pins: MOSI (GPIO 23), MISO (GPIO 19), SCK (GPIO 18), SS (GPIO 5) default.
- UART pins: RX2 (GPIO 16), TX2 (GPIO 17) default for Serial2.`
  },
  {
    id: 'esp8266-spec',
    fileName: 'System NodeMCU ESP8266 Specs',
    text: `NodeMCU ESP8266 Specifications:
- Microcontroller: ESP8266 (32-bit Tensilica L106).
- Operating Voltage: 3.3V (Pins are NOT 5V tolerant!).
- Input Voltage (USB): 5V.
- Flash Memory: 4 MB.
- SRAM: 80 KB.
- Clock Speed: 80 MHz or 160 MHz.
- WiFi: 802.11 b/g/n (2.4 GHz).
- Digital I/O Pins: 11 GPIOs (labeled D0 to D10). All except D0 support PWM, Interrupt, I2C, and 1-Wire.
- Analog Input Pin: 1 pin (A0, 10-bit resolution, 0 to 1.0V max limit on ESP8266 chip, but NodeMCU board usually includes divider for 0 to 3.3V).
- I2C pins: SDA (D2 / GPIO 4), SCL (D1 / GPIO 5) default.
- SPI pins: MOSI (D7 / GPIO 13), MISO (D6 / GPIO 12), SCK (D5 / GPIO 14), SS (D8 / GPIO 15) default.`
  },
  {
    id: 'wifi-connect',
    fileName: 'Arduino WiFi Library Code',
    text: `Standard Code to Connect ESP32/ESP8266 to WiFi:
#ifdef ESP32
#include <WiFi.h>
#else
#include <ESP8266WiFi.h>
#endif

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

void setup() {
  Serial.begin(115200);
  delay(10);
  Serial.println("Connecting to WiFi...");
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {}`
  },
  {
    id: 'mqtt-pubsub',
    fileName: 'PubSubClient MQTT Library Code',
    text: `Standard PubSubClient (MQTT) code template:
#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";
const char* mqtt_server = "broker.hivemq.com"; // Test broker

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
  delay(10);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ESP32Client")) {
      Serial.println("connected");
      client.subscribe("inTopic");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Publish sensor reading every 10s
  static unsigned long lastMsg = 0;
  if (millis() - lastMsg > 10000) {
    lastMsg = millis();
    float temp = 24.5; // Dummy temp
    char tempString[8];
    dtostrf(temp, 1, 2, tempString);
    client.publish("esp32/temperature", tempString);
  }
}`
  },
  {
    id: 'dht11-code',
    fileName: 'DHT Temperature/Humidity Code',
    text: `DHT11/DHT22 Sensor Reading Code (Adafruit DHT Library):
#include "DHT.h"

#define DHTPIN 4     // Digital pin connected to the DHT sensor (GPIO 4 on ESP32 or D2 on Uno)
#define DHTTYPE DHT22   // DHT 22 (AM2302), AM2321 or DHT11

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  Serial.println(F("DHTxx test!"));
  dht.begin();
}

void loop() {
  // Wait a few seconds between measurements.
  delay(2000);

  float h = dht.readHumidity();
  float t = dht.readTemperature(); // Read temp in Celsius

  // Check if any reads failed and exit early (to try again).
  if (isnan(h) || isnan(t)) {
    Serial.println(F("Failed to read from DHT sensor!"));
    return;
  }

  Serial.print(F("Humidity: "));
  Serial.print(h);
  Serial.print(F("%  Temperature: "));
  Serial.print(t);
  Serial.println(F("°C"));
}`
  }
];

// Helper to chunk text
export function chunkText(text: string, maxLength = 600): string[] {
  if (!text) return [];
  
  const paragraphs = text.split(/\n+/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const para of paragraphs) {
    const cleanPara = para.trim();
    if (!cleanPara) continue;
    
    if ((currentChunk + '\n' + cleanPara).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      
      // If a single paragraph is longer than maxLength, split it by sentences
      if (cleanPara.length > maxLength) {
        const sentences = cleanPara.split(/(?<=[.!?])\s+/);
        currentChunk = '';
        for (const sent of sentences) {
          if ((currentChunk + ' ' + sent).length > maxLength) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sent;
          } else {
            currentChunk = currentChunk ? `${currentChunk} ${sent}` : sent;
          }
        }
      } else {
        currentChunk = cleanPara;
      }
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n${cleanPara}` : cleanPara;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Call Gemini Embeddings API
export async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Failed to generate embedding');
    }

    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.error('Embedding API Error:', error);
    throw error;
  }
}

// Vector similarity helper
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Search local chunks
export async function searchChunks(
  query: string,
  chunks: DocumentChunk[],
  apiKey: string,
  topK = 4
): Promise<DocumentChunk[]> {
  if (!apiKey || chunks.length === 0) return [];
  
  try {
    const queryEmbedding = await getEmbedding(query, apiKey);
    
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        // If chunk doesn't have an embedding, try to generate it now
        if (!chunk.embedding) {
          try {
            chunk.embedding = await getEmbedding(chunk.text, apiKey);
          } catch (e) {
            console.error('Failed to embed chunk:', chunk.id, e);
            return { chunk, score: 0 };
          }
        }
        
        const score = cosineSimilarity(queryEmbedding, chunk.embedding);
        return { chunk, score };
      })
    );
    
    // Sort and return top K
    return results
      .filter((r) => r.score > 0.1) // filter out completely irrelevant matches
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((r) => r.chunk);
  } catch (error) {
    console.error('Error during vector search:', error);
    // Fallback: simple case-insensitive text search
    const queryLower = query.toLowerCase();
    return chunks
      .map((chunk) => {
        const occurrences = (chunk.text.toLowerCase().match(new RegExp(escapeRegExp(queryLower), 'g')) || []).length;
        return { chunk, score: occurrences };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((r) => r.chunk);
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Client-side PDF Text Extractor using pdfjs-dist via CDN
export function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = async function () {
      try {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        
        // Ensure PDF.js is loaded from global window
        const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
        if (!pdfjsLib) {
          // Dynamic load if not already loaded
          await loadPdfJS();
        }
        
        const currentPdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
        if (!currentPdfjsLib) {
          throw new Error('PDF.js library could not be loaded.');
        }

        // Configure worker path
        currentPdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        
        const pdf = await currentPdfjsLib.getDocument({ data: typedarray }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += `\n--- Page ${i} ---\n` + pageText;
        }
        
        resolve(fullText);
      } catch (error) {
        reject(error);
      }
    };
    
    fileReader.onerror = () => reject(fileReader.error);
    fileReader.readAsArrayBuffer(file);
  });
}

function loadPdfJS(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load PDFJS CDN. Check internet connection.'));
    };
    document.head.appendChild(script);
  });
}
