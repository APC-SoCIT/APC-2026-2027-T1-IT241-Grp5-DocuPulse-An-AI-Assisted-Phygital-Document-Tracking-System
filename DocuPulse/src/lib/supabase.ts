import { createClient } from '@supabase/supabase-js';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://efhrtjfksxscummhjsmp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmaHJ0amZrc3hzY3VtbWhqc21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MjE2NzksImV4cCI6MjEwNjA5NzY3OX0.8fU8Z6tX0il2C0-0wIgQodytPEFokgFNqmw_z-p2pr4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DbRequisition {
  id: string;
  requisition_id?: string;
  title?: string;
  category?: string;
  justification?: string;
  description?: string;
  requestor_name?: string;
  requestor?: string;
  created_at?: string;
  status?: string;
  attachment_metadata?: { name: string; size: string; type: string }[];
  [key: string]: any;
}

export async function edgeCall(endpoint: string, method: string = 'POST', body?: Record<string, unknown>) {
  const functionName = endpoint.replace(/^\//, '');
  
  const { data, error } = await supabase.functions.invoke(functionName, {
    method: method as 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH',
    body,
  });

  if (error) {
    console.error(`[EdgeCall Error] ${method} ${endpoint}:`, error);
    throw error;
  }

  return data;
}