

import Groq from "groq-sdk";
import { ListingGender,ListingCondition, AI_Response } from "../../types/Data_types";

export class AI {
  private api_key: string;
  private apiUrl: string = "https://api.x.ai/v1/chat/completions";
  private groq;
  constructor() {
    this.api_key = process.env.GROQ_API_KEY || "";
    if (!this.api_key) {
      console.warn("Warning: Grok API key not found in environment variables");
    }
    this.groq= new Groq({ apiKey:this.api_key });
  }

  async extractProductInfo(description: string):Promise<AI_Response> {
    try {
      const chatCompletion = await this.getGroqChatCompletion(description);
      const content =chatCompletion.choices[0]?.message?.content;
      console.log("ai response=>",content)
    if(!content)  throw new Error("data coming from ai is wrong!") 
    
    let cleaned = content.trim();

    
    cleaned = cleaned
      .replace(/,\s*}/g, "}")       
      .replace(/,\s*]/g, "]")        
      .replace(/\\"/g, '"')          
      .replace(/"\s*}/g, '"}')       
      .replace(/true\"/g, "true")    
      .replace(/false\"/g, "false")  
      .replace(/}\s*}$/g, "}");      
    
    const parsed = JSON.parse(cleaned)
  
  return {
    price: parsed.price ?? 0,
    brand: parsed.brand ?? "",
    productType: parsed.productType ?? "",
    gender: parsed.gender ?? "unisex",
    size: parsed.size ?? "",
    condition: parsed.condition ?? "new",
    isWTB:parsed.iswtb??false,
    isWTS:parsed.iswts??true
  };

    } catch (error) {
      console.error("Error extracting product info:", error);
      // Return default values on error
      return {
        price: 0,
        brand: "",
        productType: "",
        gender: "unisex",
        size: "",
        condition: "new",
        isWTB:false,
        isWTS:true
      };
    }
  }
  
  private  getGroqChatCompletion(message:string) {

  return this.groq.chat.completions.create({

    model: "openai/gpt-oss-20b",
              messages: [
            {
                 role: "system",
    content: `You are a product information extraction assistant for a resale marketplace. 
        Extract the following information from product descriptions:
        
        **Product Details:**
        - price: Extract the numeric value only. Look for currency symbols (£, $, €, ₹) or keywords like "price", "cost". If no price found, return 0.
        - brand: Brand name (Nike, Adidas, Dior, Gucci, Supreme, etc.). Return empty string if not found.
        - productType: Type of product. Common types include:
          * Footwear: "sneakers", "trainers", "shoes", "boots", "slides"
          * Clothing: "shirt", "t-shirt", "hoodie", "jacket", "jeans", "pants", "shorts"
          * Accessories: "bag", "backpack", "watch", "hat", "belt"
          * Luxury: "handbag", "wallet", "sunglasses"
        - gender: Target gender - "men", "women", "unisex", or "kids"
        - size: Size information (UK/EU/US sizes, S/M/L/XL, numeric sizes like 9, 10, 42, etc.)
        - condition: Product condition:
          * "new" - brand new, unworn, with tags/box
          * "like new" - barely used, perfect condition
          * "used" - worn but good condition
          * "fair" - signs of wear
          * "poor" - heavy wear
        
        **Intent Detection (CRITICAL):**
        - iswtb: true ONLY if the person is looking to BUY. Look for:
          * "WTB" (want to buy)
          * "want to buy" / "wanted to buy"
          * "looking for" / "searching for"
          * "ISO" (in search of)
          * "anyone have" / "does anyone have"
          * "anybody selling"
          * "need to buy"
          
        - iswts: true ONLY if the person is looking to SELL. Look for:
          * "WTS" (want to sell)
          * "want to sell" / "selling"
          * "for sale"
          * "available" / "in stock"
          * "selling this"
          * "DM to buy" / "message to purchase"
          * Price mentioned with product (usually indicates selling)
        
        **Important Rules:**
        1. A post can ONLY be WTB OR WTS, never both.
        2. If unclear, check if there's a price → likely WTS
        3. If asking questions about availability → likely WTB
        4. If neither intent is clear → set both to false
        
        **Return JSON format:**
        {
          "price": number,
          "brand": string,
          "productType": string,
          "gender": string,
          "size": string,
          "condition": string,
          "iswtb": boolean,
          "iswts": boolean
        }
        
        **Defaults if field cannot be determined:**
        - price: 0
        - brand: ""
        - productType: ""
        - gender: "unisex"
        - size: ""
        - condition: "new"
        - iswtb: false
        - iswts: false
                     `
                 },
                 {
                   role: "user",
                   content: message
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "product_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
               price: {
                    type: "number",
                    description: "The price of the product as a number"
                  },
                  brand: {
                    type: "string",
                    description: "The brand or manufacturer name"
                  },
                  productType: {
                    type: "string",
                    description: "The type of product (e.g., shoes, shirt, jeans)"
                  },
                  gender: {
                    type: "string",
                    description: "Target gender: men, women, unisex, or kids"
                  },
                  size: {
                    type: "string",
                    description: "The size of the product"
                  },
                  condition: {
                    type: "string",
                    description: "The condition of the product"
                  },
                  iswtb: {
                    type: "boolean",
                    description: "true if text contains product details and phrases like wtb or want to buy"
                  },
                  iswts: {
                    type: "boolean",
                    description: "true if text contains product details and phrases like wts or want to sell"
                  }
                },
                required: ["price", "brand", "productType", "gender", "size", "condition","iswtb","iswts"],
                additionalProperties: false
              }
            }
          }

  });

}

}
