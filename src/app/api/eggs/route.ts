import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { syncService } from '@/lib/sync';

function sanitizeString(str: string | undefined, maxLength = 200): string {
  if (!str) return '';
  return str.slice(0, maxLength).replace(/[<>]/g, '');
}

function validateEggInput(body: any): { valid: boolean; error?: string } {
  if (!body.farmId || typeof body.farmId !== 'string') {
    return { valid: false, error: 'Invalid farmId' };
  }
  if (!body.cageNo || typeof body.cageNo !== 'string') {
    return { valid: false, error: 'Cage number is required' };
  }
  if (!body.quantity || isNaN(parseInt(body.quantity))) {
    return { valid: false, error: 'Invalid quantity' };
  }
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = validateEggInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    const quantity = Math.abs(parseInt(body.quantity));
    const cracks = body.cracks ? Math.abs(parseInt(body.cracks)) : 0;
    
    if (cracks > quantity) {
      return NextResponse.json({ error: 'Cracks cannot exceed quantity' }, { status: 400 });
    }
    
    const record = {
      farm_id: sanitizeString(body.farmId),
      house_id: sanitizeString(body.houseId),
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      cage_no: sanitizeString(body.cageNo, 10).toUpperCase(),
      quantity,
      cracks,
      temperature: body.temperature ? Math.min(Math.max(parseFloat(body.temperature), -50), 100) : null,
      humidity: body.humidity ? Math.min(Math.max(parseFloat(body.humidity), 0), 100) : null,
      notes: sanitizeString(body.notes, 500),
    };

    const supabase = getSupabase();

    // Try Supabase first
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('egg_records')
        .insert(record)
        .select()
        .single();
      
      if (!error) {
        syncService.addToQueue('egg_records', 'create', record);
        return NextResponse.json(data);
      }
    }

    return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 });
  } catch (error) {
    console.error('Error creating egg record:', error);
    return NextResponse.json({ error: 'Failed to create egg record' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const farmId = searchParams.get('farmId');
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const cageNo = searchParams.get('cageNo');
  const export_ = searchParams.get('export');

  try {
    let records: any[] = [];
    const supabase = getSupabase();

    // Try Supabase first
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('egg_records').select('*');
      
      if (farmId) query = query.eq('farm_id', farmId);
      if (cageNo) query = query.eq('cage_no', cageNo);
      
      query = query.order('date', { ascending: false });
      
      const { data, error } = await query;
      if (!error) records = data || [];

      // Filter by month/year in memory if needed
      if (month && year) {
        const m = parseInt(month);
        const y = parseInt(year);
        records = records.filter(r => {
          const d = new Date(r.date);
          return d.getMonth() + 1 === m && d.getFullYear() === y;
        });
      }
    }

    if (export_ === 'csv') {
      const csvHeader = 'Date,Cage,Quantity,Cracks,Temperature,Humidity,Notes';
      const csvRows = records.map(r => 
        `${new Date(r.date).toISOString().split('T')[0]},${r.cage_no},${r.quantity},${r.cracks},${r.temperature || ''},${r.humidity || ''},"${r.notes || ''}"`
      );
      const csv = [csvHeader, ...csvRows].join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="eggs.csv"',
        },
      });
    }

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching egg records:', error);
    return NextResponse.json({ error: 'Failed to fetch egg records' }, { status: 500 });
  }
}
