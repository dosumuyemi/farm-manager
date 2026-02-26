import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { syncService } from '@/lib/sync';

function sanitizeString(str: string | undefined, maxLength = 200): string {
  if (!str) return '';
  return str.slice(0, maxLength).replace(/[<>]/g, '');
}

function validateExpenseInput(body: any): { valid: boolean; error?: string } {
  if (!body.farmId || typeof body.farmId !== 'string') {
    return { valid: false, error: 'Invalid farmId' };
  }
  if (!body.amount || isNaN(parseFloat(body.amount))) {
    return { valid: false, error: 'Invalid amount' };
  }
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = validateExpenseInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    const record = {
      farm_id: sanitizeString(body.farmId),
      house_id: sanitizeString(body.houseId),
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      amount: Math.abs(parseFloat(body.amount)),
      sender: sanitizeString(body.sender),
      receiver: sanitizeString(body.receiver),
      purpose: sanitizeString(body.purpose),
      description: sanitizeString(body.description),
      type: sanitizeString(body.type, 20),
    };

    // Try Supabase first
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('financial_records')
        .insert(record)
        .select()
        .single();
      
      if (!error) {
        // Add to sync queue as backup
        syncService.addToQueue('financial_records', 'create', record);
        return NextResponse.json(data);
      }
    }

    // Fallback: local JSON (would need to be implemented)
    return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const farmId = searchParams.get('farmId');
  const type = searchParams.get('type');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const export_ = searchParams.get('export');

  try {
    let records: any[] = [];

    // Try Supabase first
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('financial_records').select('*');
      
      if (farmId) query = query.eq('farm_id', farmId);
      if (type && type !== 'income') query = query.eq('type', type);
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      
      query = query.order('date', { ascending: false });
      
      const { data, error } = await query;
      if (!error) records = data || [];
    }

    if (export_ === 'csv') {
      const csvHeader = 'Date,Type,Amount,Sender,Receiver,Purpose/Description';
      const csvRows = records.map(r => 
        `${new Date(r.date).toISOString().split('T')[0]},${r.type},${r.amount},"${r.sender}","${r.receiver}","${r.purpose || r.description}"`
      );
      const csv = [csvHeader, ...csvRows].join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="financial-records.csv"',
        },
      });
    }

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}
