import { Context } from "hono";
import { getPasswords } from "./utils";

export class SharedKV {
  private endpoint?: string;
  private password?: string;
  private localKV?: KVNamespace;
  
  constructor(c: Context<HonoCustomType>) {
    this.endpoint = c.env.BACKEND_URL;
    this.localKV = c.env.KV;
    
    // Auto-detect password: use first password from PASSWORDS if available
    const passwords = getPasswords(c);
    this.password = passwords && passwords.length > 0 ? passwords[0] : undefined;
  }
  
  private async callAPI(action: string, data: any) {
    if (!this.endpoint) {
      throw new Error('BACKEND_URL not configured');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Only add x-custom-auth if password is available
    if (this.password) {
      headers['x-custom-auth'] = this.password;
    }
    
    const res = await fetch(`${this.endpoint}/api/kv/${action}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`KV API error: ${res.status} ${text}`);
    }
    
    return res.json();
  }
  
  async get<T = any>(key: string, type: 'text' | 'json' = 'text'): Promise<T | null> {
    // Use local KV if no endpoint configured (Account 1)
    if (!this.endpoint && this.localKV) {
      if (type === 'json') {
        return this.localKV.get(key, 'json') as Promise<T | null>;
      }
      return this.localKV.get(key, 'text') as Promise<T | null>;
    }
    
    const result = await this.callAPI('get', { key, type }) as { value: T | null };
    return result.value;
  }
  
  async put(key: string, value: string): Promise<void> {
    if (!this.endpoint && this.localKV) {
      return this.localKV.put(key, value);
    }
    
    await this.callAPI('put', { key, value });
  }
  
  async delete(key: string): Promise<void> {
    if (!this.endpoint && this.localKV) {
      return this.localKV.delete(key);
    }
    
    await this.callAPI('delete', { key });
  }
  
  async list(options: { prefix: string }): Promise<{ keys: any[] }> {
    if (!this.endpoint && this.localKV) {
      return this.localKV.list(options);
    }
    
    const result = await this.callAPI('list', options) as { keys: any[] };
    return { keys: result.keys };
  }
}
