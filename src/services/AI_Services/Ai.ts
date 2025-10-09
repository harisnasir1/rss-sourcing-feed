

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
    const parsed = JSON.parse(content);
  
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
              content: `You are a product information extraction assistant. Extract the following from product descriptions:
           - price: numeric value only (extract numbers, if no price found use 0)
           - brand: brand name
           - productType: type of product (e.g., "shoes", "shirt", "jeans", "hoodie")
           - gender: target gender ("men", "women", "unisex", or "kids")
           - size: size information
           - condition: condition ("new", "used", "like new", "good", "fair", etc.)
           - iswtb: true if text indicates the person WANTS TO BUY something. Look for phrases like:
             * "wtb" (want to buy)
             * "want to buy"
             * "i wanted to buy"
             * "looking for"
             * "anyone have this"
             * "anybody have this"
             * "does anyone have"
             * "ISO" (in search of)
             * "searching for"
           - iswts: true if text indicates the person WANTS TO SELL something. Look for phrases like:
             * "wts" (want to sell)
             * "want to sell"
             * "i wanted to sell"
             * "selling this"
             * "i am selling"
             * "for sale"
             * "available to order"
             * "it's available"
             * "available for purchase"
           
           If any field cannot be determined, use these defaults:
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
